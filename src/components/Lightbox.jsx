import React from 'react';
import { X, Calendar, Tag } from 'lucide-react';

export const Lightbox = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-opacity">
      
      {/* Background click listener */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-[#17181A] border border-[#D4A72C]/40 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 text-white hover:text-[#D4A72C] transition-colors focus:outline-none"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image Display */}
        <div className="md:w-2/3 bg-black flex items-center justify-center p-2 min-h-[300px]">
          <img
            src={item.image}
            alt={item.title}
            className="max-h-[70vh] w-auto object-contain rounded-lg"
          />
        </div>

        {/* Info Sidebar */}
        <div className="md:w-1/3 p-6 flex flex-col justify-between text-white border-t md:border-t-0 md:border-l border-gray-800">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4A72C] text-[#17181A] flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {item.category}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#D4A72C]" />
                {item.date}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{item.description}</p>
          </div>

          <div className="pt-6 border-t border-gray-800 mt-6 flex items-center justify-between text-xs text-gray-400">
            <span>Gnana Computech Solutions</span>
            <button
              onClick={onClose}
              className="text-[#D4A72C] font-bold hover:underline focus:outline-none"
            >
              Close Viewer
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
