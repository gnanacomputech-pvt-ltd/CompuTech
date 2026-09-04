import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { User, Mail, Phone, Lock, GraduationCap, Building2 } from 'lucide-react';

export const Signup = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('student'); // student, institution
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full Name / Organization Name is required';
    if (!email.trim()) errs.email = 'Email address is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    if (!password) errs.password = 'Password is required';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (validate()) {
      setToastMessage('Account created successfully! Redirecting to dashboard...');
      setTimeout(() => {
        if (accountType === 'institution') navigate('/institution/dashboard');
        else navigate('/student/dashboard');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen py-16 bg-[#FAFAF7] flex flex-col justify-center items-center px-4">
      
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 border border-[#E8E1D2] shadow-xl">
        
        <div className="text-center mb-8 space-y-3">
          <div className="inline-block">
            <Logo variant="light" size="large" />
          </div>
          <h2 className="text-2xl font-bold text-[#222326] pt-2">Create Your GCS Account</h2>
          <p className="text-xs text-[#6B6B6B]">Join Gnana Computech Solutions for projects, courses, and portal access.</p>
        </div>

        {/* Account Type Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-[#FAFAF7] p-1.5 rounded-xl border border-[#E8E1D2] mb-6">
          <button
            type="button"
            onClick={() => setAccountType('student')}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              accountType === 'student' ? 'bg-[#D4A72C] text-[#17181A] shadow-sm' : 'text-[#6B6B6B] hover:text-[#222326]'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Student Account
          </button>
          <button
            type="button"
            onClick={() => setAccountType('institution')}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              accountType === 'institution' ? 'bg-[#17181A] text-[#D4A72C] shadow-sm' : 'text-[#6B6B6B] hover:text-[#222326]'
            }`}
          >
            <Building2 className="w-4 h-4" /> Institution Partner
          </button>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
              {accountType === 'student' ? 'Full Name *' : 'College / Company Name *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={accountType === 'student' ? 'e.g. Prajwal Gowda' : 'e.g. Soundarya Institute'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full mt-4">
            Create {accountType === 'student' ? 'Student' : 'Institution'} Account
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-[#6B6B6B]">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#D4A72C] hover:underline">
            Sign In Here
          </Link>
        </div>

      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
};
