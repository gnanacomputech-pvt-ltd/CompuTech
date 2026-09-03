import React, { useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { TestimonialCard } from '../components/TestimonialCard';
import { testimonialsData } from '../data/testimonialsData';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '../components/Button';

export const TestimonialsPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonialsData.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);
  };

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionTitle
          badge="Learner Experiences"
          title="Student & Institution Testimonials"
          subtitle="Read honest reviews from BCA, MCA, and Engineering students trained at Gnana Computech Solutions in Sunkadakatte, Bangalore."
        />

        {/* Featured Testimonial Spotlight Carousel */}
        <div className="bg-[#17181A] rounded-3xl p-8 sm:p-12 text-white border border-[#D4A72C]/40 mb-16 shadow-2xl relative">
          <Quote className="w-16 h-16 text-[#D4A72C]/20 absolute top-8 right-8" />
          
          <div className="max-w-3xl space-y-6">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#D4A72C] text-[#17181A] uppercase tracking-wider">
              Spotlight Feedback
            </span>
            <p className="text-xl sm:text-2xl font-medium text-gray-100 italic leading-relaxed">
              "{testimonialsData[currentIndex].testimonial}"
            </p>
            
            <div className="flex items-center space-x-4 pt-4 border-t border-gray-800">
              <img
                src={testimonialsData[currentIndex].avatar}
                alt={testimonialsData[currentIndex].name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#D4A72C]"
              />
              <div>
                <h4 className="text-lg font-bold text-white">{testimonialsData[currentIndex].name}</h4>
                <p className="text-xs text-[#D4A72C] font-semibold">{testimonialsData[currentIndex].role}</p>
                <p className="text-xs text-gray-400">{testimonialsData[currentIndex].college}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3 mt-8">
            <button
              onClick={prevTestimonial}
              className="p-3 rounded-full bg-gray-800 border border-gray-700 hover:bg-[#D4A72C] hover:text-[#17181A] text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextTestimonial}
              className="p-3 rounded-full bg-gray-800 border border-gray-700 hover:bg-[#D4A72C] hover:text-[#17181A] text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Full Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonialsData.map((item) => (
            <TestimonialCard key={item.id} testimonial={item} />
          ))}
        </div>

        <div className="text-center bg-white p-8 rounded-2xl border border-[#E8E1D2] max-w-2xl mx-auto space-y-4">
          <h3 className="text-xl font-bold text-[#222326]">Are You a GCS Graduate or Partner?</h3>
          <p className="text-sm text-[#6B6B6B]">Share your training experience with future students.</p>
          <Button to="/contact" variant="primary" size="md">
            Submit Your Feedback
          </Button>
        </div>

      </div>
    </div>
  );
};
