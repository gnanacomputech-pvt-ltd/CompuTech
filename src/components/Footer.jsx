import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Shield, Award, ExternalLink, GraduationCap, Share2 } from 'lucide-react';
import { Logo } from './Logo';

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-[#01083f] via-[#021055] to-[#01083f] text-[#dbe7ff] border-t-4 border-[#ffcc00] pt-16 pb-8 shadow-2xl">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1: Logo & Company Description */}
          <div className="space-y-5">
            <Logo variant="dark" size="large" />
            <p className="text-[#b7c0e6] text-sm leading-relaxed">
              Gnana Computech Solutions Private Limited (GCS) is an industry-focused technology provider specializing in hands-on workshops, final year BCA/MCA projects, corporate IT internships, and enterprise software engineering in Bangalore.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffcc00]/10 border border-[#ffcc00]/30 text-xs font-bold text-[#ffcc00]">
                <Award className="w-3.5 h-3.5" /> ISO 9001:2015
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white">
                <Shield className="w-3.5 h-3.5 text-[#ffcc00]" /> MSME Unit
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffcc00]"></span>
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <span>›</span> Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <span>›</span> About GCS
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <span>›</span> Services & Solutions
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <span>›</span> Courses & Tracks
                </Link>
              </li>
              <li>
                <Link to="/internships" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <span>›</span> IT Internships
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <span>›</span> Events & Workshops
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <span>›</span> Campus Gallery
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <span>›</span> Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Programs & Portals */}
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffcc00]"></span>
              Portals & Programs
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/erp/dashboard" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#ffcc00]" /> Staff ERP Portal
                </Link>
              </li>
              <li>
                <Link to="/student/dashboard" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#ffcc00]" /> Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/institution/dashboard" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#ffcc00]" /> College Partner Portal
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <span>›</span> Student Registration
                </Link>
              </li>
              <li>
                <Link to="/courses/bca-mca-academic-prep" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <span>›</span> BCA & MCA Degree Projects
                </Link>
              </li>
              <li>
                <Link to="/courses/fullstack-web-dev" className="text-[#b7c0e6] hover:text-[#ffcc00] transition-colors flex items-center gap-1.5">
                  <span>›</span> Full Stack Python & React
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Contact & Social */}
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffcc00]"></span>
              Head Office
            </h3>
            <ul className="space-y-3 text-sm text-[#b7c0e6]">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#ffcc00] flex-shrink-0 mt-0.5" />
                <span>
                  2nd Floor, No. 126, 9th A Cross, 3rd Main, Vigneswara Nagar, Sunkadakatte, Viswaneedam Post, Bangalore North - 560091
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-[#ffcc00] flex-shrink-0" />
                <a href="tel:+919876543210" className="hover:text-white">+91 98765 43210 / +91 80 2345 6789</a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-[#ffcc00] flex-shrink-0" />
                <a href="mailto:info@gnanacomputech.com" className="hover:text-white">info@gnanacomputech.com</a>
              </li>
            </ul>

            {/* Social Share Links */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[#ffcc00]" /> Follow Our Tech Community
              </div>
              <div className="flex items-center space-x-2">
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-xs hover:bg-[#ffcc00] hover:text-[#01083f] hover:border-[#ffcc00] transition-colors">
                  ▶
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-xs hover:bg-[#ffcc00] hover:text-[#01083f] hover:border-[#ffcc00] transition-colors font-bold">
                  in
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-xs hover:bg-[#ffcc00] hover:text-[#01083f] hover:border-[#ffcc00] transition-colors font-bold">
                  ig
                </a>
                <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-xs hover:bg-[#ffcc00] hover:text-[#01083f] hover:border-[#ffcc00] transition-colors font-bold">
                  wa
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Footer Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#b7c0e6]">
          <p>© 2026 Gnana Computech Solutions Private Limited — Learning Made Simple, Skills Made Powerful.</p>
          <div className="flex items-center space-x-6">
            <Link to="/contact" className="hover:text-[#ffcc00] transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-[#ffcc00] transition-colors">Terms of Service</Link>
            <span className="text-gray-400">CIN: U85500KA2025PTC205651</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
