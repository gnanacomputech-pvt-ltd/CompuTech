import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SectionTitle } from '../components/SectionTitle';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { CheckCircle2, Calendar, User, Phone, Mail, Building, Users, Sparkles, MapPin } from 'lucide-react';
import { submitEventRegistration } from '../lib/api/public';
import { ApiError } from '../lib/api/client';

export const EventRegister = () => {
  const location = useLocation();

  // Allow pre-filling event title from query params or route state if clicked from an event card
  const queryParams = new URLSearchParams(location.search);
  const initialEvent = queryParams.get('event') || location.state?.eventTitle || 'BCA/MCA National Tech Summit 2026';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    eventTitle: initialEvent,
    collegeOrOrganization: '',
    attendeeType: 'Student',
    ticketCount: 1,
    participationMode: 'In-Person (Campus / Venue)',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialEvent) {
      setFormData((prev) => ({ ...prev, eventTitle: initialEvent }));
    }
  }, [initialEvent]);

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
    if (!formData.eventTitle.trim()) errs.eventTitle = 'Event or Workshop title is required';
    if (!formData.collegeOrOrganization.trim()) errs.collegeOrOrganization = 'Institution or organization is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitEventRegistration({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        event_title: formData.eventTitle,
        college_or_organization: formData.collegeOrOrganization,
        attendee_type: formData.attendeeType,
        ticket_count: parseInt(formData.ticketCount, 10) || 1,
        participation_mode: formData.participationMode,
        message: formData.message,
      });
      setIsSubmitted(true);
      setToastType('success');
      setToastMessage('Event Registration Confirmed! We look forward to seeing you at the event.');
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors && typeof err.fieldErrors === 'object') {
        const mapped = {};
        Object.entries(err.fieldErrors).forEach(([field, msgs]) => {
          const key = field === 'full_name' ? 'fullName' :
                      field === 'event_title' ? 'eventTitle' :
                      field === 'college_or_organization' ? 'collegeOrOrganization' :
                      field === 'attendee_type' ? 'attendeeType' :
                      field === 'ticket_count' ? 'ticketCount' :
                      field === 'participation_mode' ? 'participationMode' : field;
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors(mapped);
      }
      setToastType('error');
      setToastMessage(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Failed to submit event registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionTitle
          badge="Workshops & Hackathons"
          title="Event & Workshop Registration"
          subtitle="Reserve your seat for upcoming technical symposiums, hands-on masterclasses, and corporate workshops organized by Gnana Computech."
        />

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E1D2] shadow-lg">
          
          {isSubmitted ? (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-extrabold text-[#222326]">Registration Confirmed!</h2>
              <p className="text-gray-600 text-base max-w-lg mx-auto">
                Your pass has been reserved. Our event team has sent your registration details to staff and will email you the session schedule and venue/meeting link.
              </p>

              <div className="bg-[#FAFAF7] p-6 rounded-2xl border border-[#E8E1D2] max-w-md mx-auto text-left text-xs space-y-2">
                <p><strong>Attendee:</strong> {formData.fullName}</p>
                <p><strong>Event:</strong> {formData.eventTitle}</p>
                <p><strong>Institution / Org:</strong> {formData.collegeOrOrganization}</p>
                <p><strong>Passes Reserved:</strong> {formData.ticketCount} Attendee(s)</p>
                <p><strong>Mode:</strong> {formData.participationMode}</p>
              </div>

              <div className="pt-4 flex justify-center gap-4">
                <Button onClick={() => setIsSubmitted(false)} variant="outline" size="md">
                  Register Another Attendee
                </Button>
                <Button to="/events" variant="primary" size="md">
                  Back to All Events
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                  Select or Enter Event / Workshop *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={formData.eventTitle}
                    onChange={(e) => {
                      setFormData({ ...formData, eventTitle: e.target.value });
                      if (errors.eventTitle) setErrors({ ...errors, eventTitle: null });
                    }}
                    placeholder="e.g. Masterclass on Generative AI & LLMs, BCA Project Expo 2026"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                      errors.eventTitle ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                    }`}
                  />
                </div>
                {errors.eventTitle && <p className="text-xs text-red-500 mt-1">{errors.eventTitle}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Attendee Full Name *
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
                      placeholder="e.g. Rakesh Kumar"
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
                      placeholder="rakesh@gmail.com"
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
                    College / Organization *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={formData.collegeOrOrganization}
                      onChange={(e) => {
                        setFormData({ ...formData, collegeOrOrganization: e.target.value });
                        if (errors.collegeOrOrganization) setErrors({ ...errors, collegeOrOrganization: null });
                      }}
                      placeholder="e.g. BMS College / Infosys / Self"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C] ${
                        errors.collegeOrOrganization ? 'border-red-500 bg-red-50' : 'border-[#E8E1D2] bg-[#FAFAF7]'
                      }`}
                    />
                  </div>
                  {errors.collegeOrOrganization && <p className="text-xs text-red-500 mt-1">{errors.collegeOrOrganization}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Attendee Profile *
                  </label>
                  <select
                    value={formData.attendeeType}
                    onChange={(e) => setFormData({ ...formData, attendeeType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                  >
                    <option value="Student">Student (BCA / MCA / BE)</option>
                    <option value="Faculty / Academician">Faculty / Professor</option>
                    <option value="Working Professional">Working Professional</option>
                    <option value="Corporate Representative">Corporate Representative</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Number of Passes *
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                    <select
                      value={formData.ticketCount}
                      onChange={(e) => setFormData({ ...formData, ticketCount: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    >
                      <option value="1">1 Person (Individual)</option>
                      <option value="2">2 Persons</option>
                      <option value="3">3 Persons</option>
                      <option value="4">4 Persons</option>
                      <option value="5">5+ (Group Delegation)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                    Participation Mode *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                    <select
                      value={formData.participationMode}
                      onChange={(e) => setFormData({ ...formData, participationMode: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D2] bg-[#FAFAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
                    >
                      <option value="In-Person (Campus / Venue)">In-Person (Bangalore Venue)</option>
                      <option value="Virtual Live Stream (Zoom / Meet)">Virtual Live Stream</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">
                  Special Requirements or Questions for the Speaker
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Any questions or specific topics you would like covered during the session..."
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
                  {submitting ? 'Registering...' : 'Confirm Event Registration'}
                </Button>
                <p className="text-center text-xs text-gray-500 mt-3">
                  Participation certificates are awarded to all attendees upon session completion.
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
export default EventRegister;
