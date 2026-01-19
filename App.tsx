
import React, { useState, useEffect } from 'react';
import { ApplicationFlow } from './components/ApplicationFlow';
import { AdminDashboard } from './components/AdminDashboard';
import { LoanApplication, Decision } from './types';
import { Card, Badge } from './components/common/UI';

const App: React.FC = () => {
  const [view, setView] = useState<'APPLICANT' | 'ADMIN'>('APPLICANT');
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [lastSubmission, setLastSubmission] = useState<LoanApplication | null>(null);

  const handleApplicationComplete = (app: LoanApplication) => {
    setApplications(prev => [app, ...prev]);
    setLastSubmission(app);
  };

  const handleOverride = (id: string, newDecision: Decision, comment: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id === id) {
        return {
          ...app,
          status: 'OVERRIDDEN',
          result: {
            ...app.result!,
            decision: newDecision,
            explanation: `OVERRIDDEN BY OFFICER: ${comment}`,
          },
          auditTrail: [
            ...app.auditTrail,
            {
              timestamp: new Date().toISOString(),
              action: 'MANUAL_OVERRIDE',
              actor: 'CREDIT_OFFICER',
              comment
            }
          ]
        };
      }
      return app;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">L</span>
          </div>
          <span className="font-bold text-xl tracking-tight">LendAI <span className="text-slate-400">Pro</span></span>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => { setView('APPLICANT'); setLastSubmission(null); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'APPLICANT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Applicant Portal
          </button>
          <button 
            onClick={() => setView('ADMIN')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'ADMIN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Admin Dashboard
          </button>
        </div>
      </nav>

      <main>
        {view === 'APPLICANT' ? (
          lastSubmission ? (
            <div className="max-w-2xl mx-auto py-12 px-4">
              <Card className="p-8 text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${
                  lastSubmission.result?.decision === Decision.AUTO_APPROVE ? 'bg-green-100 text-green-600' :
                  lastSubmission.result?.decision === Decision.AUTO_REJECT ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {lastSubmission.result?.decision === Decision.AUTO_APPROVE ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2">Application Status</h2>
                <Badge variant={lastSubmission.result?.decision || 'INCOMPLETE'}>
                  {lastSubmission.result?.decision.replace('_', ' ')}
                </Badge>
                
                <div className="mt-8 text-left border-t border-slate-100 pt-8">
                  <h3 className="text-sm font-bold mb-4 uppercase tracking-widest text-slate-400">Official Rationale</h3>
                  <p className="text-slate-700 mb-6">{lastSubmission.result?.userFeedback}</p>
                  
                  {lastSubmission.result?.missingData && lastSubmission.result.missingData.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <p className="text-xs font-bold text-red-800 uppercase mb-2">Actions Required:</p>
                      <ul className="text-sm text-red-700 list-disc list-inside">
                        {lastSubmission.result.missingData.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <button 
                  className="mt-8 text-sm text-indigo-600 font-semibold hover:text-indigo-700"
                  onClick={() => setLastSubmission(null)}
                >
                  Start New Application
                </button>
              </Card>
            </div>
          ) : (
            <ApplicationFlow onComplete={handleApplicationComplete} />
          )
        ) : (
          <AdminDashboard applications={applications} onOverride={handleOverride} />
        )}
      </main>
    </div>
  );
};

export default App;
