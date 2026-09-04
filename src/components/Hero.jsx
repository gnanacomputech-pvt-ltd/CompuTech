import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, GraduationCap, Calendar, ShieldCheck, Code, BookOpen, Briefcase, Award, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { Link } from 'react-router-dom';

export const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
      title: 'Hands-on Software Workshop',
      subtitle: 'Students building full-stack live projects'
    },
    {
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
      title: 'BCA & MCA Project Mentorship',
      subtitle: '1-on-1 code walkthrough & viva defense prep'
    },
    {
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
      title: 'Campus Hackathons & Seminars',
      subtitle: 'Collaborations with premier degree institutions'
    },
    {
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      title: 'Verified Corporate IT Internships',
      subtitle: 'Real enterprise module development in Bangalore'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  return (
    <section className="relative py-12 lg:py-20 bg-gradient-to-b from-[#fbfbfd] to-[#f7f9ff] overflow-hidden border-b border-gray-200">
      
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#ffcc00]/10 blur-3xl rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#0f766e]/10 blur-3xl rounded-full pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT: Card Hero (Mevi Style) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-7 sm:p-10 lg:p-12 shadow-xl border border-gray-100 relative">
              
              {/* Top Accreditation Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#01083f]/5 border border-[#01083f]/15 text-xs font-extrabold text-[#01083f] mb-5">
                <ShieldCheck className="w-4 h-4 text-[#0f766e]" />
                <span>ISO 9001:2015 Certified Software & Skill Institute</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#01083f] tracking-tight leading-tight sm:leading-[1.2] mb-4">
                Learning Made Simple — <br className="hidden sm:inline" />
                <span className="text-[#B88918] bg-clip-text text-transparent bg-gradient-to-r from-[#D4A72C] via-[#B88918] to-[#D4A72C]">
                  Skills Made Powerful
                </span>
              </h1>

              {/* Lead Paragraph */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
                Industry-focused, hands-on workshops, internships, and degree academic project guidance in Python, AI/ML, Full Stack, React, and Cloud. We emphasize projects, live deployment demos, and real outcomes.
              </p>

              {/* Dual Action Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/services"
                  className="px-6 py-3.5 rounded-xl bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#0f766e]/25 hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>Our Trainings</span>
                </Link>

                <Link
                  to="/events"
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-[#01083f] border-2 border-gray-300 hover:border-[#01083f] font-bold text-sm sm:text-base transition-all flex items-center gap-2 active:scale-95"
                >
                  <Calendar className="w-5 h-5 text-[#0f766e]" />
                  <span>Events & Workshops</span>
                </Link>
              </div>

            </div>
          </div>

          {/* RIGHT: Hero Image Carousel Slider */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-[4/3] sm:aspect-[16/11] group">
              
              {/* Slides */}
              {heroSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#01083f]/90 via-[#01083f]/30 to-transparent" />
                  
                  {/* Caption */}
                  <div className="absolute bottom-5 left-5 right-5 text-white z-20">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#ffcc00] text-[#01083f] mb-1.5 inline-block">
                      Live Campus & Training
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold leading-tight">{slide.title}</h3>
                    <p className="text-xs text-gray-300 mt-1">{slide.subtitle}</p>
                  </div>
                </div>
              ))}

              {/* Prev / Next Controls */}
              <button
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#01083f]/60 hover:bg-[#01083f] text-white flex items-center justify-center z-30 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#01083f]/60 hover:bg-[#01083f] text-white flex items-center justify-center z-30 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Indicator Dots */}
              <div className="absolute top-4 right-4 z-30 flex gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-xs">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentSlide === i ? 'w-5 bg-[#ffcc00]' : 'w-2 bg-white/50'
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
