import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Clock, BookOpen, CheckCircle2, ArrowLeft, Award, ShieldCheck, UserCheck } from 'lucide-react';
import { coursesData } from '../data/coursesData';
import { Button } from '../components/Button';

export const CourseDetails = () => {
  const { id } = useParams();
  const course = coursesData.find((c) => c.id === id);

  if (!course) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#6B6B6B] hover:text-[#D4A72C] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Courses</span>
        </Link>

        {/* Hero Card */}
        <div className="bg-[#17181A] rounded-3xl p-8 sm:p-10 text-white border border-[#D4A72C]/40 mb-10 shadow-xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4A72C] text-[#17181A]">
              {course.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 text-gray-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#D4A72C]" />
              {course.duration}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 text-gray-300">
              Mode: {course.mode}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">{course.title}</h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
            {course.fullDesc}
          </p>

          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-800">
            <Button to="/register" variant="primary" size="lg">
              Register for this Program
            </Button>
            <Button to="/contact" variant="charcoal" size="lg">
              Enquire Details
            </Button>
          </div>
        </div>

        {/* Curriculum Topics */}
        <div className="bg-white rounded-2xl p-8 border border-[#E8E1D2] shadow-sm mb-10">
          <h2 className="text-2xl font-bold text-[#222326] mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#D4A72C]" /> Detailed Curriculum & Syllabus
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.topics.map((topic, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-[#D4A72C] flex-shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-[#252525]">{topic}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights & Certification */}
        <div className="bg-white rounded-2xl p-8 border border-[#E8E1D2] shadow-sm mb-10">
          <h3 className="text-xl font-bold text-[#222326] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D4A72C]" /> Program Benefits & Certification
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {course.highlights.map((h, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#17181A] text-white text-center border border-[#D4A72C]/30">
                <ShieldCheck className="w-6 h-6 text-[#D4A72C] mx-auto mb-2" />
                <span className="text-xs font-bold">{h}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
