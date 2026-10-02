import React, { useState, useEffect } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { EventCard } from '../components/EventCard';
import { fetchEvents } from '../lib/publicContent';

export const Events = () => {
  const [filter, setFilter] = useState('all'); // all, upcoming, previous
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchEvents()
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch(() => { if (!cancelled) setError('Could not load events right now.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter((e) => e.status === filter);

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <SectionTitle
          badge="GCS Event Horizon"
          title="Workshops, Seminars & Tech Bootcamps"
          subtitle="Explore coming soon live events, college project orientation sessions, and past hackathons organized by Gnana Computech Solutions."
        />

        {loading ? (
          <p className="text-center text-[#6B6B6B] py-16">Loading events…</p>
        ) : error ? (
          <p className="text-center text-red-600 py-16">{error}</p>
        ) : (
          <>
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
                All Events ({events.length})
              </button>

              <button
                onClick={() => setFilter('upcoming')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === 'upcoming'
                    ? 'bg-[#D4A72C] text-[#17181A] shadow-md scale-105'
                    : 'bg-white text-[#252525] border border-[#E8E1D2]'
                }`}
              >
                Coming Soon Events ({events.filter(e => e.status === 'upcoming').length})
              </button>

              <button
                onClick={() => setFilter('previous')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === 'previous'
                    ? 'bg-[#D4A72C] text-[#17181A] shadow-md scale-105'
                    : 'bg-white text-[#252525] border border-[#E8E1D2]'
                }`}
              >
                Previous Events ({events.filter(e => e.status === 'previous').length})
              </button>
            </div>

            {filteredEvents.length === 0 ? (
              <p className="text-center text-[#6B6B6B] py-16">No events in this category yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
