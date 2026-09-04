import React from 'react';
import { X, Play } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title = 'Video Showcase', videoUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-[#17181A] border border-[#D4A72C] rounded-2xl max-w-3xl w-full p-6 text-white shadow-2xl z-10">
        
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <Play className="w-5 h-5 text-[#D4A72C]" />
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Player Box / Placeholder */}
        <div className="relative aspect-video rounded-xl bg-black overflow-hidden flex flex-col items-center justify-center border border-gray-800">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-[#D4A72C]/20 border border-[#D4A72C] text-[#D4A72C] flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 ml-1" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Gnana Computech Overview Video</h4>
              <p className="text-sm text-gray-300 max-w-md mx-auto mb-4">
                Experience our hands-on tech training classrooms, live student project demos, and corporate internship center in Sunkadakatte, Bangalore.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg bg-[#D4A72C] text-[#17181A] font-bold text-sm hover:bg-[#B88918] transition-colors"
              >
                Close Preview
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
