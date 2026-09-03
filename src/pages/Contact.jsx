import React, { useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Building2 } from 'lucide-react';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Academic Project Enquiry',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full Name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^[0-9+\s-]{10,15}$/.test(formData.phone)) {
      errs.phone = 'Invalid phone number';
    }
    if (!formData.message.trim()) errs.message = 'Message content is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitted(true);
      setToastMessage('Thank you! Your message has been submitted.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'Academic Project Enquiry',
        message: ''
      });
    }
  };

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionTitle
          badge="Get in Touch"
          title="Contact Gnana Computech Solutions"
          subtitle="Have questions about BCA final year projects, software training courses, or IT internships? Visit our Sunkadakatte center or send us a message."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          
          {/* Left Column: Contact Details & Office info */}
          <div className="lg:col-span-5 space-y-8">
            
            <div className="bg-[#17181A] rounded-2xl p-8 text-white border border-[#D4A72C]/40 space-y-6 shadow-xl">
              <div className="border-b border-gray-800 pb-4">
                <span className="text-xs uppercase font-bold tracking-wider text-[#D4A72C]">Corporate Headquarters</span>
                <h3 className="text-xl font-bold text-white mt-1">Gnana Computech Solutions Pvt. Ltd.</h3>
              </div>

              <div className="space-y-4 text-sm text-gray-300">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-[#D4A72C] flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-white block mb-0.5">Address:</strong>
                    2nd Floor, No. 126, 9th A Cross, 3rd Main, Vigneswara Nagar, Sunkadakatte, Viswaneedam Post, Bangalore North, Karnataka - 560091
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-[#D4A72C] flex-shrink-0" />
                  <div>
                    <strong className="text-white block">Phone:</strong>
                    +91 98765 43210 / +91 80 2345 6789
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-[#D4A72C] flex-shrink-0" />
                  <div>
                    <strong className="text-white block">Email:</strong>
                    info@gnanacomputech.com
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-[#D4A72C] flex-shrink-0" />
                  <div>
                    <strong className="text-white block">Office Hours:</strong>
                    Monday – Saturday: 09:30 AM – 06:30 PM IST
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 text-xs text-gray-400">
                <p><strong>CIN:</strong> U85500KA2025PTC205651</p>
                <p className="mt-1">Landmark: Near Sunkadakatte Main Bus Stand & Vigneswara Nagar</p>
              </div>
            </div>

            {/* Quick Consultation Badge */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] space-y-2">
              <h4 className="font-bold text-[#222326] flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-[#D4A72C]" /> Student Walk-in Hours
              </h4>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                Students can visit our center anytime between 10:00 AM and 05:00 PM for live project code demos and syllabus discussion.
              </p>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-8 sm:p-10 border border-[#E8E1D2] shadow-sm">
            <h3 className="text-2xl font-bold text-[#222326] mb-2">Send Us a Direct Message</h3>
            <p className="text-sm text-[#6B6B6B] mb-6">Fill out the form below and our academic support team will respond within 24 hours.</p>

            {isSubmitted && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Submission Received!</h4>
                  <p className="text-xs">Thank you! Your message has been submitted. Our team will contact you shortly.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Prajwal Gowda"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                      errors.name ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. student@gmail.com"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                      errors.email ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                    }`}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                      errors.phone ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                    }`}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                    Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                  >
                    <option value="Academic Project Enquiry">BCA / MCA Project Enquiry</option>
                    <option value="Course Admission">Course / Training Admission</option>
                    <option value="Internship Application">IT Internship Application</option>
                    <option value="College Partnership">College / Institution Workshop</option>
                    <option value="General Query">Other General Query</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-1">
                  Message *
                </label>
                <textarea
                  rows="4"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your project requirement, college details, or course interest..."
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                    errors.message ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                  }`}
                />
                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" icon={Send}>
                Send Message Now
              </Button>
            </form>

          </div>

        </div>

      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
};
