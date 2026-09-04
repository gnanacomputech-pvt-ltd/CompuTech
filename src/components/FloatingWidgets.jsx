import React, { useState, useEffect } from 'react';
import { MessageSquare, MessageCircle, X, Sparkles, Calendar, BookOpen, GraduationCap, PhoneCall, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FloatingWidgets = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Show update notification once after 3 seconds
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem('gcsUpdateSeen')) {
        setIsUpdateOpen(true);
        sessionStorage.setItem('gcsUpdateSeen', 'true');
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const openChat = () => {
    setIsChatOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          sender: 'bot',
          text: '👋 Hello! Welcome to <strong>Gnana Computech Solutions</strong>.<br/>How can we assist you today?'
        }
      ]);
    }
  };

  const handleAction = (action) => {
    if (action === 'events') {
      navigate('/events');
      setIsChatOpen(false);
    } else if (action === 'projects') {
      navigate('/register');
      setIsChatOpen(false);
    } else if (action === 'trainings') {
      navigate('/courses');
      setIsChatOpen(false);
    } else if (action === 'whatsapp') {
      window.open('https://wa.me/919876543210?text=Hi%20GCS%2C%20I%20would%20like%20to%20know%20more%20about%20your%20trainings%20and%20academic%20projects.', '_blank');
    }
  };

  return (
    <>
      {/* 1. Floating Site Update Badge */}
      <button
        onClick={() => setIsUpdateOpen(!isUpdateOpen)}
        className="fixed bottom-36 right-4 sm:right-6 w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#ffcc00] text-[#01083f] flex items-center justify-center text-xl shadow-2xl z-40 transition-transform hover:scale-110 cursor-pointer animate-pulse"
        title="Important Update"
        aria-label="Important Announcement"
      >
        <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
      </button>

      {/* Update Popup Modal */}
      {isUpdateOpen && (
        <div className="fixed bottom-36 right-4 sm:right-20 w-80 bg-white rounded-2xl p-5 shadow-2xl border border-gray-200 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <span className="text-xs uppercase font-extrabold text-[#01083f] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4A72C]" /> GCS Admissions Notice
            </span>
            <button 
              onClick={() => setIsUpdateOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            🎓 <strong>New Batches Open:</strong> Final Year BCA/MCA IEEE Projects, Python Full Stack & React Live Internships in Sunkadakatte, Bangalore.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { setIsUpdateOpen(false); navigate('/register'); }}
              className="w-full py-1.5 px-3 bg-[#01083f] text-[#ffcc00] text-xs font-bold rounded-lg hover:bg-[#0f766e] transition-colors"
            >
              Apply Online
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating AI/Assistant Chatbot Toggle */}
      <div className="fixed bottom-20 right-4 sm:right-6 z-40 group">
        <button
          onClick={() => (isChatOpen ? setIsChatOpen(false) : openChat())}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#4338ca] to-[#0f766e] text-white flex items-center justify-center text-2xl shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer"
          aria-label="Open GCS Assistant"
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
        <span className="hidden group-hover:block absolute right-16 top-3 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg">
          Ask GCS Assistant
        </span>
      </div>

      {/* Chatbot Window */}
      {isChatOpen && (
        <div className="fixed bottom-36 right-4 sm:right-6 w-[90vw] sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#01083f] to-[#0f766e] text-white p-3.5 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <strong className="text-sm font-bold">🤖 GCS Smart Assistant</strong>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {messages.map((m, idx) => (
              <div 
                key={idx}
                className="bg-gray-100 text-gray-800 text-xs p-3 rounded-2xl rounded-tl-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: m.text }}
              />
            ))}

            <div className="pt-2 space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quick Actions</p>
              
              <button
                onClick={() => handleAction('projects')}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-50 text-blue-900 hover:bg-blue-100 transition-colors text-left"
              >
                <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Final Year Degree Projects</span>
              </button>

              <button
                onClick={() => handleAction('trainings')}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-teal-50 text-teal-900 hover:bg-teal-100 transition-colors text-left"
              >
                <BookOpen className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Industry Courses & Internships</span>
              </button>

              <button
                onClick={() => handleAction('events')}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-900 hover:bg-indigo-100 transition-colors text-left"
              >
                <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>Upcoming Workshops & Events</span>
              </button>

              <button
                onClick={() => handleAction('whatsapp')}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-colors text-left"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Direct WhatsApp Consultation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Floating WhatsApp Direct Chat */}
      <div className="fixed bottom-4 right-4 sm:right-6 z-40 group">
        <a
          href="https://wa.me/919876543210?text=Hi%20Gnana%20Computech%20Solutions%2C%20I%20would%20like%20to%20enquire%20about%20your%20trainings%20and%20academic%20projects."
          target="_blank"
          rel="noopener noreferrer"
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center text-3xl shadow-2xl hover:scale-105 hover:bg-[#1ebe5a] transition-all duration-200 cursor-pointer"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-7 h-7 fill-current" />
        </a>
        <span className="hidden group-hover:block absolute right-16 top-3 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg">
          Chat with us on WhatsApp
        </span>
      </div>
    </>
  );
};
