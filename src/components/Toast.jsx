import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// The `type` prop used to be accepted and then ignored, so a failed request
// rendered a green tick above the words "Action Successful" with the error
// message underneath it.
const VARIANTS = {
  success: {
    icon: CheckCircle2,
    title: 'Action Successful',
    border: 'border-[#D4A72C]',
    iconColor: 'text-[#D4A72C]',
  },
  error: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    border: 'border-[#DC2626]',
    iconColor: 'text-[#F87171]',
  },
  info: {
    icon: Info,
    title: 'Heads up',
    border: 'border-[#60A5FA]',
    iconColor: 'text-[#60A5FA]',
  },
};

export const Toast = ({ message, type = 'success', title, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const variant = VARIANTS[type] || VARIANTS.success;
  const Icon = variant.icon;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl bg-[#17181A] text-white border-2 ${variant.border} shadow-2xl animate-bounce-short`}
    >
      <Icon className={`w-6 h-6 ${variant.iconColor} flex-shrink-0`} />
      <div>
        <h4 className="text-sm font-bold text-white">{title || variant.title}</h4>
        <p className="text-xs text-gray-300">{message}</p>
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="ml-4 p-1 text-gray-400 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
