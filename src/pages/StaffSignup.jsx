import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { User, Mail, Phone, Lock, Briefcase, ShieldCheck, Clock, MessageSquare } from 'lucide-react';
import { registerStaff } from '../lib/api/signup';
import { ASSIGNABLE_STAFF_ROLES } from '../lib/api/core';
import { ApiError } from '../lib/api/client';

// Staff self-registration. Approving one of these grants an ERP role, so the
// decision is administrator-only (gcs_erp/apps/core/views.py
// SignupRequestViewSet) — this page only ever creates a pending request.
export const StaffSignup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [requestedRole, setRequestedRole] = useState('CONTENT_MANAGER');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const validate = () => {
    const errs = {};
    if (!fullName.trim()) errs.full_name = 'Full name is required';
    if (!email.trim()) errs.email = 'Work email address is required';
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      errs.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit phone number';
    }
    if (!designation.trim()) errs.designation = 'Designation is required';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await registerStaff({
        full_name: fullName,
        email,
        phone,
        designation,
        requested_role: requestedRole,
        message,
        password,
        confirm_password: confirmPassword,
      });
      setSubmitted({
        message: result?._message
          || 'Staff account request submitted. An administrator will review it shortly.',
      });
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors && typeof err.fieldErrors === 'object') {
        const mapped = {};
        Object.entries(err.fieldErrors).forEach(([field, msgs]) => {
          const key = field === 'confirm_password' ? 'confirmPassword' : field;
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors((prev) => ({ ...prev, ...mapped }));
      }
      setToastMessage(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]';

  return (
    <div className="min-h-screen py-16 bg-[#FAFAF7] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 border border-[#E8E1D2] shadow-xl">

        <div className="text-center mb-8 space-y-3">
          <div className="inline-block">
            <Logo variant="light" size="large" />
          </div>
          <h2 className="text-2xl font-bold text-[#222326] pt-2">Staff Account Request</h2>
          <p className="text-xs text-[#6B6B6B]">
            For Gnana Computech trainers, coordinators and content staff who need portal access.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-[#D4A72C] text-[#B88918] flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#222326]">Request submitted</h3>
            <p className="text-sm text-[#252525]">{submitted.message}</p>
            <p className="text-xs text-[#6B6B6B]">
              Staff access is granted by an administrator. You will be emailed once your account is approved.
            </p>
            <Link to="/" className="font-bold text-[#D4A72C] hover:underline text-sm inline-block pt-2">Return to Home</Link>
          </div>
        ) : (
        <>
          <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Staff access is approved by an administrator, who also confirms the role you are granted.
              You will not be able to sign in until then.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Naveen Kumar"
                  className={inputClass}
                />
              </div>
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">Work Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gnanacomputech.com"
                    className={inputClass}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326]">Phone Number *</label>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {phone.length}/10 digits
                  </span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(digits);
                      if (errors.phone) setErrors({ ...errors, phone: null });
                    }}
                    placeholder="9876543210"
                    className={inputClass}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">Designation *</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Trainer"
                    className={inputClass}
                  />
                </div>
                {errors.designation && <p className="text-xs text-red-500 mt-1">{errors.designation}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">Role Requested</label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <select
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value)}
                    className={`${inputClass} appearance-none`}
                  >
                    {ASSIGNABLE_STAFF_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                {errors.requested_role && <p className="text-xs text-red-500 mt-1">{errors.requested_role}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                Anything the approver should know?
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Joining the Sunkadakatte training team from March, reporting to the academic coordinator."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-4" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Request Staff Access'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-[#6B6B6B] space-y-2">
            <p>
              Already have staff access?{' '}
              <Link to="/login" className="font-bold text-[#D4A72C] hover:underline">Sign In Here</Link>
            </p>
            <p>
              Are you a student?{' '}
              <Link to="/signup" className="font-bold text-[#D4A72C] hover:underline">Student sign up</Link>
            </p>
          </div>
        </>
        )}
      </div>

      <Toast message={toastMessage} type="error" onClose={() => setToastMessage('')} />
    </div>
  );
};
