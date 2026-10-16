import React, { useEffect, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { BlogCard } from '../components/BlogCard';
import { fetchBlogs } from '../lib/publicContent';
import { ApiError } from '../lib/api/client';

export const Blogs = () => {
  // Live from the blog section of the site CMS (apps/website SiteContent),
  // so posts written in the staff dashboard appear here.
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchBlogs()
      .then((items) => { if (!cancelled) setBlogs(items); })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError && typeof err.message === 'string'
          ? err.message : 'Could not load articles right now.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <SectionTitle
          badge="Tech Insights & Guidance"
          title="Gnana Computech Technical Articles"
          subtitle="Read expert advice on choosing BCA final year project topics, IT career preparation, and modern programming skills."
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-80 rounded-2xl bg-[#E8E1D2]/60 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-16">{error}</p>
        ) : blogs.length === 0 ? (
          <p className="text-sm text-[#6B6B6B] bg-white border border-[#E8E1D2] rounded-2xl p-10 text-center mb-16">
            No articles have been published yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
