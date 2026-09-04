import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, GraduationCap, Code, Briefcase, Laptop, UserCheck, Users, ShieldCheck } from 'lucide-react';
import { servicesData } from '../data/servicesData';
import { Button } from '../components/Button';

const iconMap = {
  GraduationCap,
  Code,
  Briefcase,
  Laptop,
  UserCheck,
  Users
};

export const ServiceDetails = () => {
  const { id } = useParams();
  const service = servicesData.find((s) => s.id === id);

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const IconComponent = iconMap[service.iconName] || Code;

  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#6B6B6B] hover:text-[#D4A72C] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Services</span>
        </Link>

        {/* Detail Header Box */}
        <div className="bg-[#17181A] rounded-3xl p-8 sm:p-10 text-white border border-[#D4A72C]/40 mb-10 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#D4A72C] text-[#17181A] flex items-center justify-center font-bold">
              <IconComponent className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#D4A72C]">GCS Official Service</span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{service.title}</h1>
            </div>
          </div>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-4">
            {service.fullDesc}
          </p>
        </div>

        {/* Detailed Features Grid */}
        <div className="bg-white rounded-2xl p-8 border border-[#E8E1D2] shadow-sm mb-10 space-y-6">
          <h2 className="text-2xl font-bold text-[#222326] border-b border-gray-100 pb-3">
            Key Features & Offerings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {service.features.map((feature, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-[#D4A72C] flex-shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-[#252525]">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Applied Technologies */}
        <div className="bg-white rounded-2xl p-8 border border-[#E8E1D2] shadow-sm mb-10">
          <h3 className="text-lg font-bold text-[#222326] mb-4">Technologies & Tools Employed</h3>
          <div className="flex flex-wrap gap-2">
            {service.technologies.map((tech, idx) => (
              <span key={idx} className="px-3.5 py-1.5 rounded-lg bg-[#17181A] text-[#D4A72C] text-xs font-bold border border-[#D4A72C]/30">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Action Card */}
        <div className="bg-[#17181A] rounded-2xl p-8 text-white border border-[#D4A72C]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white">Interested in {service.title}?</h3>
            <p className="text-xs text-gray-300 mt-1">Contact our Sunkadakatte team or register online for instant guidance.</p>
          </div>
          <div className="flex gap-3">
            <Button to="/register" variant="primary" size="md">
              Register Interest
            </Button>
            <Button to="/contact" variant="charcoal" size="md">
              Contact Us
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
