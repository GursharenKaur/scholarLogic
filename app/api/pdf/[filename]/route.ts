import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    console.log('PDF Request - Filename:', filename);
    
    // Security: Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      console.log('PDF Request - Invalid filename:', filename);
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'ai_pipeline', 'pdfs', filename);
    console.log('PDF Request - Full path:', filePath);
    
    // Read the PDF file
    const fileBuffer = await readFile(filePath);
    console.log('PDF Request - File size:', fileBuffer.length);
    
    // Return the PDF with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
  }
}
