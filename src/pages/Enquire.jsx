import React, { useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { CheckCircle2, HelpCircle, User, Phone, Mail, Building, BookOpen, Laptop, MessageSquare } from 'lucide-react';
import { submitEnquiry } from '../lib/api/public';
import { ApiError } from '../lib/api/client';

export const Enquire = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    interest: 'Academic Project Guidance (BCA / MCA)',
    trainingMode: 'Classroom / Offline (Bangalore Center)',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    const cleanPhone = formData.phone.trim();
    if (!cleanPhone) {
      errs.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.message.trim()) {
      errs.message = 'Please provide your enquiry details or questions';
    } else if (formData.message.trim().length < 10) {
      errs.message = 'Enquiry message must be at least 10 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await submitEnquiry({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        college: formData.college.trim(),
        interest: formData.interest,
        training_mode: formData.trainingMode,
        message: formData.message.trim(),
      });
      setSubmittedRef(res?.reference_id || '');
      setIsSubmitted(true);
      setToastType('success');
      setToastMessage('Enquiry Submitted! Our academic coordinator will contact you shortly.');
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors && typeof err.fieldErrors === 'object') {
        const mapped = {};
        Object.entries(err.fieldErrors).forEach(([field, msgs]) => {
          const key = field === 'full_name' ? 'fullName' : field === 'training_mode' ? 'trainingMode' : field;
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors(mapped);
      }
      setToastType('error');
      setToastMessage(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Failed to submit enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoneChange = (e) => {
    // Strictly allow up to 10 digits only
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: digitsOnly });
    if (errors.phone) setErrors({ ...errors, phone: null });
  };

  return (
    <div className="py-12 bg-[#FAFAF7] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionTitle
          badge="Quick Enquiry"
          title="Program & Admission Enquiry"
          subtitle="Have questions about BCA/MCA project topics, course fees, or internship batches? Submit your enquiry below and our counselors will assist you promptly."
        />

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E1D2] shadow-lg">
          
          {isSubmitted ? (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-extrabold text-[#222326]">Enquiry Received!</h2>
              <p className="text-gray-600 text-base max-w-lg mx-auto">
                Thank you for inquiring with Gnana Computech Solutions. All your details have been dispatched directly to our academic staff team. A dedicated counselor will contact you at <strong>{formData.phone}</strong> or <strong>{formData.email}</strong> within 24 hours.
              </p>
              {submittedRef && (
                <p className="text-xs text-gray-500 font-mono">Reference ID: {submittedRef}</p>
              )}
              <div className="pt-4 flex flex-wrap justify-center gap-4">
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      fullName: '',
                      email: '',
                      phone: '',
                      college: '',
                      interest: 'Academic Project Guidance (BCA / MCA)',
                      trainingMode: 'Classroom / Offline (Bangalore Center)',
                      message: ''
                    });
                  }}
                  variant="primary"
                >
                  Submit Another Enquiry
                </Button>
                <Button to="/courses" variant="charcoal">
                  Explore Courses
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="border-b border-gray-100 pb-4 mb-2">
                <h3 className="text-lg font-bold text-[#222326] flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#D4A72C]" />
                  Tell Us What You Need
                </h3>
                <p className="text-xs text-gray-500">Fill in your contact information and your questions. Our staff receives this immediately.</p>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        if (errors.fullName) setErrors({ ...errors, fullName: null });
                      }}
                      placeholder="e.g. Ramesh Kumar"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                        errors.fullName ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                      }`}
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: null });
                      }}
                      placeholder="ramesh@gmail.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Phone (10 digits max) & College */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#222326]">
                      Mobile Number *
                    </label>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {formData.phone.length}/10 digits
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="10-digit mobile number (e.g. 9876543210)"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                        errors.phone ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    College / Organization
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      placeholder="e.g. Bangalore University / Surana College"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    />
                  </div>
                </div>
              </div>

              {/* Area of Interest & Preferred Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    I am Interested In *
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] appearance-none"
                    >
                      <option value="Academic Project Guidance (BCA / MCA)">Academic Project Guidance (BCA / MCA)</option>
                      <option value="Full Stack Web Development (Java / Python / MERN)">Full Stack Web Development (Java / Python / MERN)</option>
                      <option value="Python & Data Science / AI Training">Python & Data Analytics / AI Training</option>
                      <option value="Software Engineering Internship">Software Engineering IT Internship</option>
                      <option value="College Campus Workshops & Seminars">College Campus Workshops & Seminars</option>
                      <option value="Corporate & Executive Training">Corporate & Industry Training</option>
                      <option value="General Admission & Fee Enquiry">General Admission & Fee Enquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Preferred Mode of Training
                  </label>
                  <div className="relative">
                    <Laptop className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={formData.trainingMode}
                      onChange={(e) => setFormData({ ...formData, trainingMode: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] appearance-none"
                    >
                      <option value="Classroom / Offline (Bangalore Center)">Classroom / Offline (Bangalore Center)</option>
                      <option value="Live Online Interactive">Live Online Interactive</option>
                      <option value="Hybrid / Flexible">Hybrid / Flexible</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Message / Specific Questions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                  Your Enquiry / Specific Questions *
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (errors.message) setErrors({ ...errors, message: null });
                    }}
                    placeholder="Tell us what you'd like to know (e.g. IEEE project domains available, course timings, batch start dates, fees)..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                      errors.message ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                    }`}
                  />
                </div>
                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Enquiry…' : 'Submit Enquiry'}
                </Button>
                <p className="text-xs text-gray-500 mt-3">
                  All details are sent directly to our academic counseling staff at Sunkadakatte, Bangalore.
                </p>
              </div>

            </form>
          )}

        </div>
      </div>

      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
    </div>
  );
};
