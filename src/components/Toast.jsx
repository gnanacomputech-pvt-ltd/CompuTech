import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl bg-[#17181A] text-white border-2 border-[#D4A72C] shadow-2xl animate-bounce-short">
      <CheckCircle2 className="w-6 h-6 text-[#D4A72C] flex-shrink-0" />
      <div>
        <h4 className="text-sm font-bold text-white">Action Successful</h4>
        <p className="text-xs text-gray-300">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 p-1 text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
