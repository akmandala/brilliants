import type { ParserResult } from '../types';
import CopyButton from './CopyButton';

export default function ResultCard({ result }: { result: ParserResult }) {
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
        <div>
          <p className="text-zinc-500">Altium Description</p>
          <div className="flex items-center justify-between gap-2"><span>{result.altium.description}</span><CopyButton value={result.altium.description} /></div>
        </div>
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
      </div>
    </div>
  );
}
