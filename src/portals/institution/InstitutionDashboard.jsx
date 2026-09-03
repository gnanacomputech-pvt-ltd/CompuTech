import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, Layers, UserPlus, 
  CheckSquare, FileBarChart, LogOut, Building2, Award, Calendar, CheckCircle2 
} from 'lucide-react';
import { Logo } from '../../components/Logo';

export const InstitutionDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');

  const sidebarItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Students', icon: Users, count: 120 },
    { name: 'Programs', icon: BookOpen },
    { name: 'Batches', icon: Layers },
    { name: 'Enrollments', icon: UserPlus },
    { name: 'Attendance', icon: CheckSquare },
    { name: 'Reports', icon: FileBarChart },
  ];

  const collegeProfile = {
    name: 'Sunkadakatte Degree College',
    code: 'INST-BLR-08',
    partnerSince: '2024',
    studentsEnrolled: 120,
    activeBatches: 3,
    workshopsConducted: 5
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#252525] flex flex-col lg:flex-row">
      
      {/* Institution Sidebar */}
      <aside className="w-full lg:w-64 bg-[#17181A] text-white flex-shrink-0 flex flex-col justify-between p-4 border-r border-[#D4A72C]/30">
        <div>
          <div className="pb-6 pt-2 px-2 border-b border-gray-800 flex items-center justify-between">
            <Logo variant="dark" size="normal" />
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#D4A72C] text-[#17181A]">Partner</span>
          </div>

          <div className="my-4 p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
            <p className="font-bold text-white">{collegeProfile.name}</p>
            <p className="text-[#D4A72C] font-mono text-[10px] mt-0.5">{collegeProfile.code}</p>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === item.name
                    ? 'bg-[#D4A72C] text-[#17181A] shadow-md font-bold'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-[#D4A72C]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.count && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-[#D4A72C]">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Institution Portal Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E8E1D2]">
          <div>
            <span className="text-xs uppercase font-bold text-[#B88918] tracking-wider">Institution Administration</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222326]">{collegeProfile.name} Portal</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/" className="px-3.5 py-2 rounded-xl bg-[#17181A] text-[#D4A72C] text-xs font-bold hover:bg-[#222326]">
              Public Website
            </Link>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6B6B6B]">Enrolled Students</span>
              <Users className="w-5 h-5 text-[#D4A72C]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#222326]">120</h3>
            <p className="text-xs text-gray-500 mt-1">BCA & BSc Computer Science</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6B6B6B]">Active Batches</span>
              <Layers className="w-5 h-5 text-[#D4A72C]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#222326]">3</h3>
            <p className="text-xs text-gray-500 mt-1">MERN & Python Track</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6B6B6B]">Campus Workshops</span>
              <Award className="w-5 h-5 text-[#D4A72C]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#222326]">5 Completed</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1">100% Attendance Compliance</p>
          </div>
        </div>

        {/* Institutional Reports & Batches */}
        <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-[#222326] mb-4">College Student Progress Reports</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex items-center justify-between text-xs">
              <div>
                <h4 className="font-bold text-[#222326]">Batch BCA-2026-A (Final Year Projects)</h4>
                <p className="text-gray-500">45 Students • Mentored by GCS Sunkadakatte</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">100% Code Verified</span>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex items-center justify-between text-xs">
              <div>
                <h4 className="font-bold text-[#222326]">Batch PY-DATA-2026 (Data Analytics Bootcamp)</h4>
                <p className="text-gray-500">35 Students • Weekend Track</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold">In Progress</span>
            </div>
          </div>
        </div>

      </main>

    </div>
  );
};
