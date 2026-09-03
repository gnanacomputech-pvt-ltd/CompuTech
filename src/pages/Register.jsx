import React, { useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { CheckCircle2, GraduationCap, Calendar, User, Phone, Mail, Building } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    course: 'BCA (Bachelor of Computer Applications)',
    program: 'Academic Project Guidance',
    preferredDate: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^[0-9+\s-]{10,15}$/.test(formData.phone)) {
      errs.phone = 'Enter a valid 10-digit phone number';
    }
    if (!formData.college.trim()) errs.college = 'College or Institution name is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitted(true);
      setToastMessage('Registration Successful! Our academic coordinator will contact you shortly.');
    }
  };

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionTitle
          badge="Online Application"
          title="Student Registration & Project Enrollment"
          subtitle="Register for BCA/MCA academic project guidance, software courses, or IT internships at Gnana Computech Solutions."
        />

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E1D2] shadow-lg">
          
          {isSubmitted ? (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-extrabold text-[#222326]">Registration Received!</h2>
              <p className="text-gray-600 text-base max-w-lg mx-auto">
                Thank you for applying with Gnana Computech Solutions Private Limited. Our training team will review your application and call you within 24 hours.
              </p>

              <div className="bg-[#FAFAF7] p-6 rounded-2xl border border-[#E8E1D2] max-w-md mx-auto text-left text-xs space-y-2">
                <p><strong>Applicant Name:</strong> {formData.fullName}</p>
                <p><strong>College:</strong> {formData.college}</p>
                <p><strong>Program Selected:</strong> {formData.program}</p>
                <p><strong>Degree Track:</strong> {formData.course}</p>
              </div>

              <div className="pt-4 flex justify-center gap-4">
                <Button onClick={() => setIsSubmitted(false)} variant="outline" size="md">
                  Register Another Student
                </Button>
                <Button to="/" variant="primary" size="md">
                  Return to Home
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-xl font-bold text-[#222326]">Personal & Academic Details</h3>
                <p className="text-xs text-[#6B6B6B]">Please provide accurate information for certificate generation.</p>
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Prajwal Gowda"
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
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. student@gmail.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Phone & College */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                        errors.phone ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    College / Institution *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      placeholder="e.g. Sunkadakatte Degree College"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                        errors.college ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                      }`}
                    />
                  </div>
                  {errors.college && <p className="text-xs text-red-500 mt-1">{errors.college}</p>}
                </div>
              </div>

              {/* Course & Program Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Course / Degree Stream
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                  >
                    <option value="BCA (Bachelor of Computer Applications)">BCA (Bachelor of Computer Applications)</option>
                    <option value="MCA (Master of Computer Applications)">MCA (Master of Computer Applications)</option>
                    <option value="B.E. / B.Tech (CS / IT / ECE)">B.E. / B.Tech (CS / IT / ECE)</option>
                    <option value="BSc Computer Science">BSc Computer Science</option>
                    <option value="Diploma in Computer Science">Diploma in CS / IT</option>
                    <option value="Other Degree Stream">Other Stream</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Program / Training Needed
                  </label>
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                  >
                    <option value="Academic Project Guidance">BCA / MCA Final Year Project</option>
                    <option value="Full Stack Web Development (MERN)">Full Stack Web Development (MERN)</option>
                    <option value="Python & Data Science Course">Python & Data Analytics</option>
                    <option value="Software Internship Track">IT / Software Internship (1 to 6 Months)</option>
                    <option value="Java Enterprise Track">Java Enterprise Engineering</option>
                    <option value="Flutter Mobile App Track">Mobile App Development</option>
                  </select>
                </div>
              </div>

              {/* Date & Additional Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Preferred Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Additional Requirement Notes
                  </label>
                  <input
                    type="text"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="e.g. Need Python Django project topic synopsis"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" variant="primary" size="lg" className="w-full">
                  Submit Registration
                </Button>
              </div>

            </form>
          )}

        </div>

      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
};
