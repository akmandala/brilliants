import type { Workspace } from '../types';

interface Props {
  workspace: Workspace;
  onSelectProject: (id: string) => void;
  onSelectChat: (id: string) => void;
  onCreateProject: () => void;
  onCreateChat: () => void;
  onRenameProject: (id: string, name: string) => void;
  onRenameChat: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export default function Sidebar(props: Props) {
  const project = props.workspace.selectedProjectId ? props.workspace.projects[props.workspace.selectedProjectId] : undefined;
  return (
    <aside className="flex h-full w-80 flex-col border-r border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="mb-3 text-lg font-semibold">Component Parser Workspace</h1>
      <button className="btn-primary mb-2" onClick={props.onCreateProject}>New Project</button>
      <div className="space-y-1 overflow-auto">
        {Object.values(props.workspace.projects).map((p) => (
          <div key={p.id} className={`rounded p-2 ${p.id === props.workspace.selectedProjectId ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}>
            <div className="flex items-center gap-1">
              <button className="flex-1 text-left" onClick={() => props.onSelectProject(p.id)}>{p.name}</button>
              <button onClick={() => { const n = prompt('Rename project', p.name); if (n) props.onRenameProject(p.id, n); }}>✎</button>
              <button onClick={() => confirm('Delete project?') && props.onDeleteProject(p.id)}>🗑</button>
            </div>
          </div>
        ))}
      </div>
      <hr className="my-3 border-zinc-300 dark:border-zinc-700" />
      <button className="btn-secondary mb-2" onClick={props.onCreateChat} disabled={!project}>New Chat</button>
      <div className="space-y-1 overflow-auto">
        {project?.chatIds.map((chatId) => {
          const chat = props.workspace.chats[chatId];
          if (!chat) return null;
          return (
            <div key={chat.id} className={`rounded p-2 ${chat.id === props.workspace.selectedChatId ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}>
              <div className="flex items-center gap-1">
                <button className="flex-1 text-left" onClick={() => props.onSelectChat(chat.id)}>{chat.name}</button>
                <button onClick={() => { const n = prompt('Rename chat', chat.name); if (n) props.onRenameChat(chat.id, n); }}>✎</button>
                <button onClick={() => confirm('Delete chat?') && props.onDeleteChat(chat.id)}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-auto space-y-2 pt-4">
        <button className="btn-secondary w-full" onClick={props.onExport}>Export workspace</button>
        <label className="btn-secondary block w-full cursor-pointer text-center">
          Import workspace
          <input className="hidden" type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && props.onImport(e.target.files[0])} />
        </label>
      </div>
    </aside>
  );
}
