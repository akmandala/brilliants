import { useEffect, useMemo, useState } from 'react';
import Composer from './components/Composer';
import ChatView from './components/ChatView';
import Sidebar from './components/Sidebar';
import { parserResultSchema } from './schemas';
import { addChat, addProject, createDefaultWorkspace, exportWorkspace, importWorkspace, loadWorkspace, saveWorkspace, upsertMessage } from './storage/workspaceStore';
import type { ParserInput, ParserResult, Workspace } from './types';

const api = (name: string) => `/.netlify/functions/${name}`;

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>(() => loadWorkspace());
  const [busy, setBusy] = useState(false);

  useEffect(() => saveWorkspace(workspace), [workspace]);

  const selectedChat = useMemo(() => (workspace.selectedChatId ? workspace.chats[workspace.selectedChatId] : undefined), [workspace]);
  const selectedProject = useMemo(
    () => (workspace.selectedProjectId ? workspace.projects[workspace.selectedProjectId] : undefined),
    [workspace]
  );

  const parse = async (input: ParserInput, setStatus: (s: string) => void) => {
    if (!workspace.selectedChatId) return;
    setWorkspace((prev) => upsertMessage({ ...prev }, workspace.selectedChatId!, { role: 'user', input }));
    setBusy(true);
    try {
      let urlText = '';
      if (input.manufacturerUrl) {
        setStatus('Fetching URL');
        const fr = await fetch(api('fetch-url'), { method: 'POST', body: JSON.stringify({ url: input.manufacturerUrl }) });
        const fj = (await fr.json()) as { text?: string };
        urlText = fj.text ?? '';
      }
      setStatus('Parsing component');
      const parseRes = await fetch(api('parse'), { method: 'POST', body: JSON.stringify({ input, manufacturerPageText: urlText }) });
      const parsed = (await parseRes.json()) as ParserResult;
      const valid = parserResultSchema.safeParse(parsed);
      const fallback: ParserResult = valid.success
        ? valid.data
        : {
            ...parsed,
            review_flags: [...(parsed.review_flags ?? []), 'AI_RESULT_INVALID']
          };

      setStatus('Looking up LCSC/JLC');
      const lookupRes = await fetch(api('lookup-lcsc-jlc'), {
        method: 'POST',
        body: JSON.stringify({ mpn: input.mpn, manufacturer: input.manufacturer, description: fallback.altium.description, family: fallback.classification.family })
      });
      const lookupJson = (await lookupRes.json()) as ParserResult['lcsc_jlc'];
      fallback.lcsc_jlc = lookupJson;

      setWorkspace((prev) => upsertMessage({ ...prev }, workspace.selectedChatId!, { role: 'assistant', result: fallback }));
    } catch (error) {
      setWorkspace((prev) => upsertMessage({ ...prev }, workspace.selectedChatId!, { role: 'system', text: `Error: ${(error as Error).message}` }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        workspace={workspace}
        onSelectProject={(id) =>
          setWorkspace((w) => {
            const project = w.projects[id];
            if (!project) return w;
            return { ...w, selectedProjectId: id, selectedChatId: project.chatIds[0] };
          })
        }
        onSelectChat={(id) => setWorkspace((w) => ({ ...w, selectedChatId: id }))}
        onCreateProject={() => setWorkspace((w) => addProject({ ...w }))}
        onCreateChat={() => selectedProject && setWorkspace((w) => addChat({ ...w }, selectedProject.id))}
        onRenameProject={(id, name) =>
          setWorkspace((w) => {
            const project = w.projects[id];
            if (!project) return w;
            return { ...w, projects: { ...w.projects, [id]: { ...project, name } } };
          })
        }
        onRenameChat={(id, name) =>
          setWorkspace((w) => {
            const chat = w.chats[id];
            if (!chat) return w;
            return { ...w, chats: { ...w.chats, [id]: { ...chat, name } } };
          })
        }
        onDeleteProject={(id) =>
          setWorkspace((w) => {
            const next = { ...w, projects: { ...w.projects }, chats: { ...w.chats } };
            const project = next.projects[id];
            if (!project) return w;
            project.chatIds.forEach((cid) => delete next.chats[cid]);
            delete next.projects[id];
            const remainingProjectIds = Object.keys(next.projects);
            if (!remainingProjectIds.length) return createDefaultWorkspace();
            const firstProjectId = remainingProjectIds[0];
            if (!firstProjectId) return createDefaultWorkspace();
            const firstProject = next.projects[firstProjectId];
            next.selectedProjectId = firstProjectId;
            next.selectedChatId = firstProject?.chatIds[0];
            return next;
          })
        }
        onDeleteChat={(id) =>
          setWorkspace((w) => {
            if (!w.selectedProjectId) return w;
            const next = { ...w, projects: { ...w.projects }, chats: { ...w.chats } };
            const project = next.projects[w.selectedProjectId];
            if (!project) return w;
            project.chatIds = project.chatIds.filter((cid) => cid !== id);
            delete next.chats[id];
            if (project.chatIds.length === 0) return addChat(next, project.id, 'Chat 1');
            next.selectedChatId = project.chatIds[0];
            return next;
          })
        }
        onExport={() => {
          const blob = new Blob([exportWorkspace(workspace)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'component-parser-workspace.json';
          a.click();
        }}
        onImport={async (file) => {
          const text = await file.text();
          setWorkspace(importWorkspace(text));
        }}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-auto"><ChatView chat={selectedChat} /></div>
        <Composer onSubmit={parse} disabled={busy || !workspace.selectedChatId} />
      </main>
    </div>
  );
}
