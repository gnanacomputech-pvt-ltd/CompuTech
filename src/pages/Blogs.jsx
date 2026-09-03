import React from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { BlogCard } from '../components/BlogCard';
import { blogsData } from '../data/blogsData';

export const Blogs = () => {
  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionTitle
          badge="Tech Insights & Guidance"
          title="Gnana Computech Technical Articles"
          subtitle="Read expert advice on choosing BCA final year project topics, IT career preparation, and modern programming skills."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {blogsData.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>

      </div>
    </div>
  );
};
