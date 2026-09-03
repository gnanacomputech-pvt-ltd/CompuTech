import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';

export const BlogCard = ({ blog }) => {
  return (
    <article className="bg-white rounded-2xl border border-[#E8E1D2] hover:border-[#D4A72C] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
      
      {/* Blog Image Header */}
      <div className="relative h-48 overflow-hidden bg-gray-900">
        <img 
          src={blog.image} 
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-[#D4A72C] text-[#17181A]">
          {blog.category}
        </span>
      </div>

      {/* Content Body */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata */}
          <div className="flex items-center space-x-4 text-xs text-[#6B6B6B] mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#D4A72C]" />
              {blog.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#D4A72C]" />
              {blog.readTime}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-[#222326] group-hover:text-[#B88918] transition-colors mb-3 line-clamp-2">
            {blog.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed mb-4 line-clamp-3">
            {blog.shortDesc}
          </p>
        </div>

        {/* Action Link */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="w-3.5 h-3.5 text-[#D4A72C]" />
            {blog.author.split(' ')[0]}
          </span>

          <Link
            to={`/blogs/${blog.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#222326] group-hover:text-[#D4A72C] transition-colors"
          >
            <span>Read Article</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>

    </article>
  );
};
