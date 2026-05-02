import type { ContentCartItem } from '../types';

export default function ContentCartDialog({
  open,
  items,
  onClose,
  onRemove,
  onClear,
  downloadUrl
}: {
  open: boolean;
  items: ContentCartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  downloadUrl: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-xl overflow-auto bg-white p-4 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Content Cart</h2>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
        <p className="mb-3 text-xs text-zinc-500">MVP note: this downloads a hosted sample Altium Content Cart file. Dynamic cart generation will be added later.</p>
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="rounded border border-zinc-300 p-2 text-sm dark:border-zinc-700">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{i.mpn}</p>
                  <p>{i.manufacturer}</p>
                  <p>{i.family} · {i.componentType}</p>
                  <p><code>{i.footprintName}</code></p>
                  <p>{i.description}</p>
                  <p className="text-xs text-zinc-500">Role: {i.role === 'main' ? 'Main Part' : i.supportRole ?? 'Supporting Part'}</p>
                </div>
                <button className="btn-secondary" onClick={() => onRemove(i.id)}>Remove</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-zinc-500">No items in cart yet.</p>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={onClear}>Clear cart</button>
          <a className="btn-primary" href={downloadUrl} download>Download Altium Content Cart</a>
        </div>
      </div>
    </div>
  );
}
