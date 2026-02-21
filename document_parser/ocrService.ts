/**
 * ocrService.ts
 *
 * Extraction pipeline:
 *
 *  PDF (text-layer)  →  pdf-parse v1.1.1        (fast, embedded text)
 *  PDF (scanned)     →  pdfjs-dist (render page to RGBA buffer)
 *                     + sharp     (RGBA buffer → PNG)
 *                     + Tesseract.js (OCR the PNG)
 *  Image             →  Tesseract.js             (local OCR, no API needed)
 *
 * All processing is server-side only. No native binary dependencies beyond
 * the sharp package already shipped with Next.js.
 */

const MIN_TEXT_LENGTH = 10; // chars; below this we treat the PDF as scanned

// ─────────────────────────────────────────────────────────────────────────────
// PDF — fast path: embedded text via pdf-parse
// ─────────────────────────────────────────────────────────────────────────────
export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  // ── Step 1: Try the embedded text layer ──────────────────────────────────
  let pdfParseText = '';
  try {
    const { createRequire } = await import('module');
    const req = createRequire(process.cwd() + '/package.json');
    const pdfParse = req('pdf-parse') as (
      buf: Buffer,
      opts?: object
    ) => Promise<{ text: string; numpages: number }>;

    console.log('📄 [PDF] Trying pdf-parse text-layer extraction...');
    const data = await pdfParse(Buffer.from(buffer));
    pdfParseText = data.text?.trim() ?? '';
    console.log(`   → ${pdfParseText.length} chars from ${data.numpages} page(s)`);
  } catch (err) {
    console.warn('⚠️  pdf-parse error — will try OCR fallback:', (err as Error).message);
  }

  if (pdfParseText.length >= MIN_TEXT_LENGTH) {
    console.log('✅ [PDF] Text-layer extraction succeeded');
    return pdfParseText;
  }

  // ── Step 2: Fallback — render each page and OCR it ───────────────────────
  console.log(
    '🔄 [PDF] Text layer is empty/missing (scanned PDF). ' +
    'Falling back to pdfjs-dist → sharp → Tesseract OCR...'
  );
  return extractTextFromScannedPDF(buffer);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF — OCR fallback: pdfjs-dist renders pages, sharp converts, Tesseract reads
