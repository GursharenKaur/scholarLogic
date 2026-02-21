# Document Parser - Mega LLM Integration

## 🚀 Overview
This system uses Mega LLM API to automatically extract user profile information from uploaded documents and auto-fill the onboarding form.

## 📋 Setup Instructions

### 1. Environment Variables
Add to your `.env.local` file:
```env
MEGA_LLM_API_KEY=your_mega_llm_api_key_here
```

### 2. Install Dependencies
```bash
cd document_parser
npm install
```

### 3. Document Processing Flow
1. User uploads document (PDF/JPG/PNG)
2. Mega LLM OCR extracts text
3. Mega LLM analyzes and extracts structured data
4. Form fields auto-populate with extracted information
5. User reviews and edits if needed

## 🎯 Supported Documents

### Resume/CV
- Extracts: Name, email, phone, education, experience, skills
- Auto-fills: name, university, course, graduationYear, cgpa

### Mark Sheet
- Extracts: Institution, degree, year, CGPA, subjects
- Auto-fills: university, educationLevel, course, graduationYear, cgpa

### ID Proof
- Extracts: Name, DOB, address, gender, document details
- Auto-fills: name, dateOfBirth, gender

### Income Certificate
- Extracts: Annual income, family size, source
- Auto-fills: income

## 🔧 Integration Points

### Frontend (app/onboarding/page.tsx)
- `handleFileUpload()` - Triggers processing on file upload
- `autoFillForm()` - Populates form fields with extracted data
- Visual feedback with green highlighting

### Backend Components
- `config.js` - API configuration
- `ocrService.js` - Text extraction using Mega LLM
- `profileExtractor.js` - Structured data extraction
- `documentProcessor.ts` - Main processing orchestration

## ⚡ Features

### Smart Caching
- Results cached to avoid reprocessing same documents
- Cache key based on file name, size, and document type

### Error Handling
- Graceful fallback to manual entry if extraction fails
- Partial success handling (fills whatever data is extracted)

### Visual Feedback
- Auto-filled fields highlighted in green
- Success notifications
- Processing indicators

### Data Validation
- Type checking and format validation
- Confidence scoring for extracted data
- Priority-based merging from multiple documents

## 🎨 User Experience

1. **Upload Document** → Processing starts automatically
2. **Mega LLM Analysis** → 2-5 seconds processing time
3. **Auto-Fill** → Fields populate with extracted data
4. **Visual Feedback** → Green highlighting shows auto-filled fields
5. **User Review** → Edit any incorrect information
6. **Submit** → Complete profile with verified data

## 🔍 Technical Details

### Mega LLM API Usage
- OCR endpoint: `/v1/ocr` for text extraction
- Chat endpoint: `/v1/chat/completions` for structured data extraction
- JSON response mode for structured output

### Document Type Detection
- Automatic routing based on file type and content
- Specialized prompts for each document type
- Priority-based data merging (ID proof > Resume > Mark sheet > Income)

### Performance Optimizations
- Parallel processing of multiple documents
- Result caching to avoid redundant API calls
- Progressive form filling as documents complete

## 🚨 Important Notes

- Mega LLM API key is required in environment variables
- Processing time varies based on document complexity
- Internet connection required for Mega LLM API calls
- Large PDFs may take longer to process

## 🔄 Next Steps

1. Add Mega LLM API key to `.env.local`
2. Test with sample documents
3. Monitor processing performance
4. Fine-tune extraction prompts if needed
