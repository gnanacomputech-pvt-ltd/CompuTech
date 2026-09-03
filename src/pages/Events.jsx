import React, { useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { EventCard } from '../components/EventCard';
import { eventsData } from '../data/eventsData';

export const Events = () => {
  const [filter, setFilter] = useState('all'); // all, upcoming, previous

  const filteredEvents = filter === 'all' 
    ? eventsData 
    : eventsData.filter((e) => e.status === filter);

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionTitle
          badge="GCS Event Horizon"
          title="Workshops, Seminars & Tech Bootcamps"
          subtitle="Explore upcoming live events, college project orientation sessions, and past hackathons organized by Gnana Computech Solutions."
        />

        {/* Filter Buttons */}
        <div className="flex justify-center items-center space-x-3 mb-12">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#D4A72C] text-[#17181A] shadow-md scale-105'
                : 'bg-white text-[#252525] border border-[#E8E1D2]'
            }`}
          >
            All Events ({eventsData.length})
          </button>

          <button
            onClick={() => setFilter('upcoming')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'upcoming'
                ? 'bg-[#D4A72C] text-[#17181A] shadow-md scale-105'
                : 'bg-white text-[#252525] border border-[#E8E1D2]'
            }`}
          >
            Upcoming Events ({eventsData.filter(e => e.status === 'upcoming').length})
          </button>

          <button
            onClick={() => setFilter('previous')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'previous'
                ? 'bg-[#D4A72C] text-[#17181A] shadow-md scale-105'
                : 'bg-white text-[#252525] border border-[#E8E1D2]'
            }`}
          >
            Previous Events ({eventsData.filter(e => e.status === 'previous').length})
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

      </div>
    </div>
  );
};
