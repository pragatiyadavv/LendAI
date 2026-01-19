
import React, { useState } from 'react';
import { Card, Button, Input, Badge } from './common/UI';
import { ApplicantForm, LoanApplication, Decision } from '../types';
import { GeminiService } from '../services/geminiService';

interface Props {
  onComplete: (app: LoanApplication) => void;
}

export const ApplicationFlow: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [form, setForm] = useState<ApplicantForm>({
    fullName: '',
    email: '',
    phone: '',
    requestedAmount: 50000,
  });
  const [files, setFiles] = useState<{ type: string; name: string; content: string }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles(prev => {
          // Replace existing file of same type if it exists
          const filtered = prev.filter(f => f.type !== type);
          return [...filtered, { type, name: file.name, content: reader.result as string }];
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!form.fullName || !form.email) {
      alert("Please fill in all personal details.");
      return;
    }
    
    setIsProcessing(true);
    const gemini = new GeminiService();
    try {
      const result = await gemini.processApplication(form, files);
      const application: LoanApplication = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        ...form,
        status: 'COMPLETED',
        documents: files,
        result,
        auditTrail: [{
          timestamp: new Date().toISOString(),
          action: 'APPLICATION_PROCESSED',
          actor: 'AI_SYSTEM',
          comment: result.explanation
        }]
      };
      onComplete(application);
    } catch (err: any) {
      console.error(err);
      alert(`Error processing application: ${err.message || "Unknown error"}. Please ensure you uploaded valid files (Images or PDFs).`);
    } finally {
      setIsProcessing(false);
    }
  };

  const hasDoc = (type: string) => files.some(f => f.type === type);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Loan Application</h1>
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-8 h-1 rounded-full ${s <= step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <Card className="p-8">
          <h2 className="text-lg font-semibold mb-6">Personal Details</h2>
          <div className="space-y-4">
            <Input label="Full Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="As it appears on ID" />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <Input label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <Input label="Requested Amount (₹)" type="number" value={form.requestedAmount} onChange={e => setForm({...form, requestedAmount: Number(e.target.value)})} />
          </div>
          <Button className="w-full mt-8" onClick={() => setStep(2)}>Next: Documentation</Button>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-8">
          <h2 className="text-lg font-semibold mb-2">Required Documentation</h2>
          <p className="text-sm text-slate-500 mb-6">Please upload clear copies of the following documents. Supported formats: <strong>JPG, PNG, PDF</strong>.</p>
          
          <div className="space-y-6">
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${hasDoc('ID') ? 'border-green-200 bg-green-50' : 'border-slate-200 hover:border-indigo-300'}`}>
              <p className="text-sm font-medium text-slate-700 mb-2">Government Issued ID (PAN/Aadhaar) {hasDoc('ID') && '✓'}</p>
              <input type="file" accept="image/*,.pdf" onChange={e => handleFileChange(e, 'ID')} className="text-sm cursor-pointer" />
              {hasDoc('ID') && <p className="text-xs text-green-600 mt-2 font-medium">{files.find(f => f.type === 'ID')?.name}</p>}
            </div>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${hasDoc('PAYSTUB') ? 'border-green-200 bg-green-50' : 'border-slate-200 hover:border-indigo-300'}`}>
              <p className="text-sm font-medium text-slate-700 mb-2">Salary Slip / ITR-V {hasDoc('PAYSTUB') && '✓'}</p>
              <input type="file" accept="image/*,.pdf" onChange={e => handleFileChange(e, 'PAYSTUB')} className="text-sm cursor-pointer" />
              {hasDoc('PAYSTUB') && <p className="text-xs text-green-600 mt-2 font-medium">{files.find(f => f.type === 'PAYSTUB')?.name}</p>}
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1" disabled={files.length < 2}>Review Application</Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-8">
          <h2 className="text-lg font-semibold mb-4">Confirm Submission</h2>
          <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm mb-6">
            <p><strong>Name:</strong> {form.fullName}</p>
            <p><strong>Amount:</strong> ₹{form.requestedAmount.toLocaleString('en-IN')}</p>
            <p><strong>Documents:</strong> {files.length} attached ({files.map(f => f.name).join(', ')})</p>
          </div>
          
          {isProcessing ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-sm text-slate-600">AI extraction and validation in progress...</p>
              <p className="text-xs text-slate-400 mt-2">Checking KYC, matching names, and processing documents (including multi-page PDFs).</p>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button onClick={handleSubmit} className="flex-1">Submit Application</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
