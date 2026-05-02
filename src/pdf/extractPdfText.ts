import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorker;

export interface ExtractedPdf {
  text: string;
  pageCount: number;
}

export const extractPdfText = async (file: File): Promise<ExtractedPdf> => {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const chunks: string[] = [];

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    chunks.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
  }

  return { text: chunks.join('\n'), pageCount: pdf.numPages };
};
