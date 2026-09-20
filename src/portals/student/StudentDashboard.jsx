import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, User, BookOpen, CheckSquare, FileText,
  FolderGit2, DollarSign, Award, LogOut, Code, Clock,
  CheckCircle2, ShieldCheck, Mail
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../lib/auth/AuthContext';
import { fetchDashboardStats } from '../../lib/api/dashboard';
import { attendance as attendanceApi } from '../../lib/api/academics';
import { invoices as invoicesApi, certificates as certificatesApi } from '../../lib/api/finance';
import { ApiError } from '../../lib/api/client';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((err) => setStatsError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not load your dashboard.'))
      .finally(() => setStatsLoading(false));
  }, []);

  // Primary enrollment — most students have one active program at a time;
  // the "Courses"/"Enrollments" tabs below still list every enrollment.
  const primaryEnrollment = stats?.enrollments?.[0] || null;

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState('');
  useEffect(() => {
    attendanceApi.list({ page_size: 20, ordering: '-session_date' })
      .then((data) => setAttendanceRecords(data.results))
      .catch((err) => setAttendanceError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not load attendance records.'))
      .finally(() => setAttendanceLoading(false));
  }, []);

  const [studentInvoices, setStudentInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState('');
  useEffect(() => {
    invoicesApi.list({ page_size: 20 })
      .then((data) => setStudentInvoices(data.results))
      .catch((err) => setInvoicesError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not load fee records.'))
      .finally(() => setInvoicesLoading(false));
  }, []);

  const [studentCertificates, setStudentCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  const [certificatesError, setCertificatesError] = useState('');
  useEffect(() => {
    certificatesApi.list({ page_size: 20 })
      .then((data) => setStudentCertificates(data.results))
      .catch((err) => setCertificatesError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not load certificates.'))
      .finally(() => setCertificatesLoading(false));
  }, []);

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

  // Real identity (GET /auth/me/ via AuthContext) + real academic summary
  // (GET /dashboard/stats/, apps/core/views.py DashboardStatsView._student_stats)
  const studentProfile = {
    name: user?.full_name || 'Prajwal Gowda',
    id: user?.student_id || stats?.student?.business_id || 'GCS-2026-BCA04',
    course: primaryEnrollment?.program || 'BCA Final Year Academic Project & JAVA/PYTHON Full Stack',
    college: stats?.student ? `${stats.student.degree}${stats.student.semester ? ` • Semester ${stats.student.semester}` : ''}` : 'Sunkadakatte Degree College, Bangalore',
    attendance: primaryEnrollment ? `${primaryEnrollment.attendance_percentage.toFixed(1)}%` : '94%',
    projectStatus: primaryEnrollment?.status || 'Live Module Coding (Phase 3 of 4)',
    batch: primaryEnrollment?.batch || '2026',
    mentor: 'Naveen Kumar (Senior Architect, GCS)',
  };

  const handleLogout = async () => {
    await logout();
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
            <span>Logout</span>
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
                  <p className="text-gray-400">Batch:</p>
                  <p className="font-bold text-[#D4A72C]">{studentProfile.batch}</p>
                  <p className="text-[11px] text-emerald-400 font-semibold">Attendance: {studentProfile.attendance}</p>
                </div>
              </div>

              {/* Attendance — real figure from GET /dashboard/stats/ */}
              {primaryEnrollment && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-300 font-semibold">Attendance ({primaryEnrollment.status})</span>
                  <span className="text-[#D4A72C] font-bold">{studentProfile.attendance}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden p-0.5 border border-gray-700">
                  <div className="bg-gradient-to-r from-[#D4A72C] to-[#B88918] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, primaryEnrollment.attendance_percentage)}%` }} />
                </div>
              </div>
              )}
            </div>

            {statsLoading && <p className="text-xs text-gray-500">Loading your dashboard…</p>}
            {statsError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{statsError}</p>}

            {/* Fee Ledger — real balance from GET /invoices/ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Fee Ledger</span>
                  <DollarSign className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                {invoicesLoading ? (
                  <h3 className="text-lg font-bold text-[#222326]">Loading…</h3>
                ) : invoicesError ? (
                  <p className="text-xs text-red-600">{invoicesError}</p>
                ) : (
                  (() => {
                    const balance = studentInvoices.reduce((sum, inv) => sum + Number(inv.balance_amount || 0), 0);
                    return (
                      <>
                        <h3 className="text-lg font-bold text-[#222326]">{balance <= 0 ? 'Fully Paid' : `₹${balance.toLocaleString()} Due`}</h3>
                        <p className={`text-xs mt-1 font-semibold ${balance <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {studentInvoices.length} invoice{studentInvoices.length === 1 ? '' : 's'} on record
                        </p>
                      </>
                    );
                  })()
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Certificates</span>
                  <Award className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                {certificatesLoading ? (
                  <h3 className="text-lg font-bold text-[#222326]">Loading…</h3>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-[#222326]">{studentCertificates.filter(c => c.status === 'ISSUED').length} Issued</h3>
                    <p className="text-xs text-gray-500 mt-1">QR Code Verifiable</p>
                  </>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Total Enrollments</span>
                  <FolderGit2 className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                <h3 className="text-lg font-bold text-[#222326]">{stats?.total_enrollments ?? '—'}</h3>
                <p className="text-xs text-gray-500 mt-1">Across all programs</p>
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
                  {(studentProfile.name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
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
                    <span className="font-mono font-bold text-[#B88918]">{studentProfile.batch}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Enrollment Status</span>
                    <span className="font-bold text-[#222326]">{studentProfile.projectStatus}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#D4A72C]" /> Contact
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">Email Address</span>
                    <span className="font-bold text-[#222326]">{user?.email || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Phone Number</span>
                    <span className="font-bold text-[#222326]">{user?.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Overall Attendance Record</span>
                    <span className="font-bold text-emerald-600">{studentProfile.attendance}</span>
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
              <p className="text-xs text-gray-300 mt-2">Comprehensive curriculum covering full stack JAVA/PYTHON development, IEEE synopsis documentation, database schema design, and university project defense.</p>
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

        {/* 4. ENROLLMENTS TAB — real data: GET /dashboard/stats/ */}
        {activeTab === 'Enrollments' && (
          <div className="space-y-6">
            {statsLoading ? (
              <p className="text-xs text-gray-500">Loading enrollments…</p>
            ) : statsError ? (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{statsError}</p>
            ) : !stats?.enrollments?.length ? (
              <p className="text-xs text-gray-500 bg-white border border-[#E8E1D2] rounded-2xl p-6">No enrollments on record yet.</p>
            ) : stats.enrollments.map((enr) => (
              <div key={enr.enrollment_id} className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E1D2] pb-4">
                  <div>
                    <span className="text-xs text-gray-500 font-semibold uppercase">Enrollment</span>
                    <h3 className="text-lg font-bold text-[#222326]">{enr.program}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                    enr.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800'
                    : enr.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                  }`}>{enr.status}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                    <span className="text-gray-500 block">Enrollment ID</span>
                    <span className="font-mono font-bold text-base text-[#B88918]">{enr.business_id}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                    <span className="text-gray-500 block">Batch</span>
                    <span className="font-bold text-base text-[#222326]">{enr.batch}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                    <span className="text-gray-500 block">Attendance</span>
                    <span className="font-bold text-base text-[#222326]">{enr.attendance_percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. ATTENDANCE TAB — real data: attendance_percentage from dashboard
             stats + individual session logs from GET /academics/attendance/
             (server-side scoped to this student, apps/academics/views.py) */}
        {activeTab === 'Attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-[#17181A] text-white p-6 rounded-2xl border border-[#D4A72C]/40 shadow-md">
                <span className="text-xs text-gray-400 uppercase font-bold">Overall Attendance</span>
                <h3 className="text-3xl font-extrabold text-[#D4A72C] mt-1">{studentProfile.attendance}</h3>
                <p className="text-xs text-emerald-400 mt-1 font-semibold">
                  {primaryEnrollment ? `Enrollment: ${primaryEnrollment.program}` : 'No active enrollment'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <span className="text-xs text-gray-500 uppercase font-bold">Logged Sessions</span>
                <h3 className="text-3xl font-extrabold text-[#222326] mt-1">{attendanceRecords.length}</h3>
                <p className="text-xs text-gray-500 mt-1">Most recent {attendanceRecords.length} shown below</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3">Recent Session Logs</h3>
              {attendanceLoading ? (
                <p className="text-xs text-gray-500 py-4">Loading session logs…</p>
              ) : attendanceError ? (
                <p className="text-xs text-red-600">{attendanceError}</p>
              ) : attendanceRecords.length === 0 ? (
                <p className="text-xs text-gray-500 py-4">No attendance records yet.</p>
              ) : (
              <div className="space-y-3 text-xs">
                {attendanceRecords.map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <span className="font-bold text-[#222326] block truncate">{rec.session_topic || 'Session'}</span>
                      <span className="text-gray-500 block text-[11px]">{rec.session_date}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded font-bold whitespace-nowrap ${
                      rec.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800'
                      : rec.status === 'EXCUSED' ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                    }`}>{rec.status}</span>
                  </div>
                ))}
              </div>
              )}
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
              <p className="text-xs text-gray-300">Full stack JAVA/PYTHON application integrated with intelligent disease pattern classification backend microservice for final year BCA degree submission.</p>

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
                  <span className="font-bold text-[#222326]">Phase 3: Java Stack Live Module Coding & Integration</span>
                  <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-bold">In Progress (75%)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center">
                  <span className="font-bold text-[#222326]">Phase 4: Final Binding Book, Paper Publication & Mock Viva</span>
                  <span className="px-2.5 py-1 rounded bg-gray-200 text-gray-700 font-bold">Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. FEES TAB — real data: GET /invoices/ (scoped to this student) */}
        {activeTab === 'Fees' && (
          <div className="space-y-6">
            {invoicesLoading ? (
              <p className="text-xs text-gray-500">Loading fee records…</p>
            ) : invoicesError ? (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{invoicesError}</p>
            ) : studentInvoices.length === 0 ? (
              <p className="text-xs text-gray-500 bg-white border border-[#E8E1D2] rounded-2xl p-6">No invoices raised yet.</p>
            ) : studentInvoices.map((inv) => (
              <div key={inv.id} className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E1D2] pb-4">
                  <div>
                    <span className="text-xs text-gray-500 font-semibold uppercase">Invoice {inv.invoice_number}</span>
                    <h3 className="text-lg font-bold text-[#222326]">{inv.program_title}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                    inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800'
                    : inv.status === 'OVERDUE' ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                  }`}>{inv.status}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                    <span className="text-gray-500 block">Total Fee</span>
                    <span className="font-bold text-lg text-[#222326]">₹{Number(inv.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                    <span className="text-gray-500 block">Amount Paid</span>
                    <span className="font-bold text-lg text-emerald-600">₹{Number(inv.paid_amount).toLocaleString()}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                    <span className="text-gray-500 block">Outstanding Balance</span>
                    <span className="font-bold text-lg text-[#222326]">₹{Number(inv.balance_amount).toLocaleString()}</span>
                  </div>
                </div>

                {inv.payments?.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] space-y-3 text-xs">
                    <h4 className="font-bold text-[#222326] border-b border-[#E8E1D2] pb-2">Payments</h4>
                    {inv.payments.map((p) => (
                      <div key={p.id} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-600">
                        <div><span className="font-semibold text-[#222326]">Transaction:</span> {p.transaction_id}</div>
                        <div><span className="font-semibold text-[#222326]">Amount:</span> ₹{Number(p.amount).toLocaleString()} via {p.payment_mode}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 10. CERTIFICATES TAB — real data: GET /certificates/ (scoped to this student) */}
        {activeTab === 'Certificates' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3">Course Completion & Project Certificates</h3>
              {certificatesLoading ? (
                <p className="text-xs text-gray-500 py-4">Loading certificates…</p>
              ) : certificatesError ? (
                <p className="text-xs text-red-600">{certificatesError}</p>
              ) : studentCertificates.length === 0 ? (
                <p className="text-xs text-gray-500 py-4">No certificates issued yet — these appear automatically once eligibility is confirmed (Section 8 of the spec).</p>
              ) : (
              <div className="space-y-4 text-xs">
                {studentCertificates.map((cert) => (
                  <div key={cert.id} className="p-5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1 min-w-0">
                      <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] uppercase ${
                        cert.status === 'ISSUED' ? 'bg-emerald-100 text-emerald-800'
                        : cert.status === 'REVOKED' ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                      }`}>{cert.status}</span>
                      <h4 className="font-bold text-[#222326] text-base">{cert.title}</h4>
                      <p className="text-gray-500">{cert.program_title} — {cert.institution_name}</p>
                      <p className="text-[#B88918] font-mono text-[11px]">Cert No: {cert.certificate_number}</p>
                    </div>
                    <span className="px-3.5 py-2 rounded-xl bg-[#17181A] text-[#D4A72C] font-bold text-xs whitespace-nowrap">
                      {cert.status === 'ISSUED' ? 'QR Verifiable' : cert.status}
                    </span>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        )}

      </main>

    </div>
  );
};

export default StudentDashboard;
