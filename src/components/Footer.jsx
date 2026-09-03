import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Shield, Award, ExternalLink } from 'lucide-react';
import { Logo } from './Logo';

export const Footer = () => {
  return (
    <footer className="bg-[#17181A] text-white border-t border-[#D4A72C]/30 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          
          {/* Col 1: Logo & Company Description */}
          <div className="space-y-5">
            <Logo variant="dark" size="large" />
            <p className="text-gray-300 text-sm leading-relaxed">
              Gnana Computech Solutions Private Limited (GCS) is a leading software engineering, academic project guidance, IT internship, and technology skill training provider based in Sunkadakatte, Bangalore.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A72C]/10 border border-[#D4A72C]/30 text-xs font-semibold text-[#D4A72C]">
                <Award className="w-3.5 h-3.5" /> ISO 9001:2015
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs font-semibold text-gray-300">
                <Shield className="w-3.5 h-3.5 text-[#D4A72C]" /> MSME Unit
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4A72C]"></span>
              Quick Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1">
                  <span>›</span> Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1">
                  <span>›</span> About GCS
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1">
                  <span>›</span> Services & Solutions
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1">
                  <span>›</span> Courses & Programs
                </Link>
              </li>
              <li>
                <Link to="/internships" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1">
                  <span>›</span> IT Internships
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1">
                  <span>›</span> Events & Workshops
                </Link>
              </li>
              <li>
                <Link to="/blogs" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1">
                  <span>›</span> Technical Blogs
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1">
                  <span>›</span> Image Gallery
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1">
                  <span>›</span> Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Portals & Specialized Programs */}
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4A72C]"></span>
              Portals & Tracks
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/erp/dashboard" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4A72C]" /> GCS ERP Staff Portal
                </Link>
              </li>
              <li>
                <Link to="/student/dashboard" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4A72C]" /> Student Portal UI
                </Link>
              </li>
              <li>
                <Link to="/institution/dashboard" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4A72C]" /> Institution Partner Portal
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1">
                  <span>›</span> Student Registration Form
                </Link>
              </li>
              <li>
                <Link to="/courses/bca-mca-academic-prep" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1">
                  <span>›</span> BCA / MCA Final Year Projects
                </Link>
              </li>
              <li>
                <Link to="/courses/fullstack-web-dev" className="text-gray-400 hover:text-[#D4A72C] transition-colors flex items-center gap-1">
                  <span>›</span> MERN & Python Full Stack
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Contact Information */}
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4A72C]"></span>
              Official Address
            </h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#D4A72C] flex-shrink-0 mt-0.5" />
                <span>
                  2nd Floor, No. 126, 9th A Cross, 3rd Main, Vigneswara Nagar, Sunkadakatte, Viswaneedam Post, Bangalore North, Karnataka - 560091
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-[#D4A72C] flex-shrink-0" />
                <span>+91 98765 43210 / +91 80 2345 6789</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-[#D4A72C] flex-shrink-0" />
                <span>info@gnanacomputech.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-[#D4A72C] flex-shrink-0" />
                <span>Mon - Sat: 09:30 AM - 06:30 PM IST</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Footer Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 Gnana Computech Solutions Private Limited. All Rights Reserved.</p>
          <div className="flex items-center space-x-6">
            <Link to="/contact" className="hover:text-[#D4A72C] transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-[#D4A72C] transition-colors">Terms & Conditions</Link>
            <Link to="/contact" className="hover:text-[#D4A72C] transition-colors">CIN: U85500KA2025PTC205651</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
