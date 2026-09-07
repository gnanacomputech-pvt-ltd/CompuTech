import React from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { InternshipCard } from '../components/InternshipCard';
import { internshipsData } from '../data/internshipsData';
import { Button } from '../components/Button';
import { ShieldCheck, Award, Briefcase, CheckCircle2 } from 'lucide-react';

export const Internships = () => {
  return (
    <div className="py-12 bg-[#FAFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner */}
        <div className="bg-[#17181A] rounded-3xl p-8 sm:p-12 text-white border border-[#D4A72C]/40 mb-16 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#D4A72C] text-[#17181A] uppercase tracking-wider">
              GCS Corporate Internship Program
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Gain Real-World Corporate Experience in Bangalore
            </h1>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              Work on live client modules, collaborate with senior software architects, and earn a verifiable internship completion certificate at our Sunkadakatte center.
            </p>
          </div>
        </div>

        <SectionTitle
          badge="Available Tracks"
          title="GCS IT & Software Internships"
          subtitle="Designed for BCA, MCA, B.E., B.Tech, and Computer Science undergraduates seeking hands-on industry exposure."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {internshipsData.map((internship) => (
            <InternshipCard key={internship.id} internship={internship} />
          ))}
        </div>

        {/* Benefits Box */}
        <div className="bg-white rounded-2xl p-8 border border-[#E8E1D2] shadow-sm mb-16">
          <h3 className="text-2xl font-bold text-[#222326] mb-6 text-center">
            What You Receive Upon Internship Completion
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] text-center">
              <Award className="w-8 h-8 text-[#D4A72C] mx-auto mb-2" />
              <h4 className="font-bold text-[#222326] text-sm mb-1">Verifiable Certificate</h4>
              <p className="text-xs text-[#6B6B6B]">Internship certificate with unique verification URL/code for your resume.</p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] text-center">
              <Briefcase className="w-8 h-8 text-[#D4A72C] mx-auto mb-2" />
              <h4 className="font-bold text-[#222326] text-sm mb-1">Live Project Code</h4>
              <p className="text-xs text-[#6B6B6B]">GitHub repository access to demonstrate during technical job interviews.</p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] text-center">
              <ShieldCheck className="w-8 h-8 text-[#D4A72C] mx-auto mb-2" />
              <h4 className="font-bold text-[#222326] text-sm mb-1">Letter of Recommendation</h4>
              <p className="text-xs text-[#6B6B6B]">Official LOR signed by GCS software directors for top performing interns.</p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] text-center">
              <CheckCircle2 className="w-8 h-8 text-[#D4A72C] mx-auto mb-2" />
              <h4 className="font-bold text-[#222326] text-sm mb-1">Placement Referrals</h4>
              <p className="text-xs text-[#6B6B6B]">Direct resume forwarding to partner IT firms and software startups.</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-[#17181A] p-8 rounded-2xl border border-[#D4A72C]/40 text-white max-w-3xl mx-auto space-y-4">
          <h3 className="text-2xl font-bold">Ready to Apply for an Internship?</h3>
          <p className="text-gray-300 text-sm">Submit your student application online and our team will contact you within 24 hours.</p>
          <Button to="/register" variant="primary" size="lg">
            Submit Internship Application
          </Button>
        </div>

      </div>
    </div>
  );
};
