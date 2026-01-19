
export enum Decision {
  AUTO_APPROVE = 'AUTO_APPROVE',
  AUTO_REJECT = 'AUTO_REJECT',
  HUMAN_REVIEW = 'HUMAN_REVIEW',
  INCOMPLETE = 'INCOMPLETE'
}

export interface ApplicantForm {
  fullName: string;
  email: string;
  phone: string;
  requestedAmount: number;
}

export interface ExtractedData {
  fullName: string | null;
  dob: string | null;
  age: number | null;
  identityNumber: string | null;
  employerName: string | null;
  annualIncome: number | null;
}

export interface ValidationStatus {
  fieldName: string;
  isValid: boolean;
  message: string;
}

export interface ProcessingResult {
  extractedFields: ExtractedData;
  validations: ValidationStatus[];
  decision: Decision;
  explanation: string;
  missingData: string[];
  userFeedback: string;
  timestamp: string;
}

export interface LoanApplication extends ApplicantForm {
  id: string;
  status: 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'OVERRIDDEN';
  documents: { type: string; name: string; content: string }[];
  result?: ProcessingResult;
  auditTrail: { timestamp: string; action: string; actor: string; comment?: string }[];
}
