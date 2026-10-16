import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, User, BookOpen, CheckSquare, FileText,
  FolderGit2, DollarSign, Award, LogOut, Clock,
  CheckCircle2, ShieldCheck, Mail, Phone, Download,
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../lib/auth/AuthContext';
import { students as studentsApi, programs as programsApi, enrollments as enrollmentsApi } from '../../lib/api/core';
import {
  attendance as attendanceApi, assignments as assignmentsApi,
  submissions as submissionsApi, assessments as assessmentsApi,
  marks as marksApi, progress as progressApi, mentorAllocations as mentorsApi,
} from '../../lib/api/academics';
import { invoices as invoicesApi, certificates as certificatesApi } from '../../lib/api/finance';
import { ApiError } from '../../lib/api/client';

// Student portal — every panel reads this student's own records. The
// backend scopes each endpoint server-side (a student only ever gets their
// own rows, see each ViewSet's get_queryset), so this just renders whatever
// comes back; it does not filter for security.

function errorMessage(err, fallback) {
  return err instanceof ApiError && typeof err.message === 'string' ? err.message : fallback;
}

// One hook per endpoint, so a single failing panel never blanks the page.
function useStudentData(loader, fallbackMessage, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    loader()
      .then((result) => { if (!cancelled) { setData(result); setError(''); } })
      .catch((err) => { if (!cancelled) setError(errorMessage(err, fallbackMessage)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => load(), [load]);

  return { data, loading, error, reload: load };
}

const Panel = ({ title, icon: Icon, children, actions }) => (
  <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
    {title && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E1D2] pb-3">
        <h3 className="text-base font-bold text-[#222326] flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#D4A72C]" />} {title}
        </h3>
        {actions}
      </div>
    )}
    {children}
  </div>
);

const State = ({ loading, error, isEmpty, emptyMessage, children }) => {
  if (loading) return <p className="text-xs text-gray-500 py-4">Loading…</p>;
  if (error) return <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>;
  if (isEmpty) return <p className="text-xs text-gray-500 py-4">{emptyMessage}</p>;
  return children;
};

const Row = ({ label, value, tone }) => (
  <div>
    <span className="text-gray-500 block">{label}</span>
    <span className={`font-bold ${tone || 'text-[#222326]'}`}>{value || '—'}</span>
  </div>
);

