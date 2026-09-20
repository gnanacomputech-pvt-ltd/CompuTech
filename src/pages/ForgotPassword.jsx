import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { Mail, CheckCircle2 } from 'lucide-react';
import { requestPasswordReset } from '../lib/api/auth';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      // Backend always returns 200 regardless of whether the email exists
      // (user-enumeration protection, apps/core/views.py) — `sent` reflects
      // that intentionally, not whether an account was actually found.
      await requestPasswordReset(email);
      setSent(true);
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-16 bg-[#FAFAF7] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-[#E8E1D2] shadow-xl">
        <div className="text-center mb-8 space-y-3">
          <div className="inline-block">
            <Logo variant="light" size="large" />
          </div>
          <h2 className="text-2xl font-bold text-[#222326] pt-2">Reset Your Password</h2>
          <p className="text-xs text-[#6B6B6B]">Enter your account email and we'll send you a reset link.</p>
        </div>

        {sent ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-sm text-[#222326] font-semibold">If an account with that email exists, a reset link has been sent.</p>
            <p className="text-xs text-[#6B6B6B]">Check your inbox — the link expires in 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gnanacomputech.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                />
              </div>
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-[#6B6B6B]">
          <Link to="/login" className="font-bold text-[#D4A72C] hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
