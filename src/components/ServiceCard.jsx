import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Code, Briefcase, Laptop, UserCheck, Users, ArrowRight, BookCheck } from 'lucide-react';

const iconMap = {
  GraduationCap,
  Code,
  Briefcase,
  Laptop,
  UserCheck,
  Users,
  BookCheck
};

export const ServiceCard = ({ service }) => {
  const IconComponent = iconMap[service.iconName] || Code;

  return (
    <div className="group bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E1D2] hover:border-[#D4A72C] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Top accent glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4A72C] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Icon */}
        <div className="w-14 h-14 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] group-hover:bg-[#D4A72C] group-hover:border-[#D4A72C] text-[#D4A72C] group-hover:text-[#17181A] flex items-center justify-center transition-all duration-300 mb-6 shadow-sm">
          <IconComponent className="w-7 h-7 stroke-[1.75]" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[#222326] group-hover:text-[#B88918] transition-colors mb-3">
          {service.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
          {service.shortDesc}
        </p>
      </div>

      {/* Action Link */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <Link
          to={`/services/${service.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#222326] group-hover:text-[#D4A72C] transition-colors"
        >
          <span>Learn More</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
