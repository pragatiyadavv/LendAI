
import React, { useState } from 'react';
import { Card, Button, Badge } from './common/UI';
import { LoanApplication, Decision } from '../types';

interface Props {
  applications: LoanApplication[];
  onOverride: (id: string, newDecision: Decision, comment: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({ applications, onOverride }) => {
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [overrideComment, setOverrideComment] = useState('');

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Queue</h1>
          <p className="text-slate-500">Monitor and override automated loan decisions.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-center">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Pending Review</p>
            <p className="text-lg font-semibold">{applications.filter(a => a.result?.decision === Decision.HUMAN_REVIEW).length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List */}
        <div className="lg:col-span-1 space-y-4">
          {applications.map(app => (
            <div 
              key={app.id} 
              onClick={() => setSelectedApp(app)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedApp?.id === app.id ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-slate-200 hover:border-indigo-200'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-slate-900">{app.fullName}</p>
                <Badge variant={app.result?.decision || 'INCOMPLETE'}>
                  {app.result?.decision.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex justify-between items-end text-xs text-slate-500">
                <p>₹{app.requestedAmount.toLocaleString('en-IN')}</p>
                <p>{new Date(app.result?.timestamp || '').toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {applications.length === 0 && (
            <p className="text-center text-slate-500 py-12">No applications submitted yet.</p>
          )}
        </div>

        {/* Details View */}
        <div className="lg:col-span-2">
          {selectedApp ? (
            <Card className="p-8 sticky top-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedApp.fullName}</h2>
                  <p className="text-sm text-slate-500">Application ID: {selectedApp.id}</p>
                </div>
                <Badge variant={selectedApp.result?.decision || 'INCOMPLETE'}>
                  {selectedApp.result?.decision.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Extracted Values</h3>
                  <div className="space-y-2">
                    <DataRow label="Age" value={selectedApp.result?.extractedFields.age || 'N/A'} />
                    <DataRow label="KYC ID" value={selectedApp.result?.extractedFields.identityNumber || 'MISSING'} />
                    <DataRow label="Employer" value={selectedApp.result?.extractedFields.employerName || 'MISSING'} />
                    <DataRow label="Annual Income" value={selectedApp.result?.extractedFields.annualIncome ? `₹${selectedApp.result.extractedFields.annualIncome.toLocaleString('en-IN')}` : 'MISSING'} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Validation Status</h3>
                  <div className="space-y-2">
                    {selectedApp.result?.validations.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className={v.isValid ? 'text-green-500' : 'text-red-500'}>
                          {v.isValid ? '✓' : '✗'}
                        </span>
                        <span className="text-slate-700">{v.fieldName}:</span>
                        <span className="text-slate-500 text-xs">{v.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl mb-8">
                <h3 className="text-sm font-bold text-slate-900 mb-2">AI Decision Rationale</h3>
                <p className="text-sm text-slate-600 italic">"{selectedApp.result?.explanation}"</p>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Manual Override</h3>
                <textarea 
                  className="w-full p-3 text-sm border border-slate-200 rounded-lg mb-4 h-24"
                  placeholder="Reason for manual override..."
                  value={overrideComment}
                  onChange={e => setOverrideComment(e.target.value)}
                />
                <div className="flex gap-4">
                  <Button variant="primary" className="bg-green-600 hover:bg-green-700" onClick={() => onOverride(selectedApp.id, Decision.AUTO_APPROVE, overrideComment)}>Approve</Button>
                  <Button variant="danger" onClick={() => onOverride(selectedApp.id, Decision.AUTO_REJECT, overrideComment)}>Reject</Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-400">Select an application to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DataRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-900">{value}</span>
  </div>
);
