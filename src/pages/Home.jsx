import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, CheckCircle2, Shield, PhoneCall, Calendar, Sparkles } from 'lucide-react';
import { Hero } from '../components/Hero';
import { PartnerSection } from '../components/PartnerSection';
import { AboutFeatures } from '../components/AboutFeatures';
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
      
      {/* 1. Hero Section (Mevi Style Card + Carousel) */}
      <Hero />

      {/* 2. Trusted by Colleges (Infinite Logo Marquee) & Certifications */}
      <PartnerSection />

      {/* 3. About GCS (6-Pillar Interactive Grid) */}
      <AboutFeatures />

      {/* 4. Live Impact Stats */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-200">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#01083f]">Our Impact in Numbers</h2>
            <p className="text-sm text-gray-500 mt-1">Transforming students into industry-ready software developers</p>
          </div>
          <StatsCard />
        </div>
      </section>

      {/* 5. Upcoming Events (Open for Registration) */}
      <section className="py-16 sm:py-20 bg-[#fbfbfd] border-b border-gray-200">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-[#ffcc00]/20 text-[#01083f] mb-3 inline-block">
              📅 Open for Registration
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#01083f]">
              Upcoming Events & Workshops
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Register now for our upcoming hands-on bootcamps, technical seminars, and college project guidance sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {eventsData.slice(0, 2).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link 
              to="/events" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-gray-50 text-[#01083f] border-2 border-gray-300 font-bold text-sm shadow-sm transition-all"
            >
              <span>View All Events & Workshops</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Services & Solutions */}
      <section className="py-20 bg-white border-b border-gray-200">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <SectionTitle
            badge="Solutions & Offerings"
            title="Comprehensive Technology Services"
            subtitle="Gnana Computech Solutions offers end-to-end software development, degree academic project guidance, and corporate skill training."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesData.map((service) => (
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

      {/* 7. Courses & Programs */}
      <section className="py-20 bg-[#fbfbfd] border-b border-gray-200">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
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

      {/* 8. Internships Highlight */}
      <section className="py-20 bg-gradient-to-r from-[#01083f] via-[#021055] to-[#0f766e] text-white">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <SectionTitle
            badge="Corporate Internships"
            title="Gain Real Software Industry Experience"
            subtitle="Work on live client applications, get mentored by senior engineers, and receive verifiable internship completion certificates."
            theme="dark"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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

      {/* 9. Testimonials Carousel */}
      <section className="py-20 bg-white border-b border-gray-200">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0f766e]/10 text-[#0f766e] mb-3">
                Student & Partner Stories
              </span>
              <h2 className="text-3xl font-extrabold text-[#01083f]">What Our Learners Say</h2>
            </div>

            {/* Prev / Next Carousel Controls */}
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <button
                onClick={prevTestimonial}
                className="p-3 rounded-full bg-[#fbfbfd] border border-gray-200 hover:bg-[#0f766e] hover:border-[#0f766e] text-[#01083f] hover:text-white transition-colors focus:outline-none cursor-pointer"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextTestimonial}
                className="p-3 rounded-full bg-[#fbfbfd] border border-gray-200 hover:bg-[#0f766e] hover:border-[#0f766e] text-[#01083f] hover:text-white transition-colors focus:outline-none cursor-pointer"
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
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentTestimonial === idx ? 'bg-[#0f766e] w-6' : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* 10. Contact Banner CTA */}
      <section className="py-16 bg-gradient-to-r from-[#01083f] to-[#021055] text-white border-t border-[#ffcc00]/40">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#ffcc00] text-[#01083f] uppercase tracking-wider">
            Ready to Accelerate Your Career?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Visit Our Center in Sunkadakatte, Bangalore
          </h2>
          <p className="text-[#b7c0e6] text-base max-w-2xl mx-auto">
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