const Pill = ({ tone = 'gray', children }) => {
  const tones = {
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-200 text-gray-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
};

function statusTone(status) {
  const value = String(status || '').toUpperCase();
  if (['ACTIVE', 'COMPLETED', 'PRESENT', 'EVALUATED', 'ISSUED', 'PAID'].includes(value)) return 'green';
  if (['APPLIED', 'SUBMITTED', 'PARTIAL', 'PENDING', 'DRAFT'].includes(value)) return 'amber';
  if (['DROPPED', 'SUSPENDED', 'REJECTED', 'ABSENT', 'REVOKED', 'OVERDUE'].includes(value)) return 'red';
  if (value === 'EXCUSED' || value === 'LATE') return 'blue';
  return 'gray';
}

const SIDEBAR_ITEMS = [
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

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // The student's own record — StudentViewSet scopes the list to them, so
  // the first (only) row is this student.
  const profileRes = useStudentData(
    () => studentsApi.list({ page_size: 1 }).then((data) => (data.results || [])[0] || null),
    'Could not load your profile.',
  );
  const enrollmentsRes = useStudentData(
    () => enrollmentsApi.list({ page_size: 50, ordering: '-enrolled_at' }).then((d) => d.results || []),
    'Could not load your enrollments.',
  );
  const programsRes = useStudentData(
    () => programsApi.list({ page_size: 100 }).then((d) => d.results || []),
    'Could not load course details.',
  );
  const progressRes = useStudentData(
    () => progressApi.list({ page_size: 50 }).then((d) => d.results || []),
    'Could not load your progress.',
  );
  const attendanceRes = useStudentData(
    () => attendanceApi.list({ page_size: 30, ordering: '-session__session_date' }).then((d) => d.results || []),
    'Could not load attendance records.',
  );
  const assignmentsRes = useStudentData(
    () => assignmentsApi.list({ page_size: 50, ordering: '-due_date' }).then((d) => d.results || []),
    'Could not load assignments.',
  );
  const submissionsRes = useStudentData(
    () => submissionsApi.list({ page_size: 50 }).then((d) => d.results || []),
    'Could not load your submissions.',
  );
  const assessmentsRes = useStudentData(
    () => assessmentsApi.list({ page_size: 50, ordering: '-conducted_at' }).then((d) => d.results || []),
    'Could not load assessments.',
  );
  const marksRes = useStudentData(
    () => marksApi.list({ page_size: 50 }).then((d) => d.results || []),
    'Could not load your marks.',
  );
  const mentorsRes = useStudentData(
    () => mentorsApi.list({ page_size: 10 }).then((d) => d.results || []),
    'Could not load mentor details.',
  );
  const invoicesRes = useStudentData(
    () => invoicesApi.list({ page_size: 20 }).then((d) => d.results || []),
    'Could not load fee records.',
  );
  const certificatesRes = useStudentData(
    () => certificatesApi.list({ page_size: 20 }).then((d) => d.results || []),
    'Could not load certificates.',
  );

  const student = profileRes.data;
  const enrollments = enrollmentsRes.data || [];
  const programs = programsRes.data || [];
  const progressRecords = progressRes.data || [];
  const submissions = submissionsRes.data || [];
  const marks = marksRes.data || [];
  const invoices = invoicesRes.data || [];
  const certificates = certificatesRes.data || [];

  // Most students run one program at a time; the Enrollments tab still
  // lists every one.
  const primaryEnrollment = enrollments[0] || null;

  const programById = useMemo(
    () => Object.fromEntries(programs.map((p) => [p.id, p])),
    [programs],
  );
  const progressByEnrollment = useMemo(
    () => Object.fromEntries(progressRecords.map((p) => [p.enrollment, p])),
    [progressRecords],
  );
  const submissionByAssignment = useMemo(
    () => Object.fromEntries(submissions.map((s) => [s.assignment, s])),
    [submissions],
  );
  const markByAssessment = useMemo(
    () => Object.fromEntries(marks.map((m) => [m.assessment, m])),
    [marks],
  );

  const attendancePercent = primaryEnrollment
    ? Number(primaryEnrollment.attendance_percentage || 0)
    : null;

  const feeBalance = invoices.reduce((sum, inv) => sum + Number(inv.balance_amount || 0), 0);
  const mentorName = (mentorsRes.data || [])[0]?.mentor_name || null;

  // Academic-project enrollments drive the Projects tab — there is no
  // separate per-student project record, the enrollment in a program of
  // type ACADEMIC_PROJECT *is* the project.
  const projectEnrollments = useMemo(
    () => enrollments.filter((enr) => programById[enr.program]?.program_type === 'ACADEMIC_PROJECT'),
    [enrollments, programById],
  );

  // ------------------------------------------------------------- routing
  const activeTab = useMemo(() => {
    const slug = location.pathname.replace('/student', '').replace(/^\//, '').toLowerCase();
    const matched = SIDEBAR_ITEMS.find((item) => item.name.toLowerCase() === slug);
    return matched ? matched.name : 'Dashboard';
  }, [location.pathname]);

  const handleTabClick = (name) => {
    navigate(name === 'Dashboard' ? '/student/dashboard' : `/student/${name.toLowerCase()}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const studentName = user?.full_name || student?.user_details?.full_name || 'Student';
  const collegeLine = student?.institution_name || '—';
  const courseLine = primaryEnrollment?.program_title || 'No active program yet';

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#252525] flex flex-col lg:flex-row max-w-full overflow-x-hidden">

      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-[#17181A] text-white flex-shrink-0 flex flex-col justify-between p-4 border-b lg:border-b-0 lg:border-r border-[#D4A72C]/30 lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:z-30 lg:overflow-y-auto">
        <div>
          <Link to="/" className="block pb-6 pt-2 px-2 border-b border-gray-800">
            <Logo variant="dark" size="normal" stacked={true} />
          </Link>

          <div className="my-4 p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
            <p className="font-bold text-white truncate">{studentName}</p>
            <p className="text-[11px] text-[#D4A72C] font-mono truncate">
              {student?.business_id || '—'}
            </p>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">{collegeLine}</p>
          </div>

          <nav className="space-y-1 max-h-[45vh] lg:max-h-[55vh] overflow-y-auto pr-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleTabClick(item.name)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#D4A72C] text-[#17181A] shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-red-600/20 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
        <header>
          <h1 className="text-xl sm:text-2xl font-bold text-[#222326]">
            {activeTab === 'Dashboard' ? `Welcome, ${studentName.split(' ')[0]}!` : activeTab}
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">{courseLine}</p>
        </header>

        {/* ------------------------------------------------- DASHBOARD */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-6">
            <div className="bg-[#17181A] text-white rounded-3xl p-6 sm:p-8 border border-[#D4A72C]/40 shadow-xl">
              <State
                loading={enrollmentsRes.loading}
                error={enrollmentsRes.error}
                isEmpty={!primaryEnrollment}
                emptyMessage="You have no enrollments yet. Once a coordinator enrolls you in a program it will appear here."
              >
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 min-w-0">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#D4A72C] text-[#17181A] uppercase inline-block">
                        Active Track
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-white break-words">
                        {primaryEnrollment.program_title}
                      </h2>
                      <p className="text-xs text-gray-300">College: {collegeLine}</p>
                    </div>

                    <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-xs space-y-1.5 flex-shrink-0">
                      <p className="text-gray-400">Batch:</p>
                      <p className="font-bold text-[#D4A72C]">{primaryEnrollment.batch_name}</p>
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        Attendance: {attendancePercent?.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-300 font-semibold">
                        Attendance ({primaryEnrollment.status})
                      </span>
                      <span className="text-[#D4A72C] font-bold">{attendancePercent?.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden p-0.5 border border-gray-700">
                      <div
                        className="bg-gradient-to-r from-[#D4A72C] to-[#B88918] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, attendancePercent || 0)}%` }}
                      />
                    </div>
                  </div>
                </>
              </State>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Fee Ledger</span>
                  <DollarSign className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                {invoicesRes.loading ? (
                  <h3 className="text-lg font-bold text-[#222326]">Loading…</h3>
                ) : invoicesRes.error ? (
                  <p className="text-xs text-red-600">{invoicesRes.error}</p>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-[#222326]">
                      {feeBalance <= 0 ? 'Fully Paid' : `₹${feeBalance.toLocaleString('en-IN')} Due`}
                    </h3>
                    <p className={`text-xs mt-1 font-semibold ${feeBalance <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {invoices.length} invoice{invoices.length === 1 ? '' : 's'} on record
                    </p>
                  </>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Certificates</span>
                  <Award className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                <h3 className="text-lg font-bold text-[#222326]">
                  {certificatesRes.loading ? 'Loading…' : `${certificates.filter((c) => c.status === 'ISSUED').length} Issued`}
                </h3>
                <p className="text-xs text-gray-500 mt-1">QR code verifiable</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Assignments</span>
                  <FileText className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                <h3 className="text-lg font-bold text-[#222326]">
                  {assignmentsRes.loading ? 'Loading…' : `${submissions.length} / ${(assignmentsRes.data || []).length}`}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Submitted</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Enrollments</span>
                  <FolderGit2 className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                <h3 className="text-lg font-bold text-[#222326]">
                  {enrollmentsRes.loading ? 'Loading…' : enrollments.length}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Across all programs</p>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- PROFILE */}
        {activeTab === 'Profile' && (
          <div className="space-y-6">
            <div className="bg-[#17181A] text-white rounded-3xl p-6 sm:p-8 border border-[#D4A72C]/40 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-[#D4A72C] text-[#17181A] font-extrabold text-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  {studentName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white truncate">{studentName}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      user?.is_active !== false
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {user?.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-[#D4A72C] font-mono text-sm font-semibold">{student?.business_id || '—'}</p>
                  <p className="text-xs text-gray-300">{courseLine}</p>
                </div>
              </div>
            </div>

            <State
              loading={profileRes.loading}
              error={profileRes.error}
              isEmpty={!student}
              emptyMessage="Your student profile has not been created yet. It appears once your registration is approved."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Panel title="Academic Information" icon={User}>
                  <div className="space-y-3 text-xs">
                    <Row label="Institution / College" value={student.institution_name} />
                    <Row label="Degree" value={student.degree} />
                    <Row label="Branch" value={student.branch} />
                    <Row label="Semester" value={student.semester ? `Semester ${student.semester}` : null} />
                    <Row label="University Seat Number (USN)" value={student.usn} />
                    <Row label="Student ID" value={student.business_id} tone="text-[#B88918] font-mono" />
                  </div>
                </Panel>

                <Panel title="Contact & Progress" icon={Mail}>
                  <div className="space-y-3 text-xs">
                    <Row label="Email Address" value={user?.email} />
                    <Row label="Phone Number" value={user?.phone} />
                    <Row
                      label="Overall Attendance"
                      value={attendancePercent !== null ? `${attendancePercent.toFixed(1)}%` : 'Not recorded yet'}
                      tone="text-emerald-600"
                    />
                    <Row label="Assigned Mentor" value={mentorName || 'Not allocated yet'} />
                    <Row
                      label="Active Program"
                      value={primaryEnrollment ? `${primaryEnrollment.program_title} (${primaryEnrollment.status})` : null}
                    />
                  </div>
                </Panel>
              </div>
            </State>
          </div>
        )}

        {/* ---------------------------------------------------- COURSES */}
        {activeTab === 'Courses' && (
          <State
            loading={enrollmentsRes.loading || programsRes.loading}
            error={enrollmentsRes.error}
            isEmpty={enrollments.length === 0}
            emptyMessage="You are not enrolled in any course yet."
          >
            <div className="space-y-6">
              {enrollments.map((enrollment) => {
                const program = programById[enrollment.program];
                const extra = program?.extra || {};
                const topics = Array.isArray(extra.topics) ? extra.topics : [];
                const highlights = Array.isArray(extra.highlights) ? extra.highlights : [];
                const progress = progressByEnrollment[enrollment.id];

                return (
                  <div key={enrollment.id} className="space-y-4">
                    <div className="bg-[#17181A] text-white rounded-3xl p-6 sm:p-8 border border-[#D4A72C]/40 shadow-xl">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#D4A72C] text-[#17181A] uppercase inline-block mb-3">
                        {program?.program_type?.replace(/_/g, ' ') || 'Program'}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">{enrollment.program_title}</h2>
                      {program?.description && (
                        <p className="text-xs text-gray-300 mt-2">{program.description}</p>
                      )}
                      <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-gray-400 block">Duration</span>
                          <span className="font-bold text-white">
                            {program?.duration_weeks ? `${program.duration_weeks} weeks` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Batch</span>
                          <span className="font-bold text-white">{enrollment.batch_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Status</span>
                          <span className="font-bold text-[#D4A72C]">{enrollment.status}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Attendance</span>
                          <span className="font-bold text-white">
                            {Number(enrollment.attendance_percentage || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {(topics.length > 0 || highlights.length > 0) && (
                      <Panel title="Syllabus & Highlights" icon={BookOpen}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                          {topics.length > 0 && (
                            <div>
                              <span className="text-gray-500 block mb-2 font-semibold uppercase text-[10px] tracking-wider">
                                Topics covered
                              </span>
                              <ul className="space-y-1.5">
                                {topics.map((topic, idx) => (
                                  <li key={idx} className="flex gap-2 text-[#252525]">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span>{topic}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {highlights.length > 0 && (
                            <div>
                              <span className="text-gray-500 block mb-2 font-semibold uppercase text-[10px] tracking-wider">
                                Highlights
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {highlights.map((highlight, idx) => (
                                  <Pill key={idx} tone="blue">{highlight}</Pill>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </Panel>
                    )}

                    {progress && (
                      <Panel title="Your Progress" icon={CheckSquare}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <Row
                            label="Sessions attended"
                            value={`${progress.attended_sessions} / ${progress.total_sessions}`}
                          />
                          <Row
                            label="Attendance"
                            value={`${Number(progress.attendance_percentage).toFixed(1)}%`}
                          />
                          <Row
                            label="Assignments done"
                            value={`${progress.assignments_completed} / ${progress.total_assignments}`}
                          />
                          <Row
                            label="Eligible for completion"
                            value={progress.is_eligible_for_completion ? 'Yes' : 'Not yet'}
                            tone={progress.is_eligible_for_completion ? 'text-emerald-600' : 'text-amber-600'}
                          />
                        </div>
                      </Panel>
                    )}
                  </div>
                );
              })}
            </div>
          </State>
        )}

        {/* ------------------------------------------------ ENROLLMENTS */}
        {activeTab === 'Enrollments' && (
          <State
            loading={enrollmentsRes.loading}
            error={enrollmentsRes.error}
            isEmpty={enrollments.length === 0}
            emptyMessage="No enrollments on record yet."
          >
            <div className="space-y-6">
              {enrollments.map((enrollment) => (
                <Panel key={enrollment.id}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E1D2] pb-4">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase">Enrollment</span>
                      <h3 className="text-lg font-bold text-[#222326]">{enrollment.program_title}</h3>
                    </div>
                    <Pill tone={statusTone(enrollment.status)}>{enrollment.status}</Pill>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                      <span className="text-gray-500 block">Enrollment ID</span>
                      <span className="font-mono font-bold text-base text-[#B88918]">{enrollment.business_id}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                      <span className="text-gray-500 block">Batch</span>
                      <span className="font-bold text-base text-[#222326]">{enrollment.batch_name}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                      <span className="text-gray-500 block">Attendance</span>
                      <span className="font-bold text-base text-[#222326]">
                        {Number(enrollment.attendance_percentage || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                      <span className="text-gray-500 block">Coordinator approval</span>
                      <span className={`font-bold text-base ${enrollment.coordinator_approval ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {enrollment.coordinator_approval ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          </State>
        )}

        {/* ------------------------------------------------- ATTENDANCE */}
        {activeTab === 'Attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-[#17181A] text-white p-6 rounded-2xl border border-[#D4A72C]/40 shadow-md">
                <span className="text-xs text-gray-400 uppercase font-bold">Overall Attendance</span>
                <h3 className="text-3xl font-extrabold text-[#D4A72C] mt-1">
                  {attendancePercent !== null ? `${attendancePercent.toFixed(1)}%` : '—'}
                </h3>
                <p className="text-xs text-emerald-400 mt-1 font-semibold">
                  {primaryEnrollment ? `Enrollment: ${primaryEnrollment.program_title}` : 'No active enrollment'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <span className="text-xs text-gray-500 uppercase font-bold">Logged Sessions</span>
                <h3 className="text-3xl font-extrabold text-[#222326] mt-1">
                  {(attendanceRes.data || []).length}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Most recent sessions shown below</p>
              </div>
            </div>

            <Panel title="Recent Session Logs" icon={CheckSquare}>
              <State
                loading={attendanceRes.loading}
                error={attendanceRes.error}
                isEmpty={(attendanceRes.data || []).length === 0}
                emptyMessage="No attendance has been recorded for you yet."
              >
                <div className="space-y-3 text-xs">
                  {(attendanceRes.data || []).map((record) => (
                    <div
                      key={record.id}
                      className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center gap-3"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-[#222326] block truncate">
                          {record.session_topic || 'Session'}
                        </span>
                        <span className="text-gray-500 block text-[11px]">
                          {record.session_date}{record.remarks ? ` • ${record.remarks}` : ''}
                        </span>
                      </div>
                      <Pill tone={statusTone(record.status)}>{record.status}</Pill>
                    </div>
                  ))}
                </div>
              </State>
            </Panel>
          </div>
        )}

        {/* ------------------------------------------------ ASSIGNMENTS */}
        {activeTab === 'Assignments' && (
          <Panel title="Course Assignments & Tasks" icon={FileText}>
            <State
              loading={assignmentsRes.loading || submissionsRes.loading}
              error={assignmentsRes.error}
              isEmpty={(assignmentsRes.data || []).length === 0}
              emptyMessage="No assignments have been set for your batch yet."
            >
              <div className="space-y-4 text-xs">
                {(assignmentsRes.data || []).map((assignment) => {
                  const submission = submissionByAssignment[assignment.id];
                  const due = assignment.due_date ? new Date(assignment.due_date) : null;
                  const overdue = due && !submission && due < new Date();

                  return (
                    <div
                      key={assignment.id}
                      className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#222326] text-sm">{assignment.title}</h4>
                        {assignment.description && (
                          <p className="text-gray-500 mt-1">{assignment.description}</p>
                        )}
                        {submission ? (
                          <span className="text-emerald-600 font-semibold block mt-1">
                            Submitted {new Date(submission.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                            {submission.marks_obtained !== null && submission.marks_obtained !== undefined
                              ? ` • Score: ${submission.marks_obtained}/${assignment.max_marks}`
                              : ''}
                          </span>
                        ) : (
                          <span className={`font-semibold block mt-1 ${overdue ? 'text-red-600' : 'text-amber-600'}`}>
                            {due
                              ? `${overdue ? 'Overdue — was due' : 'Due'} ${due.toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric',
                              })}`
                              : 'No due date set'}
                          </span>
                        )}
                        {submission?.feedback && (
                          <p className="text-gray-600 mt-1 italic">Feedback: {submission.feedback}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 self-start sm:self-center">
                        <Pill tone={submission ? statusTone(submission.status) : overdue ? 'red' : 'amber'}>
                          {submission ? submission.status : overdue ? 'OVERDUE' : 'PENDING'}
                        </Pill>
                      </div>
                    </div>
                  );
                })}
              </div>
            </State>
          </Panel>
        )}

        {/* ------------------------------------------------ ASSESSMENTS */}
        {activeTab === 'Assessments' && (
          <Panel title="Examinations & Viva Evaluations" icon={Clock}>
            <State
              loading={assessmentsRes.loading || marksRes.loading}
              error={assessmentsRes.error}
              isEmpty={(assessmentsRes.data || []).length === 0}
              emptyMessage="No assessments have been scheduled for your batch yet."
            >
              <div className="space-y-4 text-xs">
                {(assessmentsRes.data || []).map((assessment) => {
                  const mark = markByAssessment[assessment.id];
                  const conducted = assessment.conducted_at ? new Date(assessment.conducted_at) : null;
                  const upcoming = conducted && conducted > new Date();

                  return (
                    <div
                      key={assessment.id}
                      className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#222326] text-sm">{assessment.title}</h4>
                        <p className="text-gray-500 mt-1">
                          {assessment.assessment_type?.replace(/_/g, ' ')} • Pass mark {assessment.passing_marks} of {assessment.max_marks}
                        </p>
                        {conducted && (
                          <p className="text-[#B88918] font-semibold mt-1">
                            {upcoming ? 'Scheduled for' : 'Conducted on'}{' '}
                            {conducted.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        )}
                        {mark && (
                          <p className={`font-bold mt-1 ${mark.is_passed ? 'text-emerald-600' : 'text-red-600'}`}>
                            Your score: {mark.marks_obtained} / {assessment.max_marks}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 self-start sm:self-center">
                        <Pill tone={mark ? (mark.is_passed ? 'green' : 'red') : upcoming ? 'amber' : 'gray'}>
                          {mark ? (mark.is_passed ? 'Cleared' : 'Not cleared') : upcoming ? 'Scheduled' : 'Awaiting result'}
                        </Pill>
                      </div>
                    </div>
                  );
                })}
              </div>
            </State>
          </Panel>
        )}

        {/* --------------------------------------------------- PROJECTS */}
        {activeTab === 'Projects' && (
          <State
            loading={enrollmentsRes.loading || programsRes.loading}
            error={enrollmentsRes.error}
            isEmpty={projectEnrollments.length === 0}
            emptyMessage="You have no academic project enrollment yet. Project guidance appears here once a coordinator enrolls you."
          >
            <div className="space-y-6">
              {projectEnrollments.map((enrollment) => {
                const program = programById[enrollment.program];
                const progress = progressByEnrollment[enrollment.id];

                return (
                  <div key={enrollment.id} className="space-y-4">
                    <div className="bg-[#17181A] text-white rounded-3xl p-6 sm:p-8 border border-[#D4A72C]/40 shadow-xl space-y-4">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#D4A72C] text-[#17181A] uppercase inline-block">
                        Academic Project
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">{enrollment.program_title}</h2>
                      {program?.description && <p className="text-xs text-gray-300">{program.description}</p>}

                      <div className="pt-4 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-gray-400 block">Project ID</span>
                          <span className="font-mono text-[#D4A72C]">{enrollment.business_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Guide / Mentor</span>
                          <span className="text-white font-semibold">{mentorName || 'Not allocated yet'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Status</span>
                          <span className="text-white font-bold">{enrollment.status}</span>
                        </div>
                      </div>
                    </div>

                    <Panel title="Milestones" icon={FolderGit2}>
                      <State
                        loading={progressRes.loading}
                        error={progressRes.error}
                        isEmpty={!progress}
                        emptyMessage="No progress has been recorded against this project yet."
                      >
                        <div className="space-y-3 text-xs">
                          {[
                            {
                              label: 'Sessions attended',
                              done: progress?.total_sessions > 0 && progress?.attended_sessions > 0,
                              detail: `${progress?.attended_sessions ?? 0} of ${progress?.total_sessions ?? 0}`,
                            },
                            {
                              label: 'Attendance requirement',
                              done: Number(progress?.attendance_percentage || 0) >= 75,
                              detail: `${Number(progress?.attendance_percentage || 0).toFixed(1)}% recorded`,
                            },
                            {
                              label: 'Assignments completed',
                              done: progress?.total_assignments > 0
                                && progress?.assignments_completed >= progress?.total_assignments,
                              detail: `${progress?.assignments_completed ?? 0} of ${progress?.total_assignments ?? 0}`,
                            },
                            {
                              label: 'Assessments passed',
                              done: !!progress?.assessments_passed,
                              detail: progress?.assessments_passed ? 'All cleared' : 'Pending',
                            },
                            {
                              label: 'Eligible for certificate',
                              done: !!progress?.is_eligible_for_completion,
                              detail: progress?.is_eligible_for_completion ? 'Yes' : 'Not yet',
                            },
                          ].map((milestone) => (
                            <div
                              key={milestone.label}
                              className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center gap-3"
                            >
                              <div className="min-w-0">
                                <span className="font-bold text-[#222326] block">{milestone.label}</span>
                                <span className="text-gray-500 text-[11px]">{milestone.detail}</span>
                              </div>
                              <Pill tone={milestone.done ? 'green' : 'amber'}>
                                {milestone.done ? 'Done' : 'In progress'}
                              </Pill>
                            </div>
                          ))}
                        </div>
                      </State>
                    </Panel>
                  </div>
                );
              })}
            </div>
          </State>
        )}

        {/* ------------------------------------------------------- FEES */}
        {activeTab === 'Fees' && (
          <State
            loading={invoicesRes.loading}
            error={invoicesRes.error}
            isEmpty={invoices.length === 0}
            emptyMessage="No invoices have been raised for you yet."
          >
            <div className="space-y-6">
              {invoices.map((invoice) => (
                <Panel key={invoice.id}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E1D2] pb-4">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase">Invoice</span>
                      <h3 className="text-lg font-bold text-[#222326] font-mono">{invoice.invoice_number}</h3>
                    </div>
                    <Pill tone={statusTone(invoice.status)}>{invoice.status}</Pill>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                      <span className="text-gray-500 block">Total</span>
                      <span className="font-bold text-base text-[#222326]">
                        ₹{Number(invoice.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                      <span className="text-gray-500 block">Paid</span>
                      <span className="font-bold text-base text-emerald-600">
                        ₹{Number(invoice.paid_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2]">
                      <span className="text-gray-500 block">Balance</span>
                      <span className={`font-bold text-base ${Number(invoice.balance_amount || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        ₹{Number(invoice.balance_amount || 0).toLocaleString('en-IN')}
                      </span>
                      {invoice.due_date && Number(invoice.balance_amount || 0) > 0 && (
                        <span className="block text-[11px] text-gray-500 mt-1">
                          Due {new Date(invoice.due_date).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          </State>
        )}

        {/* ----------------------------------------------- CERTIFICATES */}
        {activeTab === 'Certificates' && (
          <State
            loading={certificatesRes.loading}
            error={certificatesRes.error}
            isEmpty={certificates.length === 0}
            emptyMessage="No certificates have been issued to you yet. They appear here once your program is complete."
          >
            <div className="space-y-6">
              {certificates.map((certificate) => (
                <Panel key={certificate.id}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E1D2] pb-4">
                    <div className="min-w-0">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Certificate</span>
                      <h3 className="text-lg font-bold text-[#222326]">{certificate.title}</h3>
                      <span className="font-mono text-[11px] text-[#B88918]">{certificate.certificate_number}</span>
                    </div>
                    <Pill tone={statusTone(certificate.status)}>{certificate.status}</Pill>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <ShieldCheck className="w-4 h-4 text-[#D4A72C]" />
                      {certificate.issue_date
                        ? `Issued ${new Date(certificate.issue_date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}`
                        : 'Not yet issued'}
                    </span>
                    {certificate.pdf_file && (
                      <a
                        href={certificate.pdf_file}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4A72C] text-[#17181A] font-bold hover:bg-[#B88918] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </a>
                    )}
                  </div>
                </Panel>
              ))}
            </div>
          </State>
        )}
      </main>
    </div>
  );
};