// ─────────────────────────────────────────────────────────────────────────────
async function extractTextFromScannedPDF(buffer: ArrayBuffer): Promise<string> {
  // pdfjs-dist v4 ships as pure ESM; dynamic import keeps us CJS-compatible
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // In Node.js there is no DOM worker — disable the worker thread entirely
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    disableRange: true,
    disableStream: true,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages: number = pdfDoc.numPages;
  console.log(`   → ${numPages} page(s) to OCR`);

  // sharp is used to convert raw RGBA → PNG (already in Next.js dependencies)
  const sharp = (await import('sharp')).default;
  const { recognize } = await import('tesseract.js');

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    console.log(`   �️  Rendering page ${pageNum}/${numPages}...`);
    const page = await pdfDoc.getPage(pageNum);

    // Scale 2× → ~150 DPI for typical PDFs — good OCR accuracy
    const viewport = page.getViewport({ scale: 2.0 });
    const width = Math.ceil(viewport.width);
    const height = Math.ceil(viewport.height);

    // Raw RGBA pixel buffer (width × height × 4 bytes)
    const rgbaBuffer = new Uint8ClampedArray(width * height * 4);

    // pdfjs-dist can render into a plain JS object that satisfies its
    // internal RenderParameters contract when we provide canvasContext +
    // canvas (for size) + viewport.
    const fakeContext = {
      // ── Canvas size (pdfjs reads these) ────────────────────────────────
      canvas: { width, height },

      // ── Minimal 2D context implementation ──────────────────────────────
      // pdfjs-dist accesses only a small subset of CanvasRenderingContext2D.
      // We implement exactly what the renderer needs.
      _rgbaBuffer: rgbaBuffer,
      _width: width,

      save() { /* no-op */ },
      restore() { /* no-op */ },
      scale() { /* no-op */ },
      rotate() { /* no-op */ },
      translate() { /* no-op */ },
      transform() { /* no-op */ },
      beginPath() { /* no-op */ },
      closePath() { /* no-op */ },
      moveTo() { /* no-op */ },
      lineTo() { /* no-op */ },
      stroke() { /* no-op */ },
      fill() { /* no-op */ },
      clip() { /* no-op */ },
      rect() { /* no-op */ },
      clearRect() { /* no-op */ },
      fillRect(x: number, y: number, w: number, h: number) {
        // Used by pdfjs to fill the white background — we fill RGBA white
        const [r, g, b, a] = [255, 255, 255, 255];
        for (let row = y; row < y + h && row < height; row++) {
          for (let col = x; col < x + w && col < width; col++) {
            const idx = (row * width + col) * 4;
            rgbaBuffer[idx] = r;
            rgbaBuffer[idx + 1] = g;
            rgbaBuffer[idx + 2] = b;
            rgbaBuffer[idx + 3] = a;
          }
        }
      },
      putImageData(imageData: { data: Uint8ClampedArray }, dx: number, dy: number) {
        const src = imageData.data;
        const srcW = imageData instanceof Object && 'width' in imageData
          ? (imageData as { width: number }).width
          : width;
        for (let i = 0; i < src.length; i += 4) {
          const srcPixel = i / 4;
          const srcRow = Math.floor(srcPixel / srcW);
          const srcCol = srcPixel % srcW;
          const dstRow = srcRow + dy;
          const dstCol = srcCol + dx;
          if (dstRow < 0 || dstRow >= height || dstCol < 0 || dstCol >= width) continue;
          const dstIdx = (dstRow * width + dstCol) * 4;
          rgbaBuffer[dstIdx] = src[i];
          rgbaBuffer[dstIdx + 1] = src[i + 1];
          rgbaBuffer[dstIdx + 2] = src[i + 2];
          rgbaBuffer[dstIdx + 3] = src[i + 3];
        }
      },
      createImageData(w: number, h: number) {
        return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
      },
      getImageData(x: number, y: number, w: number, h: number) {
        const out = new Uint8ClampedArray(w * h * 4);
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
            const srcIdx = ((y + row) * width + (x + col)) * 4;
            const dstIdx = (row * w + col) * 4;
            out[dstIdx] = rgbaBuffer[srcIdx];
            out[dstIdx + 1] = rgbaBuffer[srcIdx + 1];
            out[dstIdx + 2] = rgbaBuffer[srcIdx + 2];
            out[dstIdx + 3] = rgbaBuffer[srcIdx + 3];
          }
        }
        return { data: out, width: w, height: h };
      },
      drawImage() { /* no-op — handles embedded raster images in PDF */ },
      setTransform() { /* no-op */ },
      resetTransform() { /* no-op */ },
      createPattern() { return null; },
      createLinearGradient() {
        return { addColorStop() { } };
      },
      createRadialGradient() {
        return { addColorStop() { } };
      },
      measureText() { return { width: 0 }; },
      fillText() { /* no-op */ },
      strokeText() { /* no-op */ },
      quadraticCurveTo() { /* no-op */ },
      bezierCurveTo() { /* no-op */ },
      arc() { /* no-op */ },
      arcTo() { /* no-op */ },
      ellipse() { /* no-op */ },
      isPointInPath() { return false; },

      // Properties pdfjs reads/writes
      fillStyle: '#ffffff',
      strokeStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      shadowBlur: 0,
      shadowColor: 'rgba(0,0,0,0)',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      imageSmoothingEnabled: true,
      lineDashOffset: 0,
      setLineDash() { /* no-op */ },
      getLineDash() { return []; },
    };

    // Fill entire buffer with white before rendering
    rgbaBuffer.fill(255);

    await page.render({
      canvasContext: fakeContext as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;

    // Convert raw RGBA buffer → PNG via sharp (no native canvas needed)
    const pngBuffer = await sharp(Buffer.from(rgbaBuffer.buffer), {
      raw: { width, height, channels: 4 },
    })
      .png()
      .toBuffer();

    const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;

    console.log(`   🔍 Tesseract OCR on page ${pageNum}...`);
    const result = await recognize(dataUrl, 'eng', { logger: () => { } });
    const pageText = result.data.text?.trim() ?? '';
    console.log(`   ✅ Page ${pageNum}: ${pageText.length} chars`);
    pageTexts.push(pageText);
  }

  const fullText = pageTexts.join('\n\n--- PAGE BREAK ---\n\n').trim();

  if (fullText.length < MIN_TEXT_LENGTH) {
    throw new Error(
      'OCR could not extract readable text from this scanned PDF. ' +
      'Try a higher-resolution scan, or upload as JPG/PNG.'
    );
  }

  console.log(`✅ [Scanned PDF OCR] ${fullText.length} total chars from ${numPages} page(s)`);
  return fullText;
}

// ─────────────────────────────────────────────────────────────────────────────
// Image — Tesseract OCR
// ─────────────────────────────────────────────────────────────────────────────
export async function extractTextFromImage(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  console.log('🔍 Running Tesseract OCR on uploaded image...');

  const { recognize } = await import('tesseract.js');
  const dataUrl = `data:${mimeType};base64,${Buffer.from(buffer).toString('base64')}`;

  const result = await recognize(dataUrl, 'eng', { logger: () => { } });
  const text = result.data.text?.trim() ?? '';

  if (text.length < MIN_TEXT_LENGTH) {
    throw new Error('Tesseract could not extract enough text — try a higher-resolution image.');
  }

  console.log(`✅ Image OCR: ${text.length} chars`);
  return text;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry — routes to the correct extractor based on file MIME type
// ─────────────────────────────────────────────────────────────────────────────
export async function processDocument(file: File): Promise<{
  text: string;
  source: 'pdf' | 'image';
  fileName: string;
}> {
  const fileBuffer = await file.arrayBuffer();
  const fileType = file.type;

  if (fileType === 'application/pdf') {
    // Handles both text-layer PDFs and scanned/image-only PDFs automatically
    const text = await extractTextFromPDF(fileBuffer);
    return { text, source: 'pdf', fileName: file.name };
  } else if (fileType.startsWith('image/')) {
    const text = await extractTextFromImage(fileBuffer, fileType);
    return { text, source: 'image', fileName: file.name };
  } else {
    throw new Error(`Unsupported file type: ${fileType}. Upload a PDF, JPG, or PNG.`);
  }
}
