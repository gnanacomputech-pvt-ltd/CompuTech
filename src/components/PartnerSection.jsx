import React from 'react';
import { Building2, Award, ShieldCheck, CheckCircle } from 'lucide-react';
import { SectionTitle } from './SectionTitle';
import { partnersData, recognitionsData } from '../data/partnersData';

export const PartnerSection = () => {
  return (
    <section className="py-16 sm:py-20 bg-white border-y border-[#E8E1D2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionTitle
          badge="Academia & Industry Network"
          title="Trusted by Institutions & Learners"
          subtitle="Gnana Computech Solutions partners with degree colleges, technical institutes, and industry bodies across Bangalore and Karnataka."
        />

        {/* Partners Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {partnersData.map((partner, index) => (
            <div 
              key={index}
              className="p-5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] hover:border-[#D4A72C] transition-all duration-300 flex items-start space-x-4 shadow-xs hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-lg bg-[#17181A] text-[#D4A72C] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#B88918]">{partner.type}</span>
                <h4 className="text-base font-bold text-[#222326] mt-0.5">{partner.name}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Official Recognitions Row */}
        <div className="bg-[#17181A] rounded-2xl p-8 sm:p-10 border border-[#D4A72C]/40 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="lg:w-1/3">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#D4A72C] mb-2">
                <ShieldCheck className="w-4 h-4" /> Official Accreditation
              </span>
              <h3 className="text-2xl font-bold text-white">Government & Industry Certifications</h3>
              <p className="text-sm text-gray-300 mt-2">
                GCS operates under strict quality standards and corporate compliance in Sunkadakatte, Bangalore.
              </p>
            </div>

            <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {recognitionsData.slice(0, 4).map((rec, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 flex items-start space-x-3">
                  <Award className="w-6 h-6 text-[#D4A72C] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                    <p className="text-xs text-[#D4A72C] font-medium">{rec.subtitle}</p>
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
