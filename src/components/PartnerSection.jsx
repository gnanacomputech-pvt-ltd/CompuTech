import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, Building2, MapPin, Users, GraduationCap, Award, CheckCircle2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { partnersData, recognitionsData } from '../data/partnersData';

export const PartnerSection = () => {
  // Recognitions Carousel Slider State
  const [recIndex, setRecIndex] = useState(0);
  const [isRecPaused, setIsRecPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Dynamic responsive cards per slide
  useEffect(() => {
    const handleResize = () => {
      let count = 4;
      if (window.innerWidth < 640) {
        count = 1;
      } else if (window.innerWidth < 1024) {
        count = 2;
      } else if (window.innerWidth < 1280) {
        count = 3;
      } else {
        count = 4;
      }
      setVisibleCount(count);
      setRecIndex((prev) => Math.min(prev, Math.max(0, recognitionsData.length - count)));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalCards = recognitionsData.length;
  const maxIndex = Math.max(0, totalCards - visibleCount);

  // Slide navigation - smooth right-to-left advance
  const nextRec = useCallback(() => {
    setRecIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevRec = useCallback(() => {
    setRecIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Auto-play timer (slides right-to-left every 3.5 seconds)
  useEffect(() => {
    if (isRecPaused || maxIndex === 0) return;
    const interval = setInterval(() => {
      nextRec();
    }, 3500);
    return () => clearInterval(interval);
  }, [isRecPaused, maxIndex, nextRec]);

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextRec();
    } else if (touchStartX.current - touchEndX.current < -50) {
      prevRec();
    }
  };
  const marqueeColleges = [
    {
      name: 'Sunkadakatte First Grade Degree College',
      short: 'SFGDC',
      type: 'Academic Partner',
      location: 'Sunkadakatte, Bangalore',
      iconBg: 'bg-indigo-50 text-[#01083f] border-indigo-100',
      logoUrl: null
    },
    {
      name: 'Acharya Group of Institutions',
      short: 'Acharya',
      type: 'College Association',
      location: 'Soladevanahalli, Bangalore',
      iconBg: 'bg-amber-50 text-amber-800 border-amber-100',
      logoUrl: 'https://mevi-site-media-prod.s3.eu-north-1.amazonaws.com/colleges/logos/Acharya.jpg'
    },
    {
      name: 'Soundarya Institute of Management & Science',
      short: 'SIMS',
      type: 'Workshop Partner',
      location: 'Soundarya Layout, Bangalore',
      iconBg: 'bg-emerald-50 text-[#0f766e] border-emerald-100',
      logoUrl: null
    },
    {
      name: 'Peenya Govt. Technical Institute',
      short: 'PGTI',
      type: 'Skill Development Partner',
      location: 'Peenya Industrial Area, Bangalore',
      iconBg: 'bg-cyan-50 text-cyan-800 border-cyan-100',
      logoUrl: null
    },
    {
      name: 'Government First Grade College, Peenya',
      short: 'GFGC Peenya',
      type: 'Degree Project Partner',
      location: 'Peenya, Bangalore North',
      iconBg: 'bg-blue-50 text-blue-800 border-blue-100',
      logoUrl: null
    },
    {
      name: 'East West Institute of Technology (EWIT)',
      short: 'EWIT',
      type: 'Institutional Network',
      location: 'Magadi Main Road, Bangalore',
      iconBg: 'bg-purple-50 text-purple-800 border-purple-100',
      logoUrl: null
    },
    {
      name: 'Bangalore North Science Degree Colleges',
      short: 'BNSCN',
      type: 'Academic Association',
      location: 'Bengaluru North Network',
      iconBg: 'bg-teal-50 text-teal-800 border-teal-100',
      logoUrl: null
    },
    {
      name: 'Karnataka IT Skill Development Network',
      short: 'KITSDN',
      type: 'Training Network',
      location: 'Karnataka State Initiative',
      iconBg: 'bg-yellow-50 text-yellow-900 border-yellow-100',
      logoUrl: null
    },
    {
      name: 'Visvesvaraya Technological University',
      short: 'VTU',
      type: 'Engineering Alignment',
      location: 'Karnataka State',
      iconBg: 'bg-slate-50 text-slate-800 border-slate-100',
      logoUrl: 'https://mevi-site-media-prod.s3.eu-north-1.amazonaws.com/colleges/logos/vtu.jpeg'
    },
    {
      name: 'Dr. Ambedkar Institute of Technology',
      short: 'Dr. AIT',
      type: 'Academic Association',
      location: 'Mallathahalli, Bangalore',
      iconBg: 'bg-emerald-50 text-emerald-800 border-emerald-100',
      logoUrl: 'https://mevi-site-media-prod.s3.eu-north-1.amazonaws.com/colleges/logos/drait.jpeg'
    },
    {
      name: 'Bangalore University Affiliated Network',
      short: 'BU Network',
      type: 'BCA / MCA Project Lab',
      location: 'Bengaluru, Karnataka',
      iconBg: 'bg-indigo-50 text-indigo-900 border-indigo-100',
      logoUrl: null
    },
    {
      name: 'Surana College, Peenya Campus',
      short: 'Surana Peenya',
      type: 'Academic Partner',
      location: 'Peenya II Stage, Bengaluru - 560022',
      iconBg: 'bg-rose-50 text-rose-800 border-rose-100',
      logoUrl: null
    },
    {
      name: 'Sri Jagadguru Renukacharya College (SJRC)',
      short: 'SJRC',
      type: 'Institutional Partner',
      location: 'Race Course Road, Bengaluru - 560009',
      iconBg: 'bg-orange-50 text-orange-800 border-orange-100',
      logoUrl: null
    },
    {
      name: 'Ramnarayan Chellaram College (RC College)',
      short: 'RC College',
      type: 'Commerce & Management Partner',
      location: 'Palace Road, Gandhi Nagar, Bengaluru - 560001',
      iconBg: 'bg-violet-50 text-violet-800 border-violet-100',
      logoUrl: null
    }
  ];

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-gray-200 overflow-hidden">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* 1. SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0f766e]/10 text-[#0f766e] text-xs font-extrabold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Academic & Institutional Network</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#01083f]">
            Trusted by Leading Colleges & Institutions
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Partnering with top universities, degree colleges, and technical institutions across Bangalore and Karnataka for academic projects, internships, and skill training.
          </p>
        </div>

        {/* 2. CONTINUOUS SCROLLING COLLEGE LOGO MARQUEE */}
        <div className="relative overflow-hidden py-4 border-y border-gray-100 bg-[#fbfbfd] rounded-2xl mb-14 shadow-inner">
          {/* Gradient Edge Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#fbfbfd] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#fbfbfd] to-transparent z-10 pointer-events-none" />

          <div className="animate-scroll-track flex items-center gap-6 sm:gap-8">
            {/* First sequence */}
            {marqueeColleges.map((college, idx) => (
              <div 
                key={`marquee-1-${idx}`} 
                className="flex-shrink-0 bg-white py-3 px-5 rounded-xl border border-gray-200/90 shadow-sm hover:shadow-md hover:border-[#0f766e] transition-all duration-300 flex items-center gap-3.5 group cursor-default"
                title={`${college.name} - ${college.location}`}
              >
                {college.logoUrl ? (
                  <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src={college.logoUrl}
                      alt={college.name}
                      className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${college.iconBg} group-hover:scale-105 transition-transform duration-300`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                )}

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-[#01083f] group-hover:text-[#0f766e] transition-colors whitespace-nowrap">
                      {college.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0f766e]/10 text-[#0f766e] whitespace-nowrap hidden md:inline-block">
                      {college.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-0.5 whitespace-nowrap">
                    <MapPin className="w-3 h-3 text-[#0f766e] flex-shrink-0" />
                    <span>{college.location}</span>
                  </span>
                </div>
              </div>
            ))}

            {/* Duplicate sequence for seamless infinite scroll */}
            {marqueeColleges.map((college, idx) => (
              <div 
                key={`marquee-2-${idx}`} 
                className="flex-shrink-0 bg-white py-3 px-5 rounded-xl border border-gray-200/90 shadow-sm hover:shadow-md hover:border-[#0f766e] transition-all duration-300 flex items-center gap-3.5 group cursor-default"
                title={`${college.name} - ${college.location}`}
              >
                {college.logoUrl ? (
                  <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src={college.logoUrl}
                      alt={college.name}
                      className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${college.iconBg} group-hover:scale-105 transition-transform duration-300`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                )}

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-[#01083f] group-hover:text-[#0f766e] transition-colors whitespace-nowrap">
                      {college.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0f766e]/10 text-[#0f766e] whitespace-nowrap hidden md:inline-block">
                      {college.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-0.5 whitespace-nowrap">
                    <MapPin className="w-3 h-3 text-[#0f766e] flex-shrink-0" />
                    <span>{college.location}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. ORIGINAL PARTNER COLLEGES & INSTITUTIONS GRID */}
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-gray-100">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0f766e]">
                Direct Academic Associations & MoU Partners
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#01083f] mt-1">
                Partner Colleges & Training Associations
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-0 max-w-md text-left sm:text-right">
              Active project collaboration centers & skill enhancement nodes across Bangalore
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnersData.map((partner) => (
              <div
                key={partner.id}
                className="group relative bg-white rounded-2xl p-6 border border-gray-200/90 hover:border-[#0f766e]/60 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Top Accent Bar */}
                <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-[#01083f] via-[#0f766e] to-[#ffcc00] rounded-b opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Badge & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#01083f]/5 text-[#01083f] border border-[#01083f]/10 group-hover:bg-[#0f766e] group-hover:text-white group-hover:border-[#0f766e] transition-colors">
                      {partner.type}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-[#01083f] group-hover:bg-[#ffcc00]/20 group-hover:text-[#01083f] transition-colors">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  </div>

                  {/* College Name */}
                  <h4 className="text-base font-bold text-[#01083f] leading-snug group-hover:text-[#0f766e] transition-colors mb-2">
                    {partner.name}
                  </h4>

                  {/* Location */}
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#0f766e] flex-shrink-0" />
                    <span>{partner.location}</span>
                  </p>

                  {/* Description */}
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-4">
                    {partner.description}
                  </p>
                </div>

                {/* Footer Stats & Tag */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#0f766e] flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {partner.studentsImpacted}
                  </span>
                  <span className="text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                    {partner.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. OFFICIAL RECOGNITIONS & CERTIFICATIONS (Carousel Slider) */}
        <div className="pt-10 border-t border-gray-100">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#0f766e]/10 text-[#0f766e] mb-2.5">
              <Award className="w-3.5 h-3.5" />
              <span>Accreditations & Compliance</span>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#01083f]">
              Official Recognitions & Certifications
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Gnana Computech Solutions operates under registered corporate, government, and industry quality standards
            </p>
          </div>

          {/* Carousel Slider with Navigation Controls */}
          <div className="relative">
            {/* Prev Arrow */}
            <button
              onClick={prevRec}
              className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-[#0f766e] hover:bg-[#0f766e] text-[#01083f] hover:text-white flex items-center justify-center transition-all duration-200 shadow-md z-20 focus:outline-none cursor-pointer"
              aria-label="Previous recognitions slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next Arrow */}
            <button
              onClick={nextRec}
              className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-[#0f766e] hover:bg-[#0f766e] text-[#01083f] hover:text-white flex items-center justify-center transition-all duration-200 shadow-md z-20 focus:outline-none cursor-pointer"
              aria-label="Next recognitions slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Carousel Slider Window */}
            <div
              className="overflow-hidden py-2 px-1"
              onMouseEnter={() => setIsRecPaused(true)}
              onMouseLeave={() => setIsRecPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Sliding Track - moves left by (recIndex * (100 / visibleCount))% */}
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${recIndex * (100 / visibleCount)}%)`
                }}
              >
                {recognitionsData.map((cert, index) => (
                  <div
                    key={index}
                    className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-2.5"
                  >
                    <div className="h-full p-6 rounded-2xl bg-white border border-gray-200/90 shadow-sm hover:border-gray-300 hover:shadow-md transition-all duration-300 text-center flex flex-col items-center justify-between">
                      <div className="flex flex-col items-center w-full">
                        {cert.image ? (
                          <div className="h-14 w-full flex items-center justify-center mb-3.5 p-1.5 rounded-xl bg-gray-50 border border-gray-100">
                            <img
                              src={cert.image}
                              alt={cert.title}
                              className="max-h-12 w-auto object-contain rounded"
                            />
                          </div>
                        ) : (
                          <div className="h-14 w-full flex items-center justify-center mb-3.5">
                            <span className="text-3xl sm:text-4xl">
                              {cert.icon}
                            </span>
                          </div>
                        )}

                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0f766e]/10 text-[#0f766e] border border-[#0f766e]/20 mb-2">
                          {cert.badge}
                        </span>

                        <h4 className="text-base font-extrabold text-[#01083f] leading-snug">
                          {cert.title}
                        </h4>

                        <p className="text-xs font-semibold text-[#0f766e] mt-1">
                          {cert.subtitle}
                        </p>

                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                          {cert.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#0f766e]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Statutory Record</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Carousel Pagination Dots & Center Controls */}
          <div className="flex justify-center items-center space-x-3 mt-6">
            <button
              onClick={prevRec}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-[#0f766e] hover:bg-[#0f766e] text-[#01083f] hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs focus:outline-none cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setRecIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    recIndex === idx ? 'bg-[#0f766e] w-7' : 'bg-gray-200 hover:bg-gray-300 w-2'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextRec}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-[#0f766e] hover:bg-[#0f766e] text-[#01083f] hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs focus:outline-none cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

