import { getApiKey, MEGA_LLM_CONFIG } from './config';
import { DocumentType, MappedFormData } from './types/profileData';

const EXTRACTION_PROMPTS: Record<DocumentType, string> = {
  resume: `You are an expert resume parser. Extract personal and professional information from this resume text. Return ONLY valid JSON with this exact structure:

{
  "personalInfo": {
    "name": "full name as written",
    "email": "email address",
    "phone": "phone number",
    "dateOfBirth": "YYYY-MM-DD format if found"
  },
  "education": [
    {
      "institution": "university/school name",
      "degree": "degree name",
      "course": "major/course",
      "year": "graduation year",
      "cgpa": "CGPA out of 10"
    }
  ],
  "experience": [
    {
      "company": "company name",
      "role": "job title",
      "duration": "work duration"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"]
}

RULES:
- Return ONLY JSON, no explanations
- Use null for missing fields
- Convert percentages to CGPA (75% = 7.5)
- Extract dates in YYYY-MM-DD format
- Be precise with names and numbers

RESUME TEXT:`,

  marksheet: `You are an expert academic document parser. Extract educational information from this mark sheet/transcript. Return ONLY valid JSON:

{
  "studentInfo": {
    "name": "student full name",
    "institution": "university/school name",
    "degree": "degree program",
    "year": "academic year or graduation year"
  },
  "academicInfo": {
    "cgpa": "current CGPA out of 10",
    "percentage": "overall percentage if available",
    "subjects": [
      {
        "name": "subject name",
        "grade": "grade or score",
        "credits": "credits if available"
      }
    ]
  }
}

RULES:
- Return ONLY JSON, no explanations
- Convert percentage to CGPA scale of 10
- Use null for missing information
- Extract the most recent/overall CGPA

MARK SHEET TEXT:`,

  idproof: `You are an expert ID document parser. Extract personal information from this ID proof. Return ONLY valid JSON:

{
  "personalInfo": {
    "name": "full name as written",
    "dateOfBirth": "YYYY-MM-DD format",
    "address": "complete address",
    "gender": "Male/Female/Other"
  },
  "documentInfo": {
    "documentType": "Aadhar/PAN/Passport/Driver License etc",
    "documentNumber": "ID number",
    "issueDate": "YYYY-MM-DD if available",
    "expiryDate": "YYYY-MM-DD if available"
  }
}

RULES:
- Return ONLY JSON, no explanations
- Use null for missing fields
- Format dates as YYYY-MM-DD
- Extract complete address as single string

ID PROOF TEXT:`,

  income: `You are an expert financial document parser. Extract income information from this certificate. Return ONLY valid JSON:

{
  "financialInfo": {
    "annualIncome": "total annual family income in numbers",
    "incomeSource": "source of income if mentioned",
    "familySize": "number of family members if mentioned"
  },
  "documentInfo": {
    "certificateDate": "YYYY-MM-DD format",
    "issuingAuthority": "authority name",
    "referenceNumber": "reference number if available"
  }
}

RULES:
- Return ONLY JSON, no explanations
- Extract only numeric income value (remove currency symbols)
- Use null for missing information
- Format dates as YYYY-MM-DD

INCOME CERTIFICATE TEXT:`,

  category: `You are an expert certificate parser. Extract category information from this category certificate. Return ONLY valid JSON:

{
  "categoryInfo": {
    "category": "General/OBC/SC/ST/EWS/Other",
    "certificateNumber": "certificate number if available",
    "issuingAuthority": "authority name"
  }
}

RULES:
- Return ONLY JSON, no explanations
- Extract category information accurately

CATEGORY CERTIFICATE TEXT:`,

  disability: `You are an expert certificate parser. Extract disability information from this disability certificate. Return ONLY valid JSON:

{
  "disabilityInfo": {
    "disabilityType": "type of disability",
    "disabilityPercentage": "percentage if available",
    "certificateNumber": "certificate number if available",
    "issuingAuthority": "authority name"
  }
}

RULES:
- Return ONLY JSON, no explanations
- Extract disability information accurately

DISABILITY CERTIFICATE TEXT:`
};

