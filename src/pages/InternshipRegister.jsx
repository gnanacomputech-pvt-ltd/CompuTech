import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SectionTitle } from '../components/SectionTitle';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { CheckCircle2, Briefcase, Calendar, User, Phone, Mail, Building, Clock, MapPin, Award } from 'lucide-react';
import { submitInternshipRegistration } from '../lib/api/public';
import { ApiError } from '../lib/api/client';

export const InternshipRegister = () => {
  const location = useLocation();

  // Allow pre-filling track from query params or state if redirected from an internship card
  const queryParams = new URLSearchParams(location.search);
  const initialTrack = queryParams.get('track') || location.state?.track || 'Full Stack Web Development';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    degree: 'BCA (Bachelor of Computer Applications)',
    semester: '6th Semester',
    internshipTrack: initialTrack,
    duration: '3 Months',
    mode: 'Hybrid (Classroom + Online)',
    startDate: '',
    skillsOrPortfolio: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialTrack) {
      setFormData((prev) => ({ ...prev, internshipTrack: initialTrack }));
    }
  }, [initialTrack]);

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Enter a valid email address';
    }
    const cleanPhone = formData.phone.trim();
    if (!cleanPhone) {
      errs.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit phone number';
    }
    if (!formData.college.trim()) errs.college = 'College or University name is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitInternshipRegistration({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        college: formData.college,
        degree: formData.degree,
        semester: formData.semester,
        internship_track: formData.internshipTrack,
        duration: formData.duration,
        mode: formData.mode,
        start_date: formData.startDate || null,
        skills_or_portfolio: formData.skillsOrPortfolio,
        message: formData.message,
      });
      setIsSubmitted(true);
      setToastType('success');
      setToastMessage('Application Submitted! Our internship coordinator will contact you shortly.');
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors && typeof err.fieldErrors === 'object') {
        const mapped = {};
        Object.entries(err.fieldErrors).forEach(([field, msgs]) => {
          const key = field === 'full_name' ? 'fullName' :
                      field === 'internship_track' ? 'internshipTrack' :
                      field === 'start_date' ? 'startDate' :
                      field === 'skills_or_portfolio' ? 'skillsOrPortfolio' : field;
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors(mapped);
      }
      setToastType('error');
      setToastMessage(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Failed to submit internship application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionTitle
          badge="Career Programs"
          title="IT & Software Internship Registration"
          subtitle="Work on production-grade client applications, receive real corporate mentorship, and earn verified internship credentials."
        />

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E1D2] shadow-lg">
          
          {isSubmitted ? (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-extrabold text-[#222326]">Application Submitted!</h2>
              <p className="text-gray-600 text-base max-w-lg mx-auto">
                Thank you for applying for the internship program at Gnana Computech Solutions. Our recruitment and technical mentors will review your profile and contact you within 24 hours.
              </p>

              <div className="bg-[#FAFAF7] p-6 rounded-2xl border border-[#E8E1D2] max-w-md mx-auto text-left text-xs space-y-2">
                <p><strong>Candidate:</strong> {formData.fullName}</p>
                <p><strong>Track:</strong> {formData.internshipTrack}</p>
                <p><strong>Duration:</strong> {formData.duration}</p>
                <p><strong>Mode:</strong> {formData.mode}</p>
                <p><strong>College:</strong> {formData.college}</p>
              </div>

              <div className="pt-4 flex justify-center gap-4">
                <Button onClick={() => setIsSubmitted(false)} variant="outline" size="md">
                  Submit Another Application
                </Button>
                <Button to="/internships" variant="primary" size="md">
                  View All Internships
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Applicant Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        if (errors.fullName) setErrors({ ...errors, fullName: null });
                      }}
                      placeholder="e.g. Ananya Sharma"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                        errors.fullName ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                      }`}
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: null });
                      }}
                      placeholder="ananya@gmail.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#222326]">
                      Phone Number *
                    </label>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {formData.phone.length}/10 digits
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: digits });
                        if (errors.phone) setErrors({ ...errors, phone: null });
                      }}
                      placeholder="9876543210"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                        errors.phone ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    College / University *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={formData.college}
                      onChange={(e) => {
                        setFormData({ ...formData, college: e.target.value });
                        if (errors.college) setErrors({ ...errors, college: null });
                      }}
                      placeholder="e.g. RV Institute of Technology"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                        errors.college ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                      }`}
                    />
                  </div>
                  {errors.college && <p className="text-xs text-red-500 mt-1">{errors.college}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Degree / Discipline *
                  </label>
                  <select
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                  >
                    <option value="BCA (Bachelor of Computer Applications)">BCA (Bachelor of Computer Applications)</option>
                    <option value="MCA (Master of Computer Applications)">MCA (Master of Computer Applications)</option>
                    <option value="B.E. / B.Tech (Computer Science / IT)">B.E. / B.Tech (Computer Science / IT)</option>
                    <option value="B.E. / B.Tech (AI & Data Science / ECE)">B.E. / B.Tech (AI & Data Science / ECE)</option>
                    <option value="BSc Computer Science / IT">BSc Computer Science / IT</option>
                    <option value="Diploma in Computer Science">Diploma in Computer Science</option>
                    <option value="Recent Graduate / Passout">Recent Graduate / Passout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Current Semester *
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                  >
                    <option value="4th Semester">4th Semester</option>
                    <option value="5th Semester">5th Semester</option>
                    <option value="6th Semester">6th Semester</option>
                    <option value="7th Semester">7th Semester</option>
                    <option value="8th Semester">8th Semester</option>
                    <option value="Passout / Graduate">Passout / Looking for Career Jump</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Internship Track *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                    <select
                      value={formData.internshipTrack}
                      onChange={(e) => setFormData({ ...formData, internshipTrack: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    >
                      <option value="Full Stack Web Development">Full Stack Web (MERN / Python)</option>
                      <option value="Python & Data Science Track">Python & Data Science Track</option>
                      <option value="Java Enterprise Backend Track">Java Enterprise Backend Track</option>
                      <option value="Cloud Computing & DevOps Track">Cloud Computing & DevOps Track</option>
                      <option value="Mobile App Development Track">Mobile App (Flutter / Android)</option>
                      <option value="Cybersecurity & Ethical Hacking">Cybersecurity & Ethical Hacking</option>
                      <option value="UI/UX & Frontend Development">UI/UX & Frontend Development</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Duration *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    >
                      <option value="1 Month">1 Month (Fast-track)</option>
                      <option value="2 Months">2 Months</option>
                      <option value="3 Months">3 Months (Recommended)</option>
                      <option value="6 Months">6 Months (Comprehensive)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Work Mode *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                    <select
                      value={formData.mode}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    >
                      <option value="Hybrid (Classroom + Online)">Hybrid (Classroom + Online)</option>
                      <option value="In-Office / Classroom (Bangalore)">In-Office (Sunkadakatte, Bangalore)</option>
                      <option value="Virtual / Remote Online">Virtual / Remote Online</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Preferred Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Skills, GitHub, or LinkedIn Profile
                  </label>
                  <input
                    type="text"
                    value={formData.skillsOrPortfolio}
                    onChange={(e) => setFormData({ ...formData, skillsOrPortfolio: e.target.value })}
                    placeholder="e.g. JavaScript, Python, github.com/username"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                  Personal Objective or Message
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us what you want to achieve through this internship, project experience, or any questions..."
                  className="w-full p-4 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full flex items-center justify-center font-bold"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Application...' : 'Submit Internship Application'}
                </Button>
                <p className="text-center text-xs text-gray-500 mt-3">
                  All interns receive real project credentials, mentor reviews, and corporate completion certificates.
                </p>
              </div>

            </form>
          )}

        </div>

      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
};
export default InternshipRegister;
