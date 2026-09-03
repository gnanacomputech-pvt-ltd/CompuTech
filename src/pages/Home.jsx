import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, CheckCircle2, Shield, PhoneCall } from 'lucide-react';
import { Hero } from '../components/Hero';
import { PartnerSection } from '../components/PartnerSection';
import { SectionTitle } from '../components/SectionTitle';
import { ServiceCard } from '../components/ServiceCard';
import { CourseCard } from '../components/CourseCard';
import { InternshipCard } from '../components/InternshipCard';
import { TestimonialCard } from '../components/TestimonialCard';
import { EventCard } from '../components/EventCard';
import { StatsCard } from '../components/StatsCard';
import { Button } from '../components/Button';
import { servicesData } from '../data/servicesData';
import { coursesData } from '../data/coursesData';
import { internshipsData } from '../data/internshipsData';
import { testimonialsData } from '../data/testimonialsData';
import { eventsData } from '../data/eventsData';

export const Home = () => {
  // Testimonial Carousel Index State
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonialsData.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);
  };

  return (
    <div className="space-y-0">
      
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Trust & Partners Section */}
      <PartnerSection />

      {/* 3. Services Section */}
      <section className="py-20 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            badge="Solutions & Offerings"
            title="Comprehensive Technology Services"
            subtitle="Gnana Computech Solutions offers end-to-end software development, degree academic project guidance, and corporate skill training."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesData.slice(0, 6).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button to="/services" variant="primary" size="lg" icon={ArrowRight}>
              Explore All Services
            </Button>
          </div>
        </div>
      </section>

      {/* 4. Why Choose GCS / Qualitative Stats */}
      <section className="py-20 bg-white border-y border-[#E8E1D2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            badge="Why Choose GCS"
            title="Empowering Student Success Through Innovation"
            subtitle="We blend industry standards with academic excellence to deliver unmatched skill acquisition and career advancement."
          />

          <StatsCard />
        </div>
      </section>

      {/* 5. Courses & Programs Section */}
      <section className="py-20 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            badge="Featured Programs"
            title="Industry-Oriented Courses"
            subtitle="Practical software engineering courses designed for BCA, MCA, and Engineering students seeking high-growth tech careers."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coursesData.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button to="/courses" variant="charcoal" size="lg" icon={ArrowRight}>
              View All Courses & Tracks
            </Button>
          </div>
        </div>
      </section>

      {/* 6. Internships Highlight */}
      <section className="py-20 bg-[#17181A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            badge="Corporate Internships"
            title="Gain Real Software Industry Experience"
            subtitle="Work on live client applications, get mentored by senior engineers, and receive verifiable internship completion certificates."
            theme="dark"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {internshipsData.slice(0, 2).map((internship) => (
              <InternshipCard key={internship.id} internship={internship} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button to="/internships" variant="primary" size="lg" icon={ArrowRight}>
              View All Internship Tracks
            </Button>
          </div>
        </div>
      </section>

      {/* 7. Testimonials Carousel */}
      <section className="py-20 bg-white border-b border-[#E8E1D2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D4A72C]/10 text-[#B88918] mb-3">
                Student & Partner Stories
              </span>
              <h2 className="text-3xl font-extrabold text-[#222326]">What Our Learners Say</h2>
            </div>

            {/* Prev / Next Carousel Controls */}
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <button
                onClick={prevTestimonial}
                className="p-3 rounded-full bg-[#FAFAF7] border border-[#E8E1D2] hover:bg-[#D4A72C] hover:border-[#D4A72C] text-[#222326] hover:text-[#17181A] transition-colors focus:outline-none"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextTestimonial}
                className="p-3 rounded-full bg-[#FAFAF7] border border-[#E8E1D2] hover:bg-[#D4A72C] hover:border-[#D4A72C] text-[#222326] hover:text-[#17181A] transition-colors focus:outline-none"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desktop 3-Card Grid or Mobile Single Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((offset) => {
              const itemIndex = (currentTestimonial + offset) % testimonialsData.length;
              return (
                <div key={itemIndex} className={`${offset > 0 ? 'hidden md:block' : 'block'}`}>
                  <TestimonialCard testimonial={testimonialsData[itemIndex]} />
                </div>
              );
            })}
          </div>

          {/* Pagination Indicators */}
          <div className="flex justify-center items-center space-x-2 mt-8">
            {testimonialsData.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentTestimonial(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentTestimonial === idx ? 'bg-[#D4A72C] w-6' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* 8. Events & Workshops */}
      <section className="py-20 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            badge="Upcoming & Past Events"
            title="Workshops & Campus Hackathons"
            subtitle="Participate in hands-on bootcamps, technical seminars, and college project guidance sessions organized by GCS."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {eventsData.slice(0, 2).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button to="/events" variant="outline" size="lg" icon={ArrowRight}>
              View All Events & Workshops
            </Button>
          </div>
        </div>
      </section>

      {/* 9. Contact Banner CTA */}
      <section className="py-16 bg-[#17181A] text-white border-t border-[#D4A72C]/40">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#D4A72C] text-[#17181A] uppercase tracking-wider">
            Ready to Accelerate Your Career?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Visit Our Center in Sunkadakatte, Bangalore
          </h2>
          <p className="text-gray-300 text-base max-w-2xl mx-auto">
            Get personalized academic project consultation, enroll in software courses, or apply for our verifiable internship programs today.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Button to="/register" variant="primary" size="lg">
              Register Now
            </Button>
            <Button to="/contact" variant="charcoal" size="lg" icon={PhoneCall}>
              Contact Us Directly
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
};
