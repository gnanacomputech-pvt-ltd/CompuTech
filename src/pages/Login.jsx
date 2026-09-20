import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { Mail, Lock, ShieldCheck, GraduationCap, Building2 } from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import { portalForUser, portalHomePath } from '../lib/auth/roles';
import { ApiError } from '../lib/api/client';

const PORTAL_LABELS = { student: 'Student', erp: 'ERP Staff', institution: 'Institution' };

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [portalType, setPortalType] = useState('student'); // student, erp, institution — cosmetic only, actual routing follows the account's real role
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const actualPortal = portalForUser(user);
      if (!actualPortal) {
        setErrorMessage('This account has no portal access assigned. Contact your administrator.');
        return;
      }
      if (actualPortal !== portalType) {
        setToastMessage(`Signed in as ${PORTAL_LABELS[actualPortal]} — redirecting to your portal.`);
      } else {
        setToastMessage('Login successful! Redirecting…');
      }
      const from = location.state?.from?.pathname;
      const target = from && from.startsWith(`/${actualPortal}`) ? from : portalHomePath(user);
      setTimeout(() => navigate(target, { replace: true }), 600);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.code === 'AUTHENTICATION_FAILED'
          ? 'Incorrect email or password.'
          : (typeof err.message === 'string' ? err.message : 'Login failed. Please try again.'));
      } else {
        setErrorMessage('Login failed. Please try again.');
      }
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
          <h2 className="text-2xl font-bold text-[#222326] pt-2">Sign In to GCS Portal</h2>
          <p className="text-xs text-[#6B6B6B]">Access your academic projects, course modules & portal dashboard.</p>
        </div>

        {/* Portal selector tabs — cosmetic; you'll land on your account's actual portal regardless */}
        <div className="grid grid-cols-3 gap-1 bg-[#FAFAF7] p-1.5 rounded-xl border border-[#E8E1D2] mb-6">
          <button
            type="button"
            onClick={() => setPortalType('student')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              portalType === 'student' ? 'bg-[#D4A72C] text-[#17181A] shadow-sm' : 'text-[#6B6B6B] hover:text-[#222326]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" /> Student
          </button>
          <button
            type="button"
            onClick={() => setPortalType('erp')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              portalType === 'erp' ? 'bg-[#17181A] text-[#D4A72C] shadow-sm' : 'text-[#6B6B6B] hover:text-[#222326]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> ERP Staff
          </button>
          <button
            type="button"
            onClick={() => setPortalType('institution')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              portalType === 'institution' ? 'bg-[#D4A72C] text-[#17181A] shadow-sm' : 'text-[#6B6B6B] hover:text-[#222326]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Institution
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
              Password
            </label>
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

          <div className="flex items-center justify-end text-xs pt-1">
            <Link to="/forgot-password" className="font-bold text-[#B88918] hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2" disabled={submitting}>
            {submitting ? 'Signing in…' : `Log In to ${portalType.toUpperCase()}`}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-[#6B6B6B]">
          Don't have an account yet?{' '}
          <Link to="/signup" className="font-bold text-[#D4A72C] hover:underline">
            Create an Account
          </Link>
        </div>

      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
};
