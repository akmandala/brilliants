import type { Chat } from '../types';
import { examplePrompts } from '../data/examples';
import ResultCard from './ResultCard';

export default function ChatView({ chat }: { chat?: Chat }) {
  if (!chat) return <div className="p-4">Select a chat.</div>;

  if (chat.messages.length === 0) {
    return (
      <div className="p-6 text-sm text-zinc-500">
        <p className="mb-2 text-base font-medium">Try an example:</p>
        <ul className="ml-5 list-disc">{examplePrompts.map((e) => <li key={e.mpn}>{e.name} — <code>{e.mpn}</code></li>)}</ul>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {chat.messages.map((m) => (
        <div key={m.id} className={`max-w-4xl ${m.role === 'user' ? 'ml-auto' : ''}`}>
          {m.role === 'user' && m.input && (
            <div className="rounded-xl bg-zinc-200 p-4 text-sm dark:bg-zinc-800">
              <p><strong>MPN:</strong> {m.input.mpn}</p>
              {m.input.datasheetFileName && <p><strong>PDF:</strong> {m.input.datasheetFileName}</p>}
              {m.input.manufacturerUrl && <p><strong>URL:</strong> {m.input.manufacturerUrl}</p>}
            </div>
          )}
          {m.role === 'assistant' && m.result && <ResultCard result={m.result} />}
        </div>
      ))}
    </div>
  );
}
