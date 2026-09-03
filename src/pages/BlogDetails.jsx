import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft, Tag } from 'lucide-react';
import { blogsData } from '../data/blogsData';
import { Button } from '../components/Button';

export const BlogDetails = () => {
  const { id } = useParams();
  const blog = blogsData.find((b) => b.id === id);

  if (!blog) {
    return <Navigate to="/blogs" replace />;
  }

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link
          to="/blogs"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#6B6B6B] hover:text-[#D4A72C] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </Link>

        {/* Blog Post Banner */}
        <div className="bg-[#17181A] rounded-3xl overflow-hidden border border-[#D4A72C]/40 mb-10 shadow-xl">
          <div className="relative h-64 sm:h-96 bg-gray-900">
            <img src={blog.image} alt={blog.title} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17181A] via-transparent to-transparent" />
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-[#D4A72C] text-[#17181A]">
              {blog.category}
            </span>
          </div>

          <div className="p-8 text-white space-y-4">
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#D4A72C]" />
                {blog.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#D4A72C]" />
                {blog.readTime}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#D4A72C]" />
                {blog.author}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">{blog.title}</h1>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-[#E8E1D2] shadow-sm text-[#252525] space-y-6 leading-relaxed mb-12">
          {blog.content.split('\n\n').map((paragraph, idx) => {
            if (paragraph.trim().startsWith('###')) {
              return (
                <h3 key={idx} className="text-xl font-bold text-[#222326] pt-4 border-b border-gray-100 pb-2">
                  {paragraph.replace('###', '').trim()}
                </h3>
              );
            }
            return (
              <p key={idx} className="text-base text-[#252525]">
                {paragraph.trim()}
              </p>
            );
          })}
        </div>

        {/* Share & CTA */}
        <div className="bg-[#17181A] rounded-2xl p-8 text-white border border-[#D4A72C]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold">Have Questions About Academic Projects?</h3>
            <p className="text-xs text-gray-300 mt-1">Our GCS team in Sunkadakatte provides instant project synopsis & topic guidance.</p>
          </div>
          <Button to="/register" variant="primary" size="md">
            Consult Project Mentor
          </Button>
        </div>

      </div>
    </div>
  );
};
