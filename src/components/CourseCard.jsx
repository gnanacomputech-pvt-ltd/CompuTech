import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from './Button';

export const CourseCard = ({ course }) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E1D2] hover:border-[#D4A72C] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      
      <div className="p-6 sm:p-7">
        {/* Category & Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4A72C]/10 text-[#B88918] border border-[#D4A72C]/20">
            {course.category}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-[#6B6B6B]">
            <Clock className="w-3.5 h-3.5 text-[#D4A72C]" />
            {course.duration}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[#222326] group-hover:text-[#B88918] transition-colors mb-3">
          {course.title}
        </h3>

        {/* Short Description */}
        <p className="text-sm text-[#6B6B6B] leading-relaxed mb-5">
          {course.shortDesc}
        </p>

        {/* Key Topics List */}
        <div className="space-y-2 mb-6 bg-[#FAFAF7] p-3.5 rounded-xl border border-[#E8E1D2]/60">
          <p className="text-xs font-bold uppercase tracking-wider text-[#222326]">Key Topics Covered:</p>
          <ul className="space-y-1.5 text-xs text-[#252525]">
            {course.topics.slice(0, 3).map((topic, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4A72C] flex-shrink-0 mt-0.5" />
                <span className="line-clamp-1">{topic}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Card Footer with Working Buttons */}
      <div className="p-6 pt-0 bg-white border-t border-gray-100 flex items-center justify-between gap-3">
        <Link
          to={`/courses/${course.id}`}
          className="text-xs font-bold text-[#222326] hover:text-[#D4A72C] flex items-center gap-1 transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <Button to="/register" variant="primary" size="sm">
          Register Now
        </Button>
      </div>

    </div>
  );
};
