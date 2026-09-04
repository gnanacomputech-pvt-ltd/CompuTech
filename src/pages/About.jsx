import React from 'react';
import { ShieldCheck, Award, Target, Eye, BookOpen, Building2, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { SectionTitle } from '../components/SectionTitle';
import { PartnerSection } from '../components/PartnerSection';
import { Button } from '../components/Button';

export const About = () => {
  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <div className="bg-[#17181A] rounded-3xl p-8 sm:p-12 text-white border border-[#D4A72C]/40 mb-16 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#D4A72C] text-[#17181A] uppercase tracking-wider">
              About Gnana Computech Solutions
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Pioneering Technical Skill Education & Software Development in Bangalore
            </h1>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              Gnana Computech Solutions Private Limited (CIN: U85500KA2025PTC205651) is an active software and technology education company based in Sunkadakatte, Bangalore North, Karnataka.
            </p>
          </div>
        </div>

        {/* Company Overview & Legal Identity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-7 space-y-6">
            <SectionTitle
              badge="Corporate Identity"
              title="Who We Are"
              align="left"
              subtitle="Bridging the gap between university curriculum and software industry expectations."
            />
            <p className="text-[#252525] text-base leading-relaxed">
              Founded in Bangalore, Gnana Computech Solutions Private Limited is dedicated to providing high-quality software development services, academic project guidance for BCA, MCA, and Engineering students, corporate IT internships, and industry-tailored technology training.
            </p>
            <p className="text-[#6B6B6B] text-base leading-relaxed">
              Located in the tech hub of Sunkadakatte, we empower students and institutions with practical, hands-on learning models. We do not just teach syntax; we guide our learners through real enterprise software life-cycles, Git workflows, system architecture, database design, and cloud deployment.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-white border border-[#E8E1D2] flex items-start space-x-3">
                <ShieldCheck className="w-6 h-6 text-[#D4A72C] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[#222326]">ISO 9001:2015 Certified</h4>
                  <p className="text-xs text-[#6B6B6B]">Internationally certified for IT training quality and academic project guidance standards.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E8E1D2] flex items-start space-x-3">
                <Building2 className="w-6 h-6 text-[#D4A72C] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[#222326]">MSME & Govt. Registered</h4>
                  <p className="text-xs text-[#6B6B6B]">Official corporate entity operating under Indian Companies Act standards.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Box */}
          <div className="lg:col-span-5 bg-white p-8 rounded-2xl border-2 border-[#D4A72C] shadow-lg space-y-6">
            <h3 className="text-xl font-bold text-[#222326] flex items-center gap-2 border-b border-gray-100 pb-4">
              <MapPin className="w-5 h-5 text-[#D4A72C]" /> Registered Head Office
            </h3>
            
            <div className="space-y-3 text-sm text-[#252525]">
              <p className="font-bold text-base text-[#17181A]">
                Gnana Computech Solutions Private Limited
              </p>
              <p className="text-[#6B6B6B] leading-relaxed">
                2nd Floor, No. 126, 9th A Cross, 3rd Main,<br />
                Vigneswara Nagar, Sunkadakatte,<br />
                Viswaneedam Post, Bangalore North,<br />
                Karnataka, India - 560091
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-[#6B6B6B]">
              <p><strong>CIN:</strong> U85500KA2025PTC205651</p>
              <p><strong>Primary Contact:</strong> info@gnanacomputech.com</p>
              <p><strong>Operating Region:</strong> Sunkadakatte, Bangalore & Karnataka State</p>
            </div>

            <Button to="/contact" variant="primary" size="md" className="w-full">
              Get Directions & Contact
            </Button>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white p-8 rounded-2xl border border-[#E8E1D2] hover:border-[#D4A72C] transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] text-[#D4A72C] flex items-center justify-center mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-[#222326] mb-3">Our Mission</h3>
            <p className="text-base text-[#6B6B6B] leading-relaxed">
              To provide affordable, industry-aligned software education, academic project guidance, and internship exposure to BCA, MCA, and degree students in Bangalore. We aim to equip every student with practical engineering capabilities required to thrive in the modern software sector.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#E8E1D2] hover:border-[#D4A72C] transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] text-[#D4A72C] flex items-center justify-center mb-6">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-[#222326] mb-3">Our Vision</h3>
            <p className="text-base text-[#6B6B6B] leading-relaxed">
              To become Karnataka's most trusted software development and technical skill development institution, recognized for excellence in project execution, corporate internship mentorship, and college placement enablement.
            </p>
          </div>
        </div>

        {/* Core Training Philosophy */}
        <div className="bg-[#17181A] rounded-2xl p-8 sm:p-12 text-white mb-20 border border-[#D4A72C]/30">
          <SectionTitle
            badge="Methodology"
            title="Our Core Training & Project Philosophy"
            subtitle="How Gnana Computech Solutions ensures every student acquires real industry confidence."
            theme="dark"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
              <div className="w-8 h-8 rounded-full bg-[#D4A72C]/20 text-[#D4A72C] font-bold flex items-center justify-center text-sm">1</div>
              <h4 className="text-lg font-bold text-white">100% Code-First Learning</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                No boring theoretical lectures. Students write real code, debug live errors, and build applications from day one.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
              <div className="w-8 h-8 rounded-full bg-[#D4A72C]/20 text-[#D4A72C] font-bold flex items-center justify-center text-sm">2</div>
              <h4 className="text-lg font-bold text-white">IEEE Standard Documentation</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                We provide complete university-compliant SRS, ER diagrams, DFDs, and system architecture for academic projects.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
              <div className="w-8 h-8 rounded-full bg-[#D4A72C]/20 text-[#D4A72C] font-bold flex items-center justify-center text-sm">3</div>
              <h4 className="text-lg font-bold text-white">Viva Voce Preparation</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Detailed 1-on-1 explanation sessions ensuring students can defend every module of their project confidently.
              </p>
            </div>
          </div>
        </div>

        {/* Partner Section Showcase */}
        <PartnerSection />

      </div>
    </div>
  );
};
