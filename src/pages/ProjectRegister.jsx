import React, { useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { CheckCircle2, FolderGit2, Calendar, User, Phone, Mail, Building, Users, Code, BookOpen } from 'lucide-react';
import { submitProjectRegistration } from '../lib/api/public';
import { ApiError } from '../lib/api/client';

export const ProjectRegister = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    degree: 'BCA (Bachelor of Computer Applications)',
    yearOrSemester: '6th Semester',
    projectDomain: 'Full Stack Web Development',
    projectTitle: '',
    teamSize: 'Individual (1 member)',
    preferredTechnology: 'Python & Django / Flask',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Student or team lead name is required';
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
      await submitProjectRegistration({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        college: formData.college,
        degree: formData.degree,
        year_or_semester: formData.yearOrSemester,
        project_domain: formData.projectDomain,
        project_title: formData.projectTitle,
        team_size: formData.teamSize,
        preferred_technology: formData.preferredTechnology,
        message: formData.message,
      });
      setIsSubmitted(true);
      setToastType('success');
      setToastMessage('Project Registration Received! Our technical project guide will contact you shortly.');
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors && typeof err.fieldErrors === 'object') {
        const mapped = {};
        Object.entries(err.fieldErrors).forEach(([field, msgs]) => {
          const key = field === 'full_name' ? 'fullName' :
                      field === 'year_or_semester' ? 'yearOrSemester' :
                      field === 'project_domain' ? 'projectDomain' :
                      field === 'project_title' ? 'projectTitle' :
                      field === 'team_size' ? 'teamSize' :
                      field === 'preferred_technology' ? 'preferredTechnology' : field;
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors(mapped);
      }
      setToastType('error');
      setToastMessage(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Failed to submit project registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionTitle
          badge="Academic Projects"
          title="Final Year Project Registration"
          subtitle="Get end-to-end guidance, synopsis approval, source code walkthroughs, and viva preparation for BCA, MCA, BE & BSc CS students."
        />

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E1D2] shadow-lg">
          
          {isSubmitted ? (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-extrabold text-[#222326]">Project Registration Received!</h2>
              <p className="text-gray-600 text-base max-w-lg mx-auto">
                Thank you for registering your project with Gnana Computech Solutions. Our academic technical coordinator will review your domain and reach out within 24 hours.
              </p>

              <div className="bg-[#FAFAF7] p-6 rounded-2xl border border-[#E8E1D2] max-w-md mx-auto text-left text-xs space-y-2">
                <p><strong>Lead Student:</strong> {formData.fullName}</p>
                <p><strong>College:</strong> {formData.college}</p>
                <p><strong>Degree & Sem:</strong> {formData.degree} ({formData.yearOrSemester})</p>
                <p><strong>Project Domain:</strong> {formData.projectDomain}</p>
                <p><strong>Preferred Tech:</strong> {formData.preferredTechnology}</p>
                <p><strong>Team Size:</strong> {formData.teamSize}</p>
              </div>

              <div className="pt-4 flex justify-center gap-4">
                <Button onClick={() => setIsSubmitted(false)} variant="outline" size="md">
                  Register Another Project
                </Button>
                <Button to="/" variant="primary" size="md">
                  Return to Home
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Student / Team Lead Name *
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
                      placeholder="e.g. Prajwal Gowda"
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
                      placeholder="student@gmail.com"
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
                      placeholder="e.g. Soundarya Institute of Management"
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
                    Degree Stream *
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                    <select
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    >
                      <option value="BCA (Bachelor of Computer Applications)">BCA (Bachelor of Computer Applications)</option>
                      <option value="MCA (Master of Computer Applications)">MCA (Master of Computer Applications)</option>
                      <option value="B.E. / B.Tech (Computer Science / IT)">B.E. / B.Tech (Computer Science / IT)</option>
                      <option value="B.E. / B.Tech (AI & Data Science)">B.E. / B.Tech (AI & Data Science)</option>
                      <option value="BSc Computer Science">BSc Computer Science</option>
                      <option value="Diploma in Computer Science">Diploma in Computer Science</option>
                      <option value="M.Tech / MS">M.Tech / MS</option>
                      <option value="Other Degree">Other Degree</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Year / Semester *
                  </label>
                  <select
                    value={formData.yearOrSemester}
                    onChange={(e) => setFormData({ ...formData, yearOrSemester: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                  >
                    <option value="5th Semester">5th Semester</option>
                    <option value="6th Semester">6th Semester (Final Year BCA/BSc)</option>
                    <option value="7th Semester">7th Semester</option>
                    <option value="8th Semester">8th Semester (Final Year BE)</option>
                    <option value="4th Semester (MCA)">4th Semester (Final Year MCA)</option>
                    <option value="Passout / Graduate">Passout / Graduate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Project Domain *
                  </label>
                  <div className="relative">
                    <FolderGit2 className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                    <select
                      value={formData.projectDomain}
                      onChange={(e) => setFormData({ ...formData, projectDomain: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    >
                      <option value="Full Stack Web Development">Full Stack Web Development (MERN / Python)</option>
                      <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
                      <option value="Data Science & Analytics">Data Science & Analytics</option>
                      <option value="Cloud Computing & DevOps">Cloud Computing & DevOps</option>
                      <option value="Internet of Things (IoT)">Internet of Things (IoT) & Embedded</option>
                      <option value="Mobile Application Development">Mobile Application Development (Flutter / Android)</option>
                      <option value="Cybersecurity & Ethical Hacking">Cybersecurity & Ethical Hacking</option>
                      <option value="Blockchain & Web3">Blockchain & Web3</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Team Size *
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                    <select
                      value={formData.teamSize}
                      onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    >
                      <option value="Individual (1 member)">Individual (1 member)</option>
                      <option value="2 Members Team">2 Members Team</option>
                      <option value="3 Members Team">3 Members Team</option>
                      <option value="4 Members Team">4 Members Team</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Preferred Technology Stack
                  </label>
                  <div className="relative">
                    <Code className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                    <select
                      value={formData.preferredTechnology}
                      onChange={(e) => setFormData({ ...formData, preferredTechnology: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    >
                      <option value="Python & Django / Flask">Python & Django / Flask</option>
                      <option value="MERN Stack (React, Node, Express, MongoDB)">MERN Stack (React, Node, Express, MongoDB)</option>
                      <option value="Java Enterprise & Spring Boot">Java Enterprise & Spring Boot</option>
                      <option value="Flutter / React Native Mobile">Flutter / React Native Mobile</option>
                      <option value="PHP & MySQL">PHP & MySQL</option>
                      <option value="Open to Faculty / Guide Recommendation">Open to Faculty / Guide Recommendation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Project Title / Idea (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.projectTitle}
                    onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                    placeholder="e.g. AI-Powered Smart Attendance System"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Leave empty if you need topic suggestions from our guides.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                  College Guidelines or Specific Requirements
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Mention any specific university guidelines, submission deadlines, synopsis submission date, or custom features you want to include..."
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
                  {submitting ? 'Submitting Registration...' : 'Submit Project Registration'}
                </Button>
                <p className="text-center text-xs text-gray-500 mt-3">
                  All registrations include project synopsis, complete source code, documentation & viva prep.
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
export default ProjectRegister;
