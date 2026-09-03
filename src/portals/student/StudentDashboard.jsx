import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, User, BookOpen, CheckSquare, FileText, 
  FolderGit2, DollarSign, Award, LogOut, Bell, Code, Clock, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { Logo } from '../../components/Logo';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');

  const sidebarItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Profile', icon: User },
    { name: 'Courses', icon: BookOpen },
    { name: 'Enrollments', icon: CheckCircle2 },
    { name: 'Attendance', icon: CheckSquare },
    { name: 'Assignments', icon: FileText },
    { name: 'Assessments', icon: Clock },
    { name: 'Projects', icon: FolderGit2 },
    { name: 'Fees', icon: DollarSign },
    { name: 'Certificates', icon: Award },
  ];

  const studentProfile = {
    name: 'Prajwal Gowda',
    id: 'GCS-2026-BCA04',
    course: 'BCA Final Year Academic Project & MERN Full Stack',
    college: 'Sunkadakatte Degree College, Bangalore',
    attendance: '94%',
    projectStatus: 'Live Module Coding (Phase 3 of 4)',
    mentor: 'Naveen Kumar (Senior Architect, GCS)'
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#252525] flex flex-col lg:flex-row">
      
      {/* Student Sidebar */}
      <aside className="w-full lg:w-64 bg-[#17181A] text-white flex-shrink-0 flex flex-col justify-between p-4 border-r border-[#D4A72C]/30">
        <div>
          <div className="pb-6 pt-2 px-2 border-b border-gray-800 flex items-center justify-between">
            <Logo variant="dark" size="normal" />
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#D4A72C] text-[#17181A]">Student</span>
          </div>

          <div className="my-4 p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
            <p className="font-bold text-white">{studentProfile.name}</p>
            <p className="text-[#D4A72C] font-mono text-[10px] mt-0.5">{studentProfile.id}</p>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === item.name
                    ? 'bg-[#D4A72C] text-[#17181A] shadow-md font-bold'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-[#D4A72C]'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
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
            <span>Logout Student Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Student Portal Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E8E1D2]">
          <div>
            <span className="text-xs uppercase font-bold text-[#B88918] tracking-wider">Learner Dashboard</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222326]">Welcome, {studentProfile.name}!</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/" className="px-3.5 py-2 rounded-xl bg-[#17181A] text-[#D4A72C] border border-[#D4A72C]/40 text-xs font-bold hover:bg-[#222326]">
              Return to Website
            </Link>
          </div>
        </div>

        {/* Project & Progress Overview Card */}
        <div className="bg-[#17181A] text-white rounded-3xl p-6 sm:p-8 border border-[#D4A72C]/40 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#D4A72C] text-[#17181A] uppercase">
                Active Track
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{studentProfile.course}</h2>
              <p className="text-xs text-gray-300">College: {studentProfile.college}</p>
            </div>

            <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-xs space-y-1.5 flex-shrink-0">
              <p className="text-gray-400">Assigned Mentor:</p>
              <p className="font-bold text-[#D4A72C]">{studentProfile.mentor}</p>
              <p className="text-[11px] text-emerald-400 font-semibold">Attendance: {studentProfile.attendance}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-300 font-semibold">Project Execution Milestone</span>
              <span className="text-[#D4A72C] font-bold">75% Completed</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden p-0.5 border border-gray-700">
              <div className="bg-gradient-to-r from-[#D4A72C] to-[#B88918] h-full rounded-full w-[75%]" />
            </div>
          </div>
        </div>

        {/* 3 Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6B6B6B]">Documentation</span>
              <FileText className="w-5 h-5 text-[#D4A72C]" />
            </div>
            <h3 className="text-lg font-bold text-[#222326]">IEEE SRS Approved</h3>
            <p className="text-xs text-emerald-600 mt-1 font-semibold">Ready for University Submission</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6B6B6B]">Live Code Repository</span>
              <Code className="w-5 h-5 text-[#D4A72C]" />
            </div>
            <h3 className="text-lg font-bold text-[#222326]">MERN Stack Source</h3>
            <p className="text-xs text-gray-500 mt-1">Git Repository Synced</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6B6B6B]">Fee Ledger</span>
              <DollarSign className="w-5 h-5 text-[#D4A72C]" />
            </div>
            <h3 className="text-lg font-bold text-[#222326]">Fully Paid</h3>
            <p className="text-xs text-emerald-600 mt-1 font-semibold">Receipt #GCS-REC-940</p>
          </div>
        </div>

        {/* Modules & Tasks Table */}
        <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#222326] mb-4">My Course Modules & Viva Tasks</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-[#222326]">Module 1: React State & Custom Hooks</h4>
                  <p className="text-gray-500">Completed on Feb 14, 2026</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">Passed (100%)</span>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-[#222326]">Module 2: Node.js Express REST APIs & MongoDB Schema</h4>
                  <p className="text-gray-500">Completed on Feb 28, 2026</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">Passed (95%)</span>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-[#D4A72C]" />
                <div>
                  <h4 className="font-bold text-[#222326]">Module 3: Viva Voce Defense Practice & Mock Presentation</h4>
                  <p className="text-gray-500">Scheduled for March 20, 2026 at Sunkadakatte Lab</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-bold">Upcoming</span>
            </div>
          </div>
        </div>

      </main>

    </div>
  );
};
