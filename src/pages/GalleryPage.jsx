import React, { useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { Lightbox } from '../components/Lightbox';
import { galleryData } from '../data/galleryData';
import { ZoomIn, Tag } from 'lucide-react';

export const GalleryPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeItem, setActiveItem] = useState(null);

  const categories = ['All', 'Workshops', 'Training', 'Events', 'Internships', 'Student Activities', 'Seminars'];

  const filteredItems = activeCategory === 'All' 
    ? galleryData 
    : galleryData.filter((g) => g.category === activeCategory);

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionTitle
          badge="Campus & Training Life"
          title="Gnana Computech Activity Gallery"
          subtitle="A visual showcase of our technical workshops, student training batches, college hackathons, and internship project sessions."
        />

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-[#D4A72C] text-[#17181A] shadow-md scale-105'
                  : 'bg-white text-[#252525] border border-[#E8E1D2] hover:border-[#D4A72C]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Responsive Image Grid with Hover Effect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveItem(item)}
              className="group relative bg-[#17181A] rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-[#E8E1D2] hover:border-[#D4A72C] aspect-4/3"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between text-white">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4A72C] text-[#17181A]">
                    {item.category}
                  </span>
                  <ZoomIn className="w-5 h-5 text-[#D4A72C]" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
                  <p className="text-[11px] text-gray-300">{item.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal Trigger */}
        <Lightbox item={activeItem} onClose={() => setActiveItem(null)} />

      </div>
    </div>
  );
};
