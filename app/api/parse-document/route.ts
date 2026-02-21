import { NextRequest, NextResponse } from 'next/server';
import { processDocument } from '@/document_parser/ocrService';
import { extractProfileData, mapExtractedDataToForm } from '@/document_parser/profileExtractor';
import { DocumentType, MappedFormData } from '@/document_parser/types/profileData';

/**
 * POST /api/parse-document
 *
 * Accepts multipart/form-data with:
 *   - file        : the uploaded document (File)
 *   - documentType: one of resume | marksheet | idproof | income | category | disability
 *
 * Always returns 200. If parsing fails for any reason the response will be
 * { success: true, data: {}, warning: "reason" } so the upload flow is never blocked.
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const documentType = formData.get('documentType') as DocumentType | null;

        if (!file || !documentType) {
            return NextResponse.json(
                { success: false, error: 'Missing file or documentType' },
                { status: 400 }
            );
        }

        console.log(`📄 [parse-document] "${file.name}" | type=${file.type} | docType=${documentType}`);

        // ── Step 1: Extract text ────────────────────────────────────────────────
        let extracted: { text: string; source: string; fileName: string };
        try {
            extracted = await processDocument(file);
            console.log(`✅ [parse-document] Text extracted (${extracted.text.length} chars via ${extracted.source})`);
        } catch (ocrErr) {
            const ocrMsg = ocrErr instanceof Error ? ocrErr.message : String(ocrErr);
            console.warn(`⚠️ [parse-document] Text extraction failed: ${ocrMsg}`);
            // Document was already uploaded to Cloudinary — don't block with 500.
            // Return empty form data so the upload still registers.
            return NextResponse.json({
                success: true,
                data: {},
                warning: `Text could not be extracted: ${ocrMsg}`,
            });
        }

        // ── Step 2: AI profile extraction ──────────────────────────────────────
        let mappedData: MappedFormData = {};
        try {
            const extractionResult = await extractProfileData(extracted.text, documentType);
            mappedData = mapExtractedDataToForm(extractionResult.data);
            console.log(`✅ [parse-document] Mapped fields:`, Object.keys(mappedData));
        } catch (llmErr) {
            const llmMsg = llmErr instanceof Error ? llmErr.message : String(llmErr);
            console.warn(`⚠️ [parse-document] LLM extraction failed: ${llmMsg}`);
            // Same — don't block the upload with 500.
            return NextResponse.json({
                success: true,
                data: {},
                warning: `AI parsing failed: ${llmMsg}`,
            });
        }

        return NextResponse.json({ success: true, data: mappedData });

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ [parse-document] Unexpected error:`, message);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
