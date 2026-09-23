import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Award, Shield } from 'lucide-react';
import { Logo } from './Logo';

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-[#01083f] via-[#021055] to-[#01083f] text-[#dbe7ff] border-t-4 border-[#ffcc00] pt-14 pb-8 shadow-2xl">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">

          {/* Col 1: Logo & Company Description */}
          <div className="space-y-5">
            <Logo variant="dark" size="large" />
            <p className="text-[#b7c0e6] text-sm leading-relaxed">
              Gnana Computech Solutions Private Limited (GCS) — hands-on workshops, final year BCA/MCA projects, and corporate IT internships in Bangalore.
            </p>
            <div className="flex items-center flex-wrap gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffcc00]/10 border border-[#ffcc00]/30 text-xs font-bold text-[#ffcc00]">
                <Award className="w-3.5 h-3.5" /> DPIIT Recognized
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white">
                <Shield className="w-3.5 h-3.5 text-[#ffcc00]" /> MCA Incorporated
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffcc00]"></span>
              Quick Links
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
              <li>
                <Link to="/about" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors">About</Link>
              </li>
              <li>
                <Link to="/services" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors">Services</Link>
              </li>
              <li>
                <Link to="/courses" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors">Courses</Link>
              </li>
              <li>
                <Link to="/internships" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors">Internships</Link>
              </li>
              <li>
                <Link to="/events" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors">Events</Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Location & Contact */}
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffcc00]"></span>
              Location
            </h3>
            <ul className="space-y-3 text-sm text-[#b7c0e6]">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#ffcc00] flex-shrink-0 mt-0.5" />
                <span>
                  Sunkadakatte, Bangalore North, Karnataka - 560091
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-[#ffcc00] flex-shrink-0" />
                <a href="tel:+919876543210" className="hover:text-white">+91 98765 43210</a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-[#ffcc00] flex-shrink-0" />
                <a href="mailto:info@gnanacomputech.com" className="hover:text-white">info@gnanacomputech.com</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Footer Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#b7c0e6]">
          <p>© 2026 Gnana Computech Solutions Private Limited</p>
          <Link to="/login" className="hover:text-[#ffcc00] transition-colors">Portal Login</Link>
        </div>

      </div>
    </footer>
  );
};
