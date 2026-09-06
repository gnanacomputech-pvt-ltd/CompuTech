import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, User, BookOpen, CheckSquare, FileText, 
  FolderGit2, DollarSign, Award, LogOut, Code, Clock, 
  CheckCircle2, ShieldCheck, Mail
} from 'lucide-react';
import { Logo } from '../../components/Logo';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Derive active tab from current URL path
  const getTabFromPath = () => {
    const path = location.pathname.replace('/student', '').replace('/', '').toLowerCase();
    const matched = sidebarItems.find(item => item.name.toLowerCase() === path);
    return matched ? matched.name : 'Dashboard';
  };

  const activeTab = getTabFromPath();

  const handleTabClick = (itemName) => {
    const path = itemName === 'Dashboard' ? '/student/dashboard' : `/student/${itemName.toLowerCase()}`;
    navigate(path);
  };

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
    <div className="min-h-screen bg-[#FAFAF7] text-[#252525] flex flex-col lg:flex-row max-w-full overflow-x-hidden">
      
      {/* Student Sidebar - Fixed on desktop, scrollable on mobile */}
      <aside className="w-full lg:w-64 bg-[#17181A] text-white flex-shrink-0 flex flex-col justify-between p-4 border-b lg:border-b-0 lg:border-r border-[#D4A72C]/30 lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:z-30 lg:overflow-y-auto">
        <div>
          <div className="pb-6 pt-2 px-2 border-b border-gray-800 flex items-center">
            <Logo variant="dark" size="normal" stacked={true} />
          </div>

          <div className="my-4 p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
            <p className="font-bold text-white truncate">{studentProfile.name}</p>
            <p className="text-[#D4A72C] font-mono text-[10px] mt-0.5 truncate">{studentProfile.id}</p>
          </div>

          <nav className="space-y-1 max-h-[50vh] lg:max-h-none overflow-y-auto pr-1">
            {sidebarItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleTabClick(item.name)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === item.name
                    ? 'bg-[#D4A72C] text-[#17181A] shadow-md font-bold'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-[#D4A72C]'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-800 mt-4 lg:mt-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Logout Student Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Student Portal Content Column */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:ml-64 overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E8E1D2]">
          <div>
            <span className="text-xs uppercase font-bold text-[#B88918] tracking-wider">
              Learner Portal • {activeTab}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222326] break-words">
              {activeTab === 'Dashboard' ? `Welcome, ${studentProfile.name}!` : `${activeTab}`}
            </h1>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <Link to="/" className="px-3.5 py-2 rounded-xl bg-[#17181A] text-[#D4A72C] border border-[#D4A72C]/40 text-xs font-bold hover:bg-[#222326] transition-colors inline-flex items-center space-x-1.5">
              <span>Return to Website</span>
            </Link>
          </div>
        </div>

        {/* TAB CONTENT SWITCHER */}

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-8">
            {/* Project & Progress Overview Card */}
            <div className="bg-[#17181A] text-white rounded-3xl p-6 sm:p-8 border border-[#D4A72C]/40 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 min-w-0">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#D4A72C] text-[#17181A] uppercase inline-block">
                    Active Track
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white break-words">{studentProfile.course}</h2>
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
                  <div className="bg-gradient-to-r from-[#D4A72C] to-[#B88918] h-full rounded-full transition-all duration-500" style={{ width: '75%' }} />
                </div>
              </div>
            </div>

            {/* 3 Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Documentation</span>
                  <FileText className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                <h3 className="text-lg font-bold text-[#222326]">IEEE SRS Approved</h3>
                <p className="text-xs text-emerald-600 mt-1 font-semibold">Ready for University Submission</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Live Code Repository</span>
                  <Code className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                <h3 className="text-lg font-bold text-[#222326]">MERN Stack Source</h3>
                <p className="text-xs text-gray-500 mt-1">Git Repository Synced</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Fee Ledger</span>
                  <DollarSign className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                <h3 className="text-lg font-bold text-[#222326]">Fully Paid</h3>
                <p className="text-xs text-emerald-600 mt-1 font-semibold">Receipt #GCS-REC-940</p>
              </div>
            </div>

            {/* Modules & Tasks Table */}
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-4 sm:p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#222326] mb-4">My Course Modules & Viva Tasks</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start sm:items-center space-x-3 min-w-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#222326] break-words">Module 1: React State & Custom Hooks</h4>
                      <p className="text-gray-500">Completed on Feb 14, 2026</p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold whitespace-nowrap">Passed (100%)</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start sm:items-center space-x-3 min-w-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#222326] break-words">Module 2: Node.js Express REST APIs & MongoDB Schema</h4>
                      <p className="text-gray-500">Completed on Feb 28, 2026</p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold whitespace-nowrap">Passed (95%)</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start sm:items-center space-x-3 min-w-0">
                    <Clock className="w-5 h-5 text-[#D4A72C] flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#222326] break-words">Module 3: Viva Voce Defense Practice & Mock Presentation</h4>
                      <p className="text-gray-500">Scheduled for March 20, 2026 at Sunkadakatte Lab</p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-bold whitespace-nowrap">Upcoming</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PROFILE TAB */}
        {activeTab === 'Profile' && (
          <div className="space-y-6">
            <div className="bg-[#17181A] text-white rounded-3xl p-6 sm:p-8 border border-[#D4A72C]/40 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-[#D4A72C] text-[#17181A] font-extrabold text-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  PG
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-bold text-white truncate">{studentProfile.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>
                  </div>
                  <p className="text-[#D4A72C] font-mono text-sm font-semibold">{studentProfile.id}</p>
                  <p className="text-xs text-gray-300">{studentProfile.course}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D4A72C]" /> Academic Information
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">Institution / College</span>
                    <span className="font-bold text-[#222326]">{studentProfile.college}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Enrolled Program</span>
                    <span className="font-bold text-[#222326]">{studentProfile.course}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Batch Code</span>
                    <span className="font-mono font-bold text-[#B88918]">BCA-2026-B1</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Academic Session</span>
                    <span className="font-bold text-[#222326]">2025 - 2026</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#D4A72C]" /> Contact & Mentorship
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">Email Address</span>
                    <span className="font-bold text-[#222326]">prajwal.g@student.gnanacomputech.com</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Phone Number</span>
                    <span className="font-bold text-[#222326]">+91 98450 12345</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Assigned Senior Mentor</span>
                    <span className="font-bold text-[#B88918]">{studentProfile.mentor}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Overall Attendance Record</span>
                    <span className="font-bold text-emerald-600">{studentProfile.attendance} (Satisfactory)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. COURSES TAB */}
        {activeTab === 'Courses' && (
          <div className="space-y-6">
            <div className="bg-[#17181A] text-white rounded-3xl p-6 sm:p-8 border border-[#D4A72C]/40 shadow-xl">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#D4A72C] text-[#17181A] uppercase inline-block mb-3">
                Current Learning Track
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{studentProfile.course}</h2>
              <p className="text-xs text-gray-300 mt-2">Comprehensive curriculum covering full stack MERN development, IEEE synopsis documentation, database schema design, and university project defense.</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3">Course Modules & Learning Status</h3>
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">Module 01</span>
                    <h4 className="font-bold text-[#222326] text-sm mt-1">React State, Components & Custom Hooks</h4>
                    <p className="text-gray-500 mt-0.5">Component hierarchy, Context API, state management, and responsive UI design.</p>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold whitespace-nowrap">Completed</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">Module 02</span>
                    <h4 className="font-bold text-[#222326] text-sm mt-1">Node.js, Express REST APIs & MongoDB Schema</h4>
                    <p className="text-gray-500 mt-0.5">Backend API routing, Mongoose ORM, JWT authentication, and database modeling.</p>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold whitespace-nowrap">Completed</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">Module 03</span>
                    <h4 className="font-bold text-[#222326] text-sm mt-1">IEEE Documentation, System Architecture & Viva Prep</h4>
                    <p className="text-gray-500 mt-0.5">Drafting SRS report, UML diagrams, mock viva defense practice, and final project packaging.</p>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-lg bg-amber-500 text-white font-bold whitespace-nowrap">In Progress</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. ENROLLMENTS TAB */}
        {activeTab === 'Enrollments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E1D2] pb-4">
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase">Official Registration</span>
                  <h3 className="text-lg font-bold text-[#222326]">Active Enrollment Certificate</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">Verified & Confirmed</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                  <span className="text-gray-500 block">Enrollment ID</span>
                  <span className="font-mono font-bold text-base text-[#B88918]">GCS-2026-BCA04</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                  <span className="text-gray-500 block">Registration Date</span>
                  <span className="font-bold text-base text-[#222326]">January 15, 2026</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                  <span className="text-gray-500 block">Center Location</span>
                  <span className="font-bold text-base text-[#222326]">Sunkadakatte HQ, Blr</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-900 text-white text-xs space-y-2">
                <div className="flex items-center space-x-2 text-[#D4A72C]">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-bold">ISO 9001:2015 Registered Academic Program</span>
                </div>
                <p className="text-gray-300">Enrolled under Gnana Computech Solutions Academic Project & Technical Skill Division. Authorized for university viva voce submission.</p>
              </div>
            </div>
          </div>
        )}

        {/* 5. ATTENDANCE TAB */}
        {activeTab === 'Attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#17181A] text-white p-6 rounded-2xl border border-[#D4A72C]/40 shadow-md">
                <span className="text-xs text-gray-400 uppercase font-bold">Overall Attendance</span>
                <h3 className="text-3xl font-extrabold text-[#D4A72C] mt-1">94%</h3>
                <p className="text-xs text-emerald-400 mt-1 font-semibold">Exceeds 75% Requirement</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <span className="text-xs text-gray-500 uppercase font-bold">Attended Sessions</span>
                <h3 className="text-3xl font-extrabold text-[#222326] mt-1">30</h3>
                <p className="text-xs text-gray-500 mt-1">Out of 32 total conducted</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <span className="text-xs text-gray-500 uppercase font-bold">Excused Absences</span>
                <h3 className="text-3xl font-extrabold text-[#222326] mt-1">02</h3>
                <p className="text-xs text-emerald-600 mt-1 font-semibold">Leave Approved by Guide</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3">Recent Lab Session Logs</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#222326]">Feb 28, 2026 - Express REST API & MongoDB Integration Lab</span>
                    <span className="text-gray-500 block text-[11px]">Lab 1 (Sunkadakatte HQ) • 09:30 AM - 11:30 AM</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">Present</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#222326]">Feb 25, 2026 - React Custom Hooks & State Management</span>
                    <span className="text-gray-500 block text-[11px]">Lab 1 (Sunkadakatte HQ) • 09:30 AM - 11:30 AM</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">Present</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#222326]">Feb 21, 2026 - Node.js Express Controllers & Middleware</span>
                    <span className="text-gray-500 block text-[11px]">Lab 1 (Sunkadakatte HQ) • 09:30 AM - 11:30 AM</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">Present</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#222326]">Feb 14, 2026 - Architecture Review Session</span>
                    <span className="text-gray-500 block text-[11px]">Prior permission granted by mentor Naveen Kumar</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-bold">Excused</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. ASSIGNMENTS TAB */}
        {activeTab === 'Assignments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3">Course Assignments & Tasks</h3>
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-[#222326] text-sm">Assignment 1: React Custom Hooks & Context API</h4>
                    <p className="text-gray-500 mt-1">Build state management for interactive dashboard components.</p>
                    <span className="text-emerald-600 font-semibold block mt-1">Submitted on Feb 14, 2026 • Score: 100/100</span>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">Graded A+</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-[#222326] text-sm">Assignment 2: Express REST Endpoints & MongoDB Schema</h4>
                    <p className="text-gray-500 mt-1">Implement CRUD APIs with Mongoose schema validation.</p>
                    <span className="text-emerald-600 font-semibold block mt-1">Submitted on Feb 28, 2026 • Score: 95/100</span>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">Graded A+</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-[#222326] text-sm">Assignment 3: IEEE SRS Documentation & System Architecture</h4>
                    <p className="text-gray-500 mt-1">Draft full SRS report with UML sequence and use-case diagrams.</p>
                    <span className="text-amber-600 font-semibold block mt-1">Due Date: March 15, 2026</span>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">In Progress</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. ASSESSMENTS TAB */}
        {activeTab === 'Assessments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3">Mock Examinations & Viva Evaluations</h3>
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-[#222326] text-sm">Mid-Term Code Review & Technical Audit</h4>
                    <p className="text-gray-500 mt-1">Evaluated by Senior Architect Naveen Kumar on React & Node.js code standards.</p>
                    <p className="text-emerald-600 font-bold mt-1">Final Score: 93/100 (Grade A+)</p>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold">Cleared</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-[#222326] text-sm">University Viva Voce Mock Defense Practice</h4>
                    <p className="text-gray-500 mt-1">Scheduled at Sunkadakatte Lab 1 for final year presentation trial.</p>
                    <p className="text-[#B88918] font-semibold mt-1">Scheduled for: March 20, 2026 at 10:00 AM</p>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-lg bg-amber-500 text-white font-bold">Scheduled</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. PROJECTS TAB */}
        {activeTab === 'Projects' && (
          <div className="space-y-6">
            <div className="bg-[#17181A] text-white rounded-3xl p-6 sm:p-8 border border-[#D4A72C]/40 shadow-xl space-y-4">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#D4A72C] text-[#17181A] uppercase inline-block">
                Final Year Degree Project
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">AI-Driven Healthcare Disease Diagnostic System</h2>
              <p className="text-xs text-gray-300">Full stack MERN application integrated with intelligent disease pattern classification backend microservice for final year BCA degree submission.</p>

              <div className="pt-4 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block">Repository</span>
                  <span className="font-mono text-[#D4A72C]">gcs-prajwal/bca-final-project</span>
                </div>
                <div>
                  <span className="text-gray-400 block">IEEE SRS Report</span>
                  <span className="text-emerald-400 font-semibold">Approved & Verified</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Development Phase</span>
                  <span className="text-white font-bold">Phase 3: Live Coding</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3">Project Modules & Milestones</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center">
                  <span className="font-bold text-[#222326]">Phase 1: Project Synopsis & IEEE Topic Selection</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">Approved</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center">
                  <span className="font-bold text-[#222326]">Phase 2: Database Schema & UML Architecture Design</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">Approved</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center">
                  <span className="font-bold text-[#222326]">Phase 3: MERN Stack Live Module Coding & Integration</span>
                  <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-bold">In Progress (75%)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center">
                  <span className="font-bold text-[#222326]">Phase 4: Final Binding Book, Paper Publication & Mock Viva</span>
                  <span className="px-2.5 py-1 rounded bg-gray-200 text-gray-700 font-bold">Upcoming</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. FEES TAB */}
        {activeTab === 'Fees' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E1D2] pb-4">
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase">Financial Ledger</span>
                  <h3 className="text-lg font-bold text-[#222326]">Student Fee Account Status</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">Fully Paid (Clear)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                  <span className="text-gray-500 block">Total Program Fee</span>
                  <span className="font-bold text-lg text-[#222326]">₹6,500</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                  <span className="text-gray-500 block">Amount Paid</span>
                  <span className="font-bold text-lg text-emerald-600">₹6,500</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                  <span className="text-gray-500 block">Outstanding Balance</span>
                  <span className="font-bold text-lg text-[#222326]">₹0.00</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] space-y-3 text-xs">
                <h4 className="font-bold text-[#222326] border-b border-[#E8E1D2] pb-2">Payment Receipt Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-600">
                  <div><span className="font-semibold text-[#222326]">Receipt Number:</span> #GCS-REC-940</div>
                  <div><span className="font-semibold text-[#222326]">Payment Date:</span> February 10, 2026</div>
                  <div><span className="font-semibold text-[#222326]">Mode of Payment:</span> Online UPI / Google Pay</div>
                  <div><span className="font-semibold text-[#222326]">Transaction Ref:</span> UPI/2026/0210/940</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. CERTIFICATES TAB */}
        {activeTab === 'Certificates' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3">Course Completion & Project Certificates</h3>
              <div className="space-y-4 text-xs">
                <div className="p-5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">ISO 9001:2015 QR Verified</span>
                    <h4 className="font-bold text-[#222326] text-base">IEEE Project Completion Certificate</h4>
                    <p className="text-gray-500">Certified for BCA Final Year Academic Project Defense at Sunkadakatte Center.</p>
                    <p className="text-[#B88918] font-mono text-[11px]">Cert ID: GCS-2026-CERT-BCA04</p>
                  </div>
                  <span className="px-3.5 py-2 rounded-xl bg-[#17181A] text-[#D4A72C] font-bold text-xs whitespace-nowrap">Verified & Active</span>
                </div>

                <div className="p-5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">In Progress</span>
                    <h4 className="font-bold text-[#222326] text-base">MERN Full Stack Development Certificate</h4>
                    <p className="text-gray-500">Will be issued automatically after final Viva Voce presentation completion.</p>
                  </div>
                  <span className="px-3.5 py-2 rounded-xl bg-gray-200 text-gray-600 font-bold text-xs whitespace-nowrap">Pending Viva Defense</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};

export default StudentDashboard;
