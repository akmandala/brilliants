import type { ParserResult } from '../types';
import CopyButton from './CopyButton';
import { addContentCartItem, cartItemFromResult, isPartInCart } from '../storage/contentCartStore';
import { useState } from 'react';

export default function ResultCard({
  result,
  sourceProjectId,
  sourceChatId,
  sourceMessageId,
  onCartChanged
}: {
  result: ParserResult;
  sourceProjectId?: string;
  sourceChatId?: string;
  sourceMessageId?: string;
  onCartChanged?: () => void;
}) {
  const [already, setAlready] = useState(isPartInCart(result.input?.mpn_original ?? result.identity?.mpn_normalized ?? ''));
  const addToCart = () => {
    const response = addContentCartItem(cartItemFromResult({ result, sourceProjectId, sourceChatId, sourceMessageId }));
    setAlready(!response.added || already);
    onCartChanged?.();
  };
  return (
    <div className="rounded-xl border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs dark:bg-blue-900">{result.classification.family}</span>
        <span className={`rounded-full px-2 py-1 text-xs ${result.classification.supported_family ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
          {result.classification.supported_family ? 'Supported' : 'Best Effort'}
        </span>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-zinc-500">Footprint</p>
          <div className="flex items-center justify-between gap-2"><code>{result.package.footprint_name}</code><CopyButton value={result.package.footprint_name} /></div>
        </div>
        <div><p className="text-zinc-500">MPN</p><p>{result.input.mpn_original}</p></div>
        <div><p className="text-zinc-500">Manufacturer</p><p>{result.identity.manufacturer ?? 'Unknown'}</p></div>
        <div>
          <p className="text-zinc-500">Altium Description</p>
          <div className="flex items-center justify-between gap-2"><span>{result.altium.description}</span><CopyButton value={result.altium.description} /></div>
        </div>
        <div>
          <p className="text-zinc-500">Confidence</p>
          <p>{Math.round((result.confidence.overall ?? 0) * 100)}%</p>
        </div>
        <button className="btn-primary" disabled={already} onClick={addToCart}>
          {already ? '✓ In Cart' : '+ Add to Content Cart'}
        </button>
        <div>
          <p className="text-zinc-500">Best LCSC/JLC match</p>
          {result.lcsc_jlc.best_match ? (
            <div className="flex items-center justify-between gap-2">
              <span>{result.lcsc_jlc.best_match.part_number} · {result.lcsc_jlc.best_match.source}</span>
              <CopyButton value={result.lcsc_jlc.best_match.part_number} label="Copy PN" />
            </div>
          ) : (
            <p>{result.lcsc_jlc.lookup_status} — {result.lcsc_jlc.search_query_english}</p>
          )}
        </div>
        {result.altium.pin_table_tsv && (
          <details>
            <summary className="cursor-pointer">Pin TSV</summary>
            <pre className="mt-2 overflow-auto rounded bg-zinc-100 p-2 text-xs dark:bg-zinc-800">{result.altium.pin_table_tsv}</pre>
            <CopyButton value={result.altium.pin_table_tsv} label="Copy TSV" />
          </details>
        )}
        <details>
          <summary className="cursor-pointer">JSON</summary>
          <pre className="mt-2 overflow-auto rounded bg-zinc-100 p-2 text-xs dark:bg-zinc-800">{JSON.stringify(result, null, 2)}</pre>
          <CopyButton value={JSON.stringify(result, null, 2)} label="Copy JSON" />
        </details>
        <details>
          <summary className="cursor-pointer">Review flags ({result.review_flags.length})</summary>
          <ul className="ml-5 list-disc text-xs">{result.review_flags.map((f) => <li key={f}>{f}</li>)}</ul>
        </details>
        {result.supporting_parts && result.supporting_parts.length > 0 && (
          <div className="mt-4 rounded border border-zinc-200 p-3 dark:border-zinc-700">
            <h4 className="font-medium">Suggested Supporting Parts</h4>
            <p className="mb-2 text-xs text-zinc-500">These are suggested from a hardcoded demo support BOM. Validate values against your design before release.</p>
            <div className="space-y-2">
              {result.supporting_parts.map((s, idx) => (
                <div key={`${s.input.mpn_original}-${idx}`} className="rounded border border-zinc-300 p-2 dark:border-zinc-700">
                  <div className="mb-1 text-xs">
                    <span className="rounded bg-zinc-200 px-2 py-0.5 dark:bg-zinc-800">{s.supportingPartMeta?.role ?? 'Supporting Part'}</span>
                    {s.supportingPartMeta?.quantity ? <span className="ml-2">Qty: {s.supportingPartMeta.quantity}</span> : null}
                  </div>
                  <ResultCard result={s} sourceProjectId={sourceProjectId} sourceChatId={sourceChatId} sourceMessageId={sourceMessageId} onCartChanged={onCartChanged} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
