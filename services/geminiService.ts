
import { GoogleGenAI, Type } from "@google/genai";
import { ApplicantForm, ProcessingResult } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Initialize GoogleGenAI using the API key from environment variables as per guidelines.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async processApplication(
    form: ApplicantForm,
    documents: { type: string; name: string; content: string }[]
  ): Promise<ProcessingResult> {
    const systemInstruction = `
      You are a Senior Loan Officer processing a loan application in India. 
      Analyze the provided documents (Images or PDFs) and the applicant's form data.

      APPLICATION FORM DATA:
      - Name: ${form.fullName}
      - Requested Amount: ₹${form.requestedAmount}

      EXTRACTION & VALIDATION RULES:
      1. Full Name: Must be extracted from documents. Must exactly match the form input "${form.fullName}". If there is a mismatch (even minor like missing middle initial), set decision to HUMAN_REVIEW.
      2. DOB/Age: Extract DOB if available. If DOB is present, derive age. If neither DOB nor Age can be found, set decision to INCOMPLETE.
      3. Identity Number (KYC): Extract PAN Card, Aadhaar Number, or National ID. This field is MANDATORY. If missing, set decision to AUTO_REJECT.
      4. Employer Name: Must be extracted from paystubs, tax returns, or employment letters. If missing, set decision to HUMAN_REVIEW.
      5. Annual Income: Extract a numeric value in Rupees (₹). You can calculate this from monthly figures (Monthly * 12). If income is present but calculations are ambiguous, set decision to HUMAN_REVIEW and request clarification in userFeedback.

      DOCUMENT HANDLING:
      - The provided documents may be multi-page PDFs. Analyze all pages to find required information.
      - Handle Indian tax documents (ITR-V), salary slips, and Aadhaar/PAN layouts.

      DECISION ENGINE LOGIC:
      - AUTO_APPROVE: Only if all mandatory fields are present, high confidence in extraction, and no inconsistencies.
      - AUTO_REJECT: Critical identity/KYC data is missing or verification failed.
      - HUMAN_REVIEW: Partial data exists, minor name mismatches, or ambiguity in income calculation.
      - INCOMPLETE: Essential data (DOB/Income proof) is totally missing.

      Strictly follow the JSON schema provided. Never hallucinate data. 
      Provide specific feedback in 'userFeedback' for the applicant.
    `;

    // Process documents into Gemini-compatible parts
    const docParts = documents.map(doc => {
      // Regex to split Data URL: data:[mime];base64,[data]
      const match = doc.content.match(/^data:(.*);base64,(.*)$/);
      if (!match) {
        throw new Error(`Document "${doc.name}" has an invalid format.`);
      }
      return {
        inlineData: {
          mimeType: match[1], // Extract correct mimeType (e.g. application/pdf, image/png, image/jpeg)
          data: match[2],     // Extract base64 data
        }
      };
    });

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: {
          parts: [
            { text: "Analyze the attached documents to extract applicant data and determine a loan decision based on the system instructions." },
            ...docParts
          ]
        },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedFields: {
                type: Type.OBJECT,
                properties: {
                  fullName: { type: Type.STRING },
                  dob: { type: Type.STRING },
                  age: { type: Type.NUMBER },
                  identityNumber: { type: Type.STRING },
                  employerName: { type: Type.STRING },
                  annualIncome: { type: Type.NUMBER },
                },
                required: ["fullName", "identityNumber"],
              },
              validations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fieldName: { type: Type.STRING },
                    isValid: { type: Type.BOOLEAN },
                    message: { type: Type.STRING },
                  }
                }
              },
              decision: { 
                type: Type.STRING,
                description: "One of: AUTO_APPROVE, AUTO_REJECT, HUMAN_REVIEW, INCOMPLETE"
              },
              explanation: { type: Type.STRING },
              missingData: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              userFeedback: { type: Type.STRING }
            },
            required: ["extractedFields", "decision", "explanation", "userFeedback"],
          },
        },
      });

      const result = JSON.parse(response.text || "{}") as ProcessingResult;
      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}
