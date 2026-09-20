import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { Lock, CheckCircle2 } from 'lucide-react';
import { confirmPasswordReset } from '../lib/api/auth';
import { ApiError } from '../lib/api/client';

// Lands here from the emailed link: FRONTEND_URL/reset-password?uid=...&token=...
// (apps/core/views.py PasswordResetRequestView builds this URL).
export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (password !== confirmPasswordValue) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(uid, token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErrorMessage(err instanceof ApiError && typeof err.message === 'string'
        ? err.message
        : 'This reset link is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!uid || !token) {
    return (
      <div className="min-h-screen py-16 bg-[#FAFAF7] flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-[#E8E1D2] shadow-xl text-center space-y-4">
          <p className="text-sm text-red-600 font-semibold">This reset link is missing required parameters.</p>
          <Link to="/forgot-password" className="font-bold text-[#D4A72C] hover:underline text-sm">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 bg-[#FAFAF7] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-[#E8E1D2] shadow-xl">
        <div className="text-center mb-8 space-y-3">
          <div className="inline-block">
            <Logo variant="light" size="large" />
          </div>
          <h2 className="text-2xl font-bold text-[#222326] pt-2">Set a New Password</h2>
        </div>

        {done ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-sm text-[#222326] font-semibold">Password reset successfully. Redirecting to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPasswordValue}
                  onChange={(e) => setConfirmPasswordValue(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                />
              </div>
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
