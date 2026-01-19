
import { GoogleGenAI, Type } from "@google/genai";
import { ApplicantForm, ProcessingResult } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
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
      1. Full Name: Must be extracted from documents. Must match form input "${form.fullName}". If mismatch, set decision to HUMAN_REVIEW.
      2. DOB/Age: Extract DOB. If missing, set decision to INCOMPLETE.
      3. Identity Number (KYC): Extract PAN or Aadhaar. This is MANDATORY. If missing, set decision to AUTO_REJECT.
      4. Employer Name: Must be extracted from documents. If missing, set decision to HUMAN_REVIEW.
      5. Annual Income: Extract numeric value in Rupees (₹).

      DECISION LOGIC:
      - AUTO_APPROVE: All fields present, high confidence, consistent data.
      - AUTO_REJECT: Critical KYC missing or verification failed.
      - HUMAN_REVIEW: Minor mismatches or calculation ambiguity.
      - INCOMPLETE: Essential data (Income proof/DOB) totally missing.

      Return ONLY valid JSON.
    `;

    const docParts = documents.map(doc => {
      const match = doc.content.match(/^data:(.*);base64,(.*)$/);
      if (!match) throw new Error(`Document "${doc.name}" has an invalid format.`);
      return {
        inlineData: {
          mimeType: match[1],
          data: match[2],
        }
      };
    });

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview", // Switched to Flash for better quota availability and speed
        contents: {
          parts: [
            { text: "Analyze the attached documents to extract applicant data and determine a loan decision." },
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
              decision: { type: Type.STRING },
              explanation: { type: Type.STRING },
              missingData: { type: Type.ARRAY, items: { type: Type.STRING } },
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
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}
