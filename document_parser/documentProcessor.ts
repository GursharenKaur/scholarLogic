import { processDocument } from './ocrService';
import { extractProfileData, mapExtractedDataToForm } from './profileExtractor';
import { DocumentType, MappedFormData, ExtractionResult } from './types/profileData';

export class DocumentProcessor {
  private processingQueue = new Map();
  private cache = new Map();

  async processUploadedDocument(file: File, documentType: DocumentType): Promise<MappedFormData> {
    const cacheKey = `${file.name}_${file.size}_${documentType}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`📋 Using cached result for ${file.name}`);
      return this.cache.get(cacheKey);
    }

    try {
      console.log(`🚀 Starting processing for ${file.name} (${documentType})`);
      
      // Step 1: Extract text using Mega LLM OCR
      const extractedText = await processDocument(file);
      
      // Step 2: Extract structured data using Mega LLM
      const extractionResult = await extractProfileData(extractedText.text, documentType);
      
      // Step 3: Map to form fields
      const mappedData = mapExtractedDataToForm(extractionResult.data);
      
      // Cache the result
      this.cache.set(cacheKey, mappedData);
      
      console.log(`✅ Successfully processed ${file.name}`);
      return mappedData;

    } catch (error) {
      console.error(`❌ Failed to process ${file.name}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async processMultipleDocuments(files: Map<DocumentType, File>): Promise<MappedFormData> {
    const results = new Map<DocumentType, MappedFormData>();
    const processingPromises = [];

    // Process all documents in parallel
    for (const [documentType, file] of files) {
      if (file) {
        processingPromises.push(
          this.processUploadedDocument(file, documentType)
            .then(result => results.set(documentType, result))
            .catch(error => console.error(`Failed to process ${documentType}:`, error))
        );
      }
    }

    await Promise.all(processingPromises);
    
    // Merge all results, prioritizing more reliable sources
    return this.mergeExtractionResults(results);
  }

  private mergeExtractionResults(results: Map<DocumentType, MappedFormData>): MappedFormData {
    const merged: MappedFormData = {};

    // Priority order for data sources
    const priority: DocumentType[] = ['idproof', 'resume', 'marksheet', 'income'];

    for (const source of priority) {
      const data = results.get(source);
      if (data) {
        // Merge fields, only if they don't already exist
        Object.keys(data).forEach(key => {
          const fieldKey = key as keyof MappedFormData;
          if (!merged[fieldKey] && data[fieldKey]) {
            (merged as any)[fieldKey] = data[fieldKey];
          }
        });
      }
    }

    return merged;
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Document processor cache cleared');
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const documentProcessor = new DocumentProcessor();

// Utility function for form integration
export async function extractAndMapFormData(file: File, documentType: DocumentType): Promise<{
  success: boolean;
  data?: MappedFormData;
  error?: string;
  confidence?: number;
}> {
  try {
    const mappedData = await documentProcessor.processUploadedDocument(file, documentType);
    
    return {
      success: true,
      data: mappedData,
      confidence: 0.85 // Default confidence score
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
