import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, ArrowLeft, Users, CheckCircle2 } from 'lucide-react';
import { eventsData } from '../data/eventsData';
import { Button } from '../components/Button';

export const EventDetails = () => {
  const { id } = useParams();
  const event = eventsData.find((e) => e.id === id);

  if (!event) {
    return <Navigate to="/events" replace />;
  }

  const isUpcoming = event.status === 'upcoming';

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#6B6B6B] hover:text-[#D4A72C] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Link>

        {/* Hero Card */}
        <div className="bg-[#17181A] rounded-3xl overflow-hidden border border-[#D4A72C]/40 mb-10 shadow-xl">
          <div className="relative h-64 sm:h-80 bg-gray-900">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17181A] via-transparent to-transparent" />
            
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4A72C] text-[#17181A]">
                {event.status.toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white">
                {event.category}
              </span>
            </div>
          </div>

          <div className="p-8 sm:p-10 text-white space-y-4">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{event.title}</h1>
            
            <div className="flex flex-wrap gap-6 text-sm text-gray-300">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D4A72C]" />
                {event.date}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4A72C]" />
                {event.time}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D4A72C]" />
                {event.location}
              </span>
            </div>

            <p className="text-gray-300 text-base leading-relaxed pt-2">
              {event.fullDesc}
            </p>

            {isUpcoming && (
              <div className="pt-4 flex items-center justify-between border-t border-gray-800">
                <span className="text-xs text-[#D4A72C] font-semibold">{event.seatsAvailable}</span>
                <Button to="/register" variant="primary" size="lg">
                  Register Now for Event
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Agenda / Details */}
        {event.agenda && (
          <div className="bg-white rounded-2xl p-8 border border-[#E8E1D2] shadow-sm mb-10">
            <h2 className="text-2xl font-bold text-[#222326] mb-6">Event Schedule & Agenda</h2>
            <div className="space-y-3">
              {event.agenda.map((slot, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                  <span className="text-sm font-semibold text-[#252525]">{slot}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
