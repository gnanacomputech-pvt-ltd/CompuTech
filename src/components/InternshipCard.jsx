import React from 'react';
import { Briefcase, MapPin, Calendar, CheckCircle2, Award } from 'lucide-react';
import { Button } from './Button';

export const InternshipCard = ({ internship }) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E1D2] hover:border-[#D4A72C] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
      
      <div>
        {/* Domain & Stipend */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#17181A] text-[#D4A72C]">
            {internship.domain}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Award className="w-3.5 h-3.5" />
            {internship.stipend}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[#222326] group-hover:text-[#B88918] transition-colors mb-3">
          {internship.title}
        </h3>

        {/* Meta details */}
        <div className="flex flex-wrap gap-4 text-xs text-[#6B6B6B] mb-4 border-b border-gray-100 pb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#D4A72C]" />
            {internship.duration}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#D4A72C]" />
            {internship.mode}
          </span>
        </div>

        {/* Short Description */}
        <p className="text-sm text-[#6B6B6B] leading-relaxed mb-5">
          {internship.shortDesc}
        </p>

        {/* Tech Skills Chips */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#222326] mb-2">Core Tech Stack:</p>
          <div className="flex flex-wrap gap-1.5">
            {internship.skills.map((skill, idx) => (
              <span key={idx} className="px-2.5 py-0.5 rounded-md bg-[#FAFAF7] border border-[#E8E1D2] text-[11px] font-semibold text-[#252525]">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Project Learnings */}
        <div className="space-y-1.5 mb-6">
          {internship.learnings.slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-[#252525]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4A72C] flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Button */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          Eligibility: <strong className="text-[#222326]">{internship.eligibility.split(' ')[0]}+</strong>
        </span>
        <Button to="/register" variant="primary" size="sm">
          Apply For Internship
        </Button>
      </div>

    </div>
  );
};
