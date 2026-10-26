import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token');
      return;
    }

    const verify = async () => {
      try {
        const res = await API.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification token invalid or expired');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-16 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center">
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin mx-auto" />
            <h3 className="font-bold text-lg">Verifying your email...</h3>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">Email Verified!</h3>
            <p className="text-xs text-slate-500">{message}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-pill bg-brand-500 text-white font-bold text-xs shadow-md mt-4"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <XCircle className="w-14 h-14 text-rose-500 mx-auto" />
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">Verification Failed</h3>
            <p className="text-xs text-slate-500">{message}</p>
            <Link
              to="/auth"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-pill bg-slate-900 text-white font-bold text-xs shadow-md mt-4"
            >
              <span>Back to Login</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
export default VerifyEmailPage;
