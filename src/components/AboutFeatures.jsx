import React from 'react';
import { Wrench, Smile, Code2, TrendingUp, Users2, Award, BookOpen, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutFeatures = () => {
  const features = [
    {
      title: 'Hands-On Learning',
      desc: 'Every concept is taught with live coding, demos, and practical exercises on real systems.',
      icon: Wrench,
      gradient: 'from-[#0f766e] to-[#22c55e]'
    },
    {
      title: 'Fun & Interactive Sessions',
      desc: 'Coding challenges, project hackathons, real-life analogies, and interactive discussions.',
      icon: Smile,
      gradient: 'from-[#4338ca] to-[#3b82f6]'
    },
    {
      title: 'Project-Based Training',
      desc: 'Students build end-to-end mini-projects and IEEE capstone projects from scratch.',
      icon: Code2,
      gradient: 'from-[#D4A72C] to-[#f59e0b]'
    },
    {
      title: 'Industry-Aligned Curriculum',
      desc: 'Course content matches latest tech stacks: React, Node, Python, Django, AI/ML, and Cloud.',
      icon: TrendingUp,
      gradient: 'from-[#e11d48] to-[#f43f5e]'
    },
    {
      title: 'Expert Industry Mentors',
      desc: 'Experienced software engineers with strong architectural knowledge and real-world exposure.',
      icon: Users2,
      gradient: 'from-[#7c3aed] to-[#a855f7]'
    },
    {
      title: 'Outcome-Driven Results',
      desc: 'Focus on code confidence, documentation, viva defense preparation, and placement readiness.',
      icon: Award,
      gradient: 'from-[#0284c7] to-[#06b6d4]'
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-[#f7f9ff] to-[#ffffff] border-b border-gray-200">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-[#0f766e]/10 text-[#0f766e] mb-3 inline-block">
            Where Learning Meets Innovation
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#01083f]">
            About Gnana Computech Solutions
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Where tech learning is practical, engaging, and designed to build confident software engineers.
          </p>
        </div>

        {/* Intro Card */}
        <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-white border-l-8 border-[#0f766e] shadow-xl border border-gray-100 mb-10 text-gray-700 leading-relaxed text-sm sm:text-base">
          <p className="mb-3">
            At <strong>Gnana Computech Solutions Private Limited</strong>, based in Sunkadakatte, Bangalore, we believe that the best way to master modern technology is by <strong>doing</strong>. Our programs are designed to ensure students don't just understand theoretical concepts, but build and deploy complete real-world software applications.
          </p>
          <p className="mb-0 text-gray-600">
            We deliver specialized degree academic projects (BCA/MCA/B.Tech), industrial training, and software internships in Python, MERN Stack, AI/ML, and Cloud — all through a <strong>project-first methodology</strong>.
          </p>
        </div>

        {/* 6 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex items-start gap-4 group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <IconComp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#01083f] mb-1 group-hover:text-[#0f766e] transition-colors">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action CTAs */}
        <div className="mt-12 text-center flex flex-wrap justify-center gap-4">
          <Link
            to="/courses"
            className="px-6 py-3 rounded-xl bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore Programs</span>
          </Link>
          <Link
            to="/contact"
            className="px-6 py-3 rounded-xl bg-white hover:bg-gray-50 text-[#01083f] border-2 border-gray-300 font-bold text-sm transition-all flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-[#0f766e]" />
            <span>Talk to Us</span>
          </Link>
        </div>

      </div>
    </section>
  );
};
