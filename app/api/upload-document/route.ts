import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

/**
 * POST /api/upload-document
 *
 * Accepts multipart/form-data:
 *   - file    : the File to store
 *   - docType : e.g. "resume" | "marksheet" | "idproof" | "income" | ...
 *
 * Uploads the file to Cloudinary under scholar/documents/<userId>/
 * and returns the secure HTTPS URL so the client can reference it later.
 */
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as string | null;

    if (!file || !docType) {
        return NextResponse.json({ success: false, error: 'Missing file or docType' }, { status: 400 });
    }

    // 10 MB per file cap
    if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: 'File too large (max 10 MB)' }, { status: 413 });
    }

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const folder = `scholar/documents/${userId}`;
        const { url, publicId } = await uploadToCloudinary(buffer, file.name, folder);

        console.log(`✅ [upload-document] Uploaded ${docType} → ${url}`);

        return NextResponse.json({
            success: true,
            url,
            publicId,
            fileName: file.name,
            docType,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[upload-document] Cloudinary error:', msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
