import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from './Button';

export const EventCard = ({ event }) => {
  const isUpcoming = event.status === 'upcoming';

  return (
    <div className="bg-white rounded-2xl border border-[#E8E1D2] hover:border-[#D4A72C] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
      
      {/* Event Image Banner */}
      <div className="relative h-48 overflow-hidden bg-gray-900">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isUpcoming 
              ? 'bg-[#D4A72C] text-[#17181A]' 
              : 'bg-gray-800 text-gray-300 border border-gray-700'
          }`}>
            {event.status}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white border border-white/20">
            {event.category}
          </span>
        </div>

        {/* Date overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="flex items-center gap-1 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-[#D4A72C]" />
            {event.date}
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#D4A72C]" />
            {event.time.split(' ')[0]} {event.time.split(' ')[1]}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#222326] group-hover:text-[#B88918] transition-colors mb-3 line-clamp-2">
            {event.title}
          </h3>

          <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed mb-4 line-clamp-3">
            {event.shortDesc}
          </p>

          <div className="flex items-start gap-1.5 text-xs text-gray-600 bg-[#FAFAF7] p-2.5 rounded-lg border border-[#E8E1D2]/60 mb-5">
            <MapPin className="w-4 h-4 text-[#D4A72C] flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        {/* Action Buttons (Mevi Style Equal Width) */}
        <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
          <Link
            to={`/events/${event.id}`}
            className="flex-1 text-center py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#01083f] font-bold text-xs border border-indigo-200 transition-colors"
          >
            View Details
          </Link>

          {isUpcoming ? (
            <Link
              to="/register"
              className="flex-1 text-center py-2 px-3 rounded-lg bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-xs shadow-md transition-colors"
            >
              Register
            </Link>
          ) : (
            <span className="flex-1 text-center py-2 px-3 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Completed
            </span>
          )}
        </div>

      </div>

    </div>
  );
};