export async function extractProfileData(text: string, documentType: DocumentType): Promise<{
  data: any;
  confidence: number;
  documentType: DocumentType;
  extractedAt: string;
}> {
  try {
    // Truncate to avoid token limits (6000 chars ≈ ~1500 tokens)
    const truncatedText = text.length > 6000 ? text.slice(0, 6000) + '\n[...truncated]' : text;
    const prompt = EXTRACTION_PROMPTS[documentType] + truncatedText;

    console.log(`🤖 [MegaLLM] Calling ${MEGA_LLM_CONFIG.baseURL} with model ${MEGA_LLM_CONFIG.model}`);
    console.log(`📝 Prompt length: ${prompt.length} chars`);

    // 30-second timeout — prevents hanging fetches
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      response = await fetch(`${MEGA_LLM_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getApiKey()}`,
          'Content-Type': 'application/json',
        },
        // NOTE: response_format is NOT included — deepseek-v3.1 on MegaLLM
        // does not support it and will reject the request.
        body: JSON.stringify({
          model: MEGA_LLM_CONFIG.model,
          messages: [
            {
              role: 'system',
              content: 'You are a precise data extraction expert. Always return valid JSON responses only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: MEGA_LLM_CONFIG.temperature,
          max_tokens: MEGA_LLM_CONFIG.maxTokens,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '(unreadable)');
      console.error(`❌ MegaLLM HTTP ${response.status}:`, body);
      throw new Error(`MegaLLM API returned ${response.status}: ${body.slice(0, 200)}`);
    }

    const result = await response.json();
    const rawContent: string = result.choices?.[0]?.message?.content ?? '{}';

    // Strip markdown code fences if the model wraps the JSON in ```json ... ```
    const cleaned = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const extractedData = JSON.parse(cleaned);

    console.log(`✅ Successfully extracted data from ${documentType}`);
    return {
      data: extractedData,
      confidence: 0.85,
      documentType,
      extractedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Profile extraction error for ${documentType}:`, error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to extract profile data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function mapExtractedDataToForm(extractedData: any): MappedFormData {
  const mappedData: MappedFormData = {};

  try {
    // Map personal information
    if (extractedData.personalInfo?.name) {
      mappedData.name = extractedData.personalInfo.name;
    }

    if (extractedData.personalInfo?.dateOfBirth) {
      mappedData.dateOfBirth = extractedData.personalInfo.dateOfBirth;
    }

    if (extractedData.personalInfo?.gender) {
      mappedData.gender = extractedData.personalInfo.gender;
    }

    // Map education information
    if (extractedData.education && extractedData.education.length > 0) {
      const education = extractedData.education[0]; // Take first/most recent
      if (education.institution) mappedData.university = education.institution;
      if (education.degree) mappedData.educationLevel = mapDegreeToLevel(education.degree);
      if (education.course) mappedData.course = education.course;
      if (education.year) mappedData.graduationYear = parseInt(education.year);
      if (education.cgpa) mappedData.cgpa = parseFloat(education.cgpa);
    }

    // Map academic information (for mark sheets)
    if (extractedData.academicInfo) {
      if (extractedData.academicInfo.cgpa) mappedData.cgpa = parseFloat(extractedData.academicInfo.cgpa);
      if (extractedData.studentInfo?.institution) mappedData.university = extractedData.studentInfo.institution;
      if (extractedData.studentInfo?.degree) mappedData.educationLevel = mapDegreeToLevel(extractedData.studentInfo.degree);
      if (extractedData.studentInfo?.year) mappedData.graduationYear = parseInt(extractedData.studentInfo.year);
    }

    // Map financial information
    if (extractedData.financialInfo?.annualIncome) {
      mappedData.income = parseFloat(extractedData.financialInfo.annualIncome);
    }

    console.log('📝 Mapped extracted data to form fields:', mappedData);
    return mappedData;

  } catch (error) {
    console.error('❌ Error mapping extracted data:', error);
    return {};
  }
}

function mapDegreeToLevel(degree: string): string {
  const degreeLower = degree.toLowerCase();

  if (degreeLower.includes('high school') || degreeLower.includes('10th') || degreeLower.includes('sslc')) {
    return 'High School';
  } else if (degreeLower.includes('bachelor') || degreeLower.includes('b.tech') || degreeLower.includes('be') ||
    degreeLower.includes('ba') || degreeLower.includes('b.com') || degreeLower.includes('b.sc')) {
    return 'Undergraduate';
  } else if (degreeLower.includes('master') || degreeLower.includes('m.tech') || degreeLower.includes('me') ||
    degreeLower.includes('ma') || degreeLower.includes('m.com') || degreeLower.includes('m.sc')) {
    return 'Postgraduate';
  } else if (degreeLower.includes('phd') || degreeLower.includes('doctorate')) {
    return 'PhD';
  }

  return 'Undergraduate'; // Default fallback
}
