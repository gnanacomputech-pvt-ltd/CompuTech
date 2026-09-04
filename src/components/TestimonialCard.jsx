import React from 'react';
import { Star, Quote } from 'lucide-react';

export const TestimonialCard = ({ testimonial }) => {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E1D2] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full relative group">
      
      <Quote className="w-10 h-10 text-[#D4A72C]/20 absolute top-6 right-6 group-hover:text-[#D4A72C]/40 transition-colors" />

      <div>
        {/* Rating Stars */}
        <div className="flex items-center space-x-1 mb-4">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-[#D4A72C] text-[#D4A72C]" />
          ))}
        </div>

        {/* Testimonial Text */}
        <p className="text-sm sm:text-base text-[#252525] italic leading-relaxed mb-6">
          "{testimonial.testimonial}"
        </p>
      </div>

      {/* Author info */}
      <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-[#D4A72C]"
        />
        <div>
          <h4 className="text-base font-bold text-[#222326]">{testimonial.name}</h4>
          <p className="text-xs text-[#B88918] font-semibold">{testimonial.role}</p>
          <p className="text-[11px] text-[#6B6B6B]">{testimonial.college}</p>
        </div>
      </div>

    </div>
  );
};
