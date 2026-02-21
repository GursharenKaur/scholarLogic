export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

export interface Education {
  institution?: string;
  degree?: string;
  course?: string;
  year?: string;
  cgpa?: number;
}

export interface Experience {
  company?: string;
  role?: string;
  duration?: string;
}

export interface AcademicInfo {
  cgpa?: number;
  percentage?: number;
  subjects?: Subject[];
}

export interface Subject {
  name?: string;
  grade?: string;
  credits?: number;
}

export interface FinancialInfo {
  annualIncome?: number;
  incomeSource?: string;
  familySize?: number;
}

export interface DocumentInfo {
  documentType?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  certificateDate?: string;
  issuingAuthority?: string;
  referenceNumber?: string;
}

export interface StudentInfo {
  name?: string;
  institution?: string;
  degree?: string;
  year?: string;
}

export interface ExtractedResumeData {
  personalInfo?: PersonalInfo;
  education?: Education[];
  experience?: Experience[];
  skills?: string[];
}

export interface ExtractedMarkSheetData {
  studentInfo?: StudentInfo;
  academicInfo?: AcademicInfo;
}

export interface ExtractedIDProofData {
  personalInfo?: PersonalInfo;
  documentInfo?: DocumentInfo;
}

export interface ExtractedIncomeData {
  financialInfo?: FinancialInfo;
  documentInfo?: DocumentInfo;
}

export type ExtractedData = 
  | ExtractedResumeData
  | ExtractedMarkSheetData
  | ExtractedIDProofData
  | ExtractedIncomeData;

export interface ExtractionResult {
  data: ExtractedData;
  confidence: number;
  documentType: 'resume' | 'marksheet' | 'idproof' | 'income';
  extractedAt: string;
}

export interface DocumentProcessingResult {
  text: string;
  confidence?: number;
  layout?: any;
  tables?: any[];
  source: 'pdf' | 'image';
  pages?: number;
  fileName: string;
}

export interface MappedFormData {
  name?: string;
  dateOfBirth?: string;
  gender?: string;
  educationLevel?: string;
  course?: string;
  university?: string;
  graduationYear?: number;
  cgpa?: number;
  income?: number;
  nationality?: string;
  state?: string;
  country?: string;
  category?: string;
}

export type DocumentType = 'income' | 'resume' | 'marksheet' | 'idproof' | 'category' | 'disability';
