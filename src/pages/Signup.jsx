import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import {
  User, Mail, Phone, Lock, GraduationCap, Building2, Clock,
  School, MapPin, Hash, Briefcase,
} from 'lucide-react';
import {
  registerStudent, registerInstitution, fetchPublicInstitutions,
} from '../lib/api/signup';
import { ApiError } from '../lib/api/client';

const OTHER_COLLEGE = '__other__';

export const Signup = () => {
  const [accountType, setAccountType] = useState('student'); // student | institution
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Student-only academic details — approval creates the Student profile
  // from these (gcs_erp/apps/core/signup.py), so they are collected up front
  // rather than chased up afterwards.
  const [institutionId, setInstitutionId] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [degree, setDegree] = useState('');
  const [semester, setSemester] = useState('');
  const [usn, setUsn] = useState('');

  // Institution-only details
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  const [institutions, setInstitutions] = useState([]);
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // { message }

  useEffect(() => {
    // Partner-college picker. A failure here is not fatal — the applicant
    // can always type their college name instead.
    fetchPublicInstitutions()
      .then((rows) => setInstitutions(Array.isArray(rows) ? rows : []))
      .catch(() => setInstitutions([]));
  }, []);

  const isStudent = accountType === 'student';

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = isStudent ? 'Full name is required' : 'College / organization name is required';
    if (!email.trim()) errs.email = 'Email address is required';
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      errs.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit phone number';
    }
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

    if (isStudent && institutionId !== OTHER_COLLEGE && !institutionId && !collegeName.trim()) {
      errs.college = 'Select your college, or choose "Other" and type its name';
    }
    if (isStudent && institutionId === OTHER_COLLEGE && !collegeName.trim()) {
      errs.college = 'Enter your college name';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetForm = () => {
    setErrors({});
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const credentials = {
        email,
        password,
        confirm_password: confirmPassword,
        full_name: name,
        phone,
      };

      let result;
      if (isStudent) {
        const picked = institutionId && institutionId !== OTHER_COLLEGE ? institutionId : null;
        result = await registerStudent({
          ...credentials,
          institution: picked,
          college_name: picked ? '' : collegeName,
          degree,
          semester: semester ? Number(semester) : null,
          usn,
        });
      } else {
        result = await registerInstitution({
          ...credentials,
          organization_name: name,
          city,
          address,
          contact_phone: phone,
        });
      }

      // No redirect to a dashboard: the account is PENDING and cannot sign
      // in until a reviewer approves it, so tell the applicant that plainly.
      setSubmitted({
        message: result?._message
          || 'Registration received. You will be emailed once your account has been approved.',
      });
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors && typeof err.fieldErrors === 'object') {
        const mapped = {};
        Object.entries(err.fieldErrors).forEach(([field, msgs]) => {
          const key = field === 'confirm_password' ? 'confirmPassword'
            : field === 'college_name' ? 'college'
            : field === 'full_name' ? 'name'
            : field;
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors((prev) => ({ ...prev, ...mapped }));
      }
      setToastType('error');
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
          <h2 className="text-2xl font-bold text-[#222326] pt-2">Create Your GCS Account</h2>
          <p className="text-xs text-[#6B6B6B]">Join Gnana Computech Solutions for projects, courses, and portal access.</p>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-[#D4A72C] text-[#B88918] flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#222326]">Awaiting approval</h3>
            <p className="text-sm text-[#252525]">{submitted.message}</p>
            <p className="text-xs text-[#6B6B6B]">
              You will not be able to sign in until a member of our team approves your account.
            </p>
            <Link to="/" className="font-bold text-[#D4A72C] hover:underline text-sm inline-block pt-2">Return to Home</Link>
          </div>
        ) : (
        <>
          {/* Account Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-[#FAFAF7] p-1.5 rounded-xl border border-[#E8E1D2] mb-6">
            <button
              type="button"
              onClick={() => { setAccountType('student'); resetForm(); }}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                isStudent ? 'bg-[#D4A72C] text-[#17181A] shadow-sm' : 'text-[#6B6B6B] hover:text-[#222326]'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Student Account
            </button>
            <button
              type="button"
              onClick={() => { setAccountType('institution'); resetForm(); }}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                !isStudent ? 'bg-[#17181A] text-[#D4A72C] shadow-sm' : 'text-[#6B6B6B] hover:text-[#222326]'
              }`}
            >
              <Building2 className="w-4 h-4" /> Institution Partner
            </button>
          </div>

          <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-2">
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              {isStudent
                ? 'Student accounts are reviewed by our academic team before activation. You will be emailed as soon as yours is approved.'
                : 'Institution portal accounts are reviewed by an administrator. Once approved, your coordinator account is created automatically.'}
            </span>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                {isStudent ? 'Full Name *' : 'College / Organization Name *'}
              </label>
              <div className="relative">
                {isStudent
                  ? <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  : <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />}
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isStudent ? 'e.g. Prajwal Gowda' : 'e.g. Soundarya Institute of Management'}
                  className={inputClass}
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
                    className={inputClass}
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

            {isStudent ? (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Your College *
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <select
                      value={institutionId}
                      onChange={(e) => setInstitutionId(e.target.value)}
                      className={`${inputClass} appearance-none`}
                    >
                      <option value="">Select your college…</option>
                      {institutions.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name}{inst.city ? ` — ${inst.city}` : ''}
                        </option>
                      ))}
                      <option value={OTHER_COLLEGE}>Other / not listed</option>
                    </select>
                  </div>
                  {(institutionId === OTHER_COLLEGE || (!institutionId && institutions.length === 0)) && (
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="Type your college name"
                      className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    />
                  )}
                  {errors.college && <p className="text-xs text-red-500 mt-1">{errors.college}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">Degree</label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        placeholder="BCA"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">Semester</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      placeholder="5"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    />
                    {errors.semester && <p className="text-xs text-red-500 mt-1">{errors.semester}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">USN</label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={usn}
                        onChange={(e) => setUsn(e.target.value)}
                        placeholder="1AB21CS001"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">City</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Bangalore"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">Address</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Campus address"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

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
                    className={inputClass}
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
                    className={inputClass}
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-4" disabled={submitting}>
              {submitting ? 'Submitting…' : isStudent ? 'Request Student Account' : 'Request Institution Account'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-[#6B6B6B] space-y-2">
            <p>
              Already registered?{' '}
              <Link to="/login" className="font-bold text-[#D4A72C] hover:underline">Sign In Here</Link>
            </p>
            <p>
              Joining the Gnana Computech team?{' '}
              <Link to="/staff-signup" className="font-bold text-[#D4A72C] hover:underline">Staff sign up</Link>
            </p>
          </div>
        </>
        )}

      </div>

      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
    </div>
  );
};
