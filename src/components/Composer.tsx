import { useState } from 'react';
import { extractPdfText } from '../pdf/extractPdfText';
import type { ParserInput } from '../types';

export default function Composer({ onSubmit, disabled }: { onSubmit: (input: ParserInput, status: (s: string) => void) => Promise<void>; disabled?: boolean }) {
  const [mpn, setMpn] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [manufacturerUrl, setManufacturerUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File>();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  return (
    <form
      className="border-t border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!mpn.trim()) return;
        setLoading(true);
        try {
          let datasheetText: string | undefined;
          let datasheetPageCount: number | undefined;
          if (pdfFile) {
            setStatus('Extracting PDF text');
            const extracted = await extractPdfText(pdfFile);
            datasheetText = extracted.text;
            datasheetPageCount = extracted.pageCount;
          }
          setStatus('Parsing component');
          await onSubmit(
            { mpn: mpn.trim(), manufacturer: manufacturer || undefined, manufacturerUrl: manufacturerUrl || undefined, datasheetFileName: pdfFile?.name, datasheetText, datasheetPageCount },
            setStatus
          );
          setMpn('');
          setPdfFile(undefined);
        } finally {
          setLoading(false);
          setStatus('');
        }
      }}
    >
      <div className="grid gap-2 md:grid-cols-5">
        <input className="input md:col-span-2" placeholder="Required MPN" value={mpn} onChange={(e) => setMpn(e.target.value)} required />
        <input className="input" placeholder="Manufacturer URL (optional)" value={manufacturerUrl} onChange={(e) => setManufacturerUrl(e.target.value)} />
        <input className="input" placeholder="Manufacturer (optional)" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
        <label className="input flex cursor-pointer items-center justify-center">
          {pdfFile ? `PDF: ${pdfFile.name}` : 'Drop/select PDF'}
          <input className="hidden" type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0])} />
        </label>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-zinc-500">{status}</p>
        <button className="btn-primary" disabled={loading || disabled}>{loading ? 'Working...' : 'Parse component'}</button>
      </div>
    </form>
  );
}
