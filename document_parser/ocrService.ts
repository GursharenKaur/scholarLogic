/**
 * ocrService.ts
 *
 * • PDF   → pdf-parse v1.1.1  (reads embedded text layer, pure Node.js)
 * • Image → Tesseract.js       (local OCR, no external API)
 *
 * Extracted plain text is passed to profileExtractor.ts which calls the
 * MegaLLM text-only chat/completions endpoint — no vision model needed.
 */

export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  // pdf-parse v1.1.1 exports module.exports = async function(buffer, options)
  // createRequire with process.cwd() reliably loads it from project root
  const { createRequire } = await import('module');
  const req = createRequire(process.cwd() + '/package.json');
  const pdfParse = req('pdf-parse') as (buf: Buffer, opts?: object) => Promise<{ text: string; numpages: number }>;

  console.log('📄 Parsing PDF with pdf-parse v1.1.1...');
  const data = await pdfParse(Buffer.from(buffer));
  const text = data.text?.trim() ?? '';

  if (text.length < 10) {
    throw new Error(
      'Could not extract readable text — this PDF may be image-only. Upload as JPG/PNG instead.'
    );
  }

  console.log(`✅ PDF: ${text.length} chars from ${data.numpages} page(s)`);
  return text;
}

export async function extractTextFromImage(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  console.log('🔍 Running Tesseract OCR...');

  const { recognize } = await import('tesseract.js');
  const dataUrl = `data:${mimeType};base64,${Buffer.from(buffer).toString('base64')}`;

  const result = await recognize(dataUrl, 'eng', { logger: () => { } });
  const text = result.data.text?.trim() ?? '';

  if (text.length < 10) {
    throw new Error('Tesseract could not extract enough text — try a higher-resolution image.');
  }

  console.log(`✅ Image OCR: ${text.length} chars`);
  return text;
}

export async function processDocument(file: File): Promise<{
  text: string;
  source: 'pdf' | 'image';
  fileName: string;
}> {
  const fileBuffer = await file.arrayBuffer();
  const fileType = file.type;

  if (fileType === 'application/pdf') {
    const text = await extractTextFromPDF(fileBuffer);
    return { text, source: 'pdf', fileName: file.name };
  } else if (fileType.startsWith('image/')) {
    const text = await extractTextFromImage(fileBuffer, fileType);
    return { text, source: 'image', fileName: file.name };
  } else {
    throw new Error(`Unsupported file type: ${fileType}. Upload a PDF, JPG, or PNG.`);
  }
}
