import React, { useState } from 'react';
import { ArrowRight, Play, CheckCircle2, Award, BookOpen, Briefcase, GraduationCap, Code, ShieldCheck } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

export const Hero = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const quickHighlights = [
    { label: 'Industry-Focused Training', icon: Code },
    { label: 'Practical Learning', icon: BookOpen },
    { label: 'IT Internships', icon: Briefcase },
    { label: 'BCA & Degree Projects', icon: GraduationCap },
    { label: 'Placement Support', icon: CheckCircle2 },
    { label: 'ISO Certification', icon: Award }
  ];

  return (
    <section className="relative bg-[#17181A] text-white pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden border-b border-[#D4A72C]/30">
      
      {/* Background Decorative Grids & Glow */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4A72C_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4A72C]/15 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT: Text & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4A72C]/10 border border-[#D4A72C]/40 text-xs font-bold text-[#D4A72C]">
              <ShieldCheck className="w-4 h-4 text-[#D4A72C]" />
              <span>ISO 9001:2015 Certified Software & Skill Institute</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Empowering Tech Education & <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A72C] via-[#F5E6B8] to-[#B88918]">
                Real-World Software Solutions
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Gnana Computech Solutions Private Limited is a premier technology company in Sunkadakatte, Bangalore. We specialize in custom software development, BCA & degree academic projects, corporate IT internships, and industry-oriented tech training.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Button to="/courses" variant="primary" size="lg" icon={ArrowRight}>
                Explore Programs
              </Button>
              <Button to="/contact" variant="charcoal" size="lg">
                Contact Us
              </Button>
              
              <button
                onClick={() => setIsVideoOpen(true)}
                className="inline-flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold text-gray-300 hover:text-[#D4A72C] transition-colors focus:outline-none"
              >
                <span className="w-8 h-8 rounded-full bg-[#D4A72C]/20 border border-[#D4A72C] flex items-center justify-center text-[#D4A72C]">
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                </span>
                <span>Watch Overview</span>
              </button>
            </div>

          </div>

          {/* RIGHT: Technology Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl bg-[#222326] border-2 border-[#D4A72C]/40 p-6 sm:p-8 shadow-2xl overflow-hidden group">
              
              {/* Window Bar */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs font-mono text-[#D4A72C]">gcs-portal.ts — Active</span>
              </div>

              {/* Mock Code & Interactive Highlights */}
              <div className="space-y-4 font-mono text-xs text-gray-300">
                <div className="p-3.5 rounded-lg bg-gray-900 border border-gray-800">
                  <p className="text-[#D4A72C]">// GCS Skill Architecture</p>
                  <p className="text-white mt-1">
                    const <span className="text-yellow-400">gcsStudent</span> = &#123;<br />
                    &nbsp;&nbsp;project: <span className="text-emerald-400">'BCA / MCA Final Year Live App'</span>,<br />
                    &nbsp;&nbsp;internship: <span className="text-emerald-400">'Verified Corporate Track'</span>,<br />
                    &nbsp;&nbsp;stack: [<span className="text-sky-300">'React'</span>, <span className="text-sky-300">'Node'</span>, <span className="text-sky-300">'Python'</span>]<br />
                    &#125;;
                  </p>
                </div>

                {/* Floating Metric Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#D4A72C] to-[#B88918] text-[#17181A] font-sans shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">Quality Standard</p>
                      <h4 className="text-lg font-extrabold">ISO 9001:2015 Certified</h4>
                    </div>
                    <Award className="w-8 h-8 opacity-90" />
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <p className="text-xs uppercase font-bold tracking-widest text-[#D4A72C] text-center mb-6">
            Key Pillars of Gnana Computech Solutions
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickHighlights.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-center hover:border-[#D4A72C] transition-colors">
                <item.icon className="w-5 h-5 text-[#D4A72C] mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-gray-200 block">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Video Modal */}
      <Modal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
    </section>
  );
};
