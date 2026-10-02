import React, { useState, useEffect } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { ServiceCard } from '../components/ServiceCard';
import { fetchServices } from '../lib/publicContent';
import { Button } from '../components/Button';
import { PhoneCall } from 'lucide-react';

export const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchServices()
      .then((data) => { if (!cancelled) setServices(data); })
      .catch(() => { if (!cancelled) setError('Could not load services right now.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <SectionTitle
          badge="Solutions & Services"
          title="Gnana Computech Solutions Offerings"
          subtitle="Explore our comprehensive range of software development, academic project mentorship, IT training, and corporate internship solutions in Sunkadakatte, Bangalore."
        />

        {loading ? (
          <p className="text-center text-[#6B6B6B] py-16">Loading services…</p>
        ) : error ? (
          <p className="text-center text-red-600 py-16">{error}</p>
        ) : services.length === 0 ? (
          <p className="text-center text-[#6B6B6B] py-16">No services published yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        {/* Customized Service Enquiry */}
        <div className="bg-[#17181A] rounded-2xl p-8 sm:p-12 text-white border border-[#D4A72C]/40 text-center max-w-4xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Need a Customized Software or College Training Solution?
          </h3>
          <p className="text-gray-300 text-sm sm:text-base mb-6 max-w-2xl mx-auto">
            Whether you are a degree student looking for project guidance or an institution seeking student technology workshops, GCS delivers tailored solutions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button to="/register" variant="primary" size="lg">
              Submit Project Requirement
            </Button>
            <Button to="/contact" variant="charcoal" size="lg" icon={PhoneCall}>
              Contact GCS Office
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
