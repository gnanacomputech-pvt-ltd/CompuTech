import React, { useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { CourseCard } from '../components/CourseCard';
import { coursesData } from '../data/coursesData';
import { Button } from '../components/Button';
import { Search } from 'lucide-react';

export const Courses = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Software Engineering', 'Data Science & AI', 'Mobile Development', 'Academic Support', 'Security & Networking'];

  const filteredCourses = selectedCategory === 'All' 
    ? coursesData 
    : coursesData.filter((c) => c.category === selectedCategory);

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionTitle
          badge="Training Tracks & Programs"
          title="Industry & Academic Training Courses"
          subtitle="Skill-building courses designed specifically for BCA, MCA, B.E., B.Tech, and Diploma students in Bangalore."
        />

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#D4A72C] text-[#17181A] shadow-md scale-105'
                  : 'bg-white text-[#252525] border border-[#E8E1D2] hover:border-[#D4A72C]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        {/* Custom Course / Batch Guidance */}
        <div className="bg-[#17181A] rounded-2xl p-8 text-white border border-[#D4A72C]/40 text-center max-w-3xl mx-auto space-y-4">
          <h3 className="text-2xl font-bold text-white">Looking for Customized Batch Timings or College Fast-Track?</h3>
          <p className="text-gray-300 text-sm">
            GCS offers flexible weekend and weekday batches for degree students in Sunkadakatte.
          </p>
          <Button to="/register" variant="primary" size="lg">
            Register For Next Batch
          </Button>
        </div>

      </div>
    </div>
  );
};
