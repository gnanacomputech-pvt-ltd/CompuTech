import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, UserCheck, BookOpen, UserPlus,
  Plus, Trash2, Edit, Check, GraduationCap, Clock, Mail, Phone,
} from 'lucide-react';
import { DashboardShell } from '../shared/DashboardShell';
import { SignupQueue, ApprovalNote } from '../shared/SignupQueue';
import {
  SectionCard, StatTile, Badge, AsyncState, TableWrap, IconButton, ModalShell,
  Field, INPUT_CLASS, statusTone,
} from '../shared/ui';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  students as studentsApi, institutions as institutionsApi, programs as programsApi,
  batches as batchesApi, employees as employeesApi, enrollments as enrollmentsApi,
} from '../../lib/api/core';
import { signupRequests } from '../../lib/api/signup';
import { fetchDashboardStats } from '../../lib/api/dashboard';
import { useCrudResource } from '../../lib/hooks/useCrudResource';
import { ApiError } from '../../lib/api/client';

// Administrator console.
//
// Deliberately narrower than the staff dashboard: this is the organisational
// view — who the students are, which colleges are partners, who has staff
// access, what the programs are and who is enrolled in them. Fees, batches,
// attendance, assignments and projects are not here; day-to-day academic
// work and all website editing live in the staff dashboard.
const MENU = [
  {
    label: 'Overview',
    items: [{
      name: 'Dashboard', icon: LayoutDashboard,
      heading: 'Administrator Overview',
      description: 'Organisation-wide totals and anything waiting on your decision.',
    }],
  },
  {
    label: 'People',
    items: [
      {
        name: 'Students', icon: Users,
        heading: 'Students',
        description: 'Every student on record, with their college and enrolment count.',
      },
      {
        name: 'Institutions', icon: Building2,
        heading: 'Institutions & Partnership Requests',
        description: 'Partner colleges, plus colleges applying for a coordinator account.',
      },
      {
        name: 'Staff Access', icon: UserCheck,
        heading: 'Staff Access',
        description: 'Approve or reject staff sign-ups, and review who currently has ERP access.',
      },
    ],
  },
  {
    label: 'Academics',
    items: [
      {
        name: 'Programs', icon: BookOpen,
        heading: 'Programs',
        description: 'Courses, internships, projects and workshops — with live enrolment numbers.',
      },
      {
        name: 'Enrollments', icon: UserPlus,
        heading: 'Enrollments',
        description: 'Who is enrolled in what, and approval of new applications.',
      },
    ],
  },
];

const PROGRAM_TYPES = [
  { value: 'COURSE', label: 'Professional Training Course' },
  { value: 'INTERNSHIP', label: 'Software Internship' },
  { value: 'ACADEMIC_PROJECT', label: 'Academic Project (BCA/MCA/BE)' },
  { value: 'WORKSHOP', label: 'Technical Workshop / Seminar' },
];

const EMPTY_INSTITUTION = { code: '', name: '', city: '', state: 'Karnataka', contact_email: '', contact_phone: '', address: '' };
const EMPTY_PROGRAM = { code: '', title: '', program_type: 'COURSE', description: '', duration_weeks: 4, base_fee: 0, is_published: true };
const EMPTY_ENROLLMENT = { student: '', program: '', batch: '', newBatchName: '', newBatchStart: '' };

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ---------------------------------------------------------------- data
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [statsLoading, setStatsLoading] = useState(true);

  const [pendingCounts, setPendingCounts] = useState({ student: 0, staff: 0, institution: 0, total: 0 });

  const loadPendingCounts = useCallback(() => {
    signupRequests.pendingCounts()
      .then(setPendingCounts)
      .catch(() => { /* a missing badge count is not worth an error banner */ });
  }, []);

  const loadStats = useCallback(() => {
    setStatsLoading(true);
    fetchDashboardStats()
      .then((data) => { setStats(data); setStatsError(''); })
      .catch((err) => setStatsError(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not load dashboard statistics.'))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => { loadStats(); loadPendingCounts(); }, [loadStats, loadPendingCounts]);

  const studentsRes = useCrudResource(studentsApi);
  const institutionsRes = useCrudResource(institutionsApi);
  const employeesRes = useCrudResource(employeesApi);
  const programsRes = useCrudResource(programsApi);
  const enrollmentsRes = useCrudResource(enrollmentsApi);

  // ------------------------------------------------------------- routing
  const allItems = useMemo(() => MENU.flatMap((group) => group.items), []);

  const activeTab = useMemo(() => {
    const slug = location.pathname.replace('/admin', '').replace(/^\//, '').toLowerCase();
    const matched = allItems.find((item) => item.name.toLowerCase().replace(/\s+/g, '-') === slug);
    return matched ? matched.name : 'Dashboard';
  }, [location.pathname, allItems]);

  const handleTabChange = (name) => {
    const slug = name === 'Dashboard' ? 'dashboard' : name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/admin/${slug}`);
    setSearchTerm('');
  };

  const groups = useMemo(() => MENU.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      count: item.name === 'Institutions' ? pendingCounts.institution
        : item.name === 'Staff Access' ? pendingCounts.staff
        : item.name === 'Enrollments' ? (stats?.enrollments?.applied_pending || 0)
        : undefined,
    })),
  })), [pendingCounts, stats]);

  // ------------------------------------------------- institution editing
  const [institutionModal, setInstitutionModal] = useState(null); // { id | null, form }
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const saveInstitution = async () => {
    const { id, form } = institutionModal;
    setSaving(true);
    setFormError('');
    try {
      if (id) {
        await institutionsApi.update(id, form);
        showToast(`${form.name} updated.`);
      } else {
        await institutionsApi.create(form);
        showToast(`${form.name} added as a partner institution.`);
      }
      setInstitutionModal(null);
      institutionsRes.load();
    } catch (err) {
      setFormError(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not save this institution.');
    } finally {
      setSaving(false);
    }
  };

  const removeInstitution = async (institution) => {
    if (!window.confirm(`Remove ${institution.name}? Students already attached to it keep their records.`)) return;
    try {
      await institutionsApi.remove(institution.id);
      showToast(`${institution.name} removed.`);
      institutionsRes.load();
    } catch (err) {
      showToast(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not remove this institution.', 'error');
    }
  };

  // ----------------------------------------------------- program editing
  const [programModal, setProgramModal] = useState(null);

  const saveProgram = async () => {
    const { id, form } = programModal;
    setSaving(true);
    setFormError('');
    const payload = {
      ...form,
      duration_weeks: Number(form.duration_weeks) || 1,
      base_fee: Number(form.base_fee) || 0,
    };
    try {
      if (id) {
        await programsApi.update(id, payload);
        showToast(`${form.title} updated.`);
      } else {
        await programsApi.create(payload);
        showToast(`${form.title} created.`);
      }
      setProgramModal(null);
      programsRes.load();
      loadStats();
    } catch (err) {
      setFormError(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not save this program.');
    } finally {
      setSaving(false);
    }
  };

  const removeProgram = async (program) => {
    if (!window.confirm(`Delete "${program.title}"? This cannot be undone.`)) return;
    try {
      await programsApi.remove(program.id);
      showToast(`${program.title} deleted.`);
      programsRes.load();
      loadStats();
    } catch (err) {
      showToast(err instanceof ApiError && typeof err.message === 'string'
        ? err.message
        : 'Could not delete this program — it may still have enrollments attached.', 'error');
    }
  };

  // -------------------------------------------------- enrollment creation
  // Enrollment needs a batch (apps/core/models.py Enrollment), but batches
  // aren't a screen in this dashboard — so the dialog lists the chosen
  // program's existing batches and can create one inline when there is
  // none. The institution comes from the student's own record.
  const [enrollModal, setEnrollModal] = useState(null);
  const [programBatches, setProgramBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const openEnrollModal = (program) => {
    setEnrollModal({ ...EMPTY_ENROLLMENT, program: program?.id || '' });
    setFormError('');
  };

  useEffect(() => {
    const programId = enrollModal?.program;
    if (!programId) { setProgramBatches([]); return; }
    setBatchesLoading(true);
    batchesApi.list({ program: programId, page_size: 100 })
      .then((data) => setProgramBatches(data.results || []))
      .catch(() => setProgramBatches([]))
      .finally(() => setBatchesLoading(false));
  }, [enrollModal?.program]);

  const saveEnrollment = async () => {
    const form = enrollModal;
    setSaving(true);
    setFormError('');
    try {
      const student = studentsRes.items.find((s) => s.id === form.student);
      if (!student) throw new ApiError('VALIDATION_ERROR', 'Select a student to enroll.');
      if (!form.program) throw new ApiError('VALIDATION_ERROR', 'Select a program.');

      let batchId = form.batch;
      if (!batchId) {
        if (!form.newBatchName.trim() || !form.newBatchStart) {
          throw new ApiError('VALIDATION_ERROR',
            'Pick an existing batch, or name a new one and give it a start date.');
        }
        const batch = await batchesApi.create({
          name: form.newBatchName.trim(),
          program: form.program,
          institution: student.institution,
          start_date: form.newBatchStart,
          status: 'ACTIVE',
        });
        batchId = batch.id;
      }

      await enrollmentsApi.create({
        student: student.id,
        program: form.program,
        batch: batchId,
        institution: student.institution,
        status: 'ACTIVE',
        coordinator_approval: true,
      });

      showToast(`${student.user_details?.full_name || 'Student'} enrolled.`);
      setEnrollModal(null);
      enrollmentsRes.load();
      programsRes.load();
      loadStats();
    } catch (err) {
      setFormError(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not create this enrollment.');
    } finally {
      setSaving(false);
    }
  };

  const approveEnrollment = async (enrollment) => {
    try {
      await enrollmentsApi.update(enrollment.id, { status: 'ACTIVE', coordinator_approval: true });
      showToast(`${enrollment.student_name}'s enrollment approved.`);
      enrollmentsRes.load();
      loadStats();
    } catch (err) {
      showToast(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not approve this enrollment.', 'error');
    }
  };

  const removeEnrollment = async (enrollment) => {
    if (!window.confirm(`Remove ${enrollment.student_name} from ${enrollment.program_title}?`)) return;
    try {
      await enrollmentsApi.remove(enrollment.id);
      showToast('Enrollment removed.');
      enrollmentsRes.load();
      programsRes.load();
      loadStats();
    } catch (err) {
      showToast(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not remove this enrollment.', 'error');
    }
  };

  // ----------------------------------------------------------- filtering
  const term = searchTerm.trim().toLowerCase();

  const filteredStudents = useMemo(() => {
    if (!term) return studentsRes.items;
    return studentsRes.items.filter((s) =>
      (s.user_details?.full_name || '').toLowerCase().includes(term)
      || (s.user_details?.email || '').toLowerCase().includes(term)
      || (s.business_id || '').toLowerCase().includes(term)
      || (s.usn || '').toLowerCase().includes(term)
      || (s.institution_name || '').toLowerCase().includes(term)
      || (s.degree || '').toLowerCase().includes(term));
  }, [studentsRes.items, term]);

  const filteredInstitutions = useMemo(() => {
    if (!term) return institutionsRes.items;
    return institutionsRes.items.filter((i) =>
      (i.name || '').toLowerCase().includes(term)
      || (i.code || '').toLowerCase().includes(term)
      || (i.city || '').toLowerCase().includes(term));
  }, [institutionsRes.items, term]);

  const filteredEmployees = useMemo(() => {
    if (!term) return employeesRes.items;
    return employeesRes.items.filter((e) =>
      (e.user_details?.full_name || '').toLowerCase().includes(term)
      || (e.employee_id || '').toLowerCase().includes(term)
      || (e.designation || '').toLowerCase().includes(term));
  }, [employeesRes.items, term]);

  const filteredPrograms = useMemo(() => {
    if (!term) return programsRes.items;
    return programsRes.items.filter((p) =>
      (p.title || '').toLowerCase().includes(term)
      || (p.code || '').toLowerCase().includes(term)
      || (p.program_type || '').toLowerCase().includes(term));
  }, [programsRes.items, term]);

  const filteredEnrollments = useMemo(() => {
    if (!term) return enrollmentsRes.items;
    return enrollmentsRes.items.filter((e) =>
      (e.student_name || '').toLowerCase().includes(term)
      || (e.business_id || '').toLowerCase().includes(term)
      || (e.program_title || '').toLowerCase().includes(term)
      || (e.batch_name || '').toLowerCase().includes(term));
  }, [enrollmentsRes.items, term]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const searchable = activeTab !== 'Dashboard';

  return (
    <DashboardShell
      title="Admin Console"
      subtitle="Gnana Computech Solutions"
      groups={groups}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      user={user}
      onLogout={handleLogout}
      toast={toast}
      switchConsole={{ to: '/staff/dashboard', label: 'Open staff console' }}
      search={searchable ? {
        value: searchTerm,
        onChange: setSearchTerm,
        placeholder: `Search ${activeTab.toLowerCase()}…`,
      } : null}
    >
      {/* ----------------------------------------------------- DASHBOARD */}
      {activeTab === 'Dashboard' && (
        <div className="space-y-6">
          <AsyncState loading={statsLoading} error={statsError} onRetry={loadStats}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile
                label="Students" icon={Users} tone="gold"
                value={stats?.students?.total ?? 0}
                hint={`${stats?.students?.active ?? 0} active`}
              />
              <StatTile
                label="Enrollments" icon={UserPlus} tone="green"
                value={stats?.enrollments?.total ?? 0}
                hint={`${stats?.enrollments?.active ?? 0} active · ${stats?.enrollments?.completed ?? 0} completed`}
              />
              <StatTile
                label="Programs" icon={BookOpen} tone="blue"
                value={stats?.programs?.total ?? 0}
                hint="Courses, internships & projects"
              />
              <StatTile
                label="Institutions" icon={Building2} tone="gray"
                value={stats?.institutions?.total ?? 0}
                hint="Partner colleges"
              />
            </div>
          </AsyncState>

          <SectionCard
            title="Waiting on you"
            description="Sign-ups and applications that cannot proceed until someone decides."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleTabChange('Staff Access')}
                className="text-left rounded-2xl border border-gray-800 bg-[#17181A] p-4 hover:border-[#D4A72C] transition-colors"
              >
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Staff sign-ups</span>
                <p className="text-2xl font-extrabold text-white mt-1">{pendingCounts.staff}</p>
                <span className="text-[11px] text-[#D4A72C] font-bold">Review staff access →</span>
              </button>
              <button
                onClick={() => handleTabChange('Institutions')}
                className="text-left rounded-2xl border border-gray-800 bg-[#17181A] p-4 hover:border-[#D4A72C] transition-colors"
              >
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Institution requests</span>
                <p className="text-2xl font-extrabold text-white mt-1">{pendingCounts.institution}</p>
                <span className="text-[11px] text-[#D4A72C] font-bold">Review partnerships →</span>
              </button>
              <button
                onClick={() => handleTabChange('Enrollments')}
                className="text-left rounded-2xl border border-gray-800 bg-[#17181A] p-4 hover:border-[#D4A72C] transition-colors"
              >
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Enrollment applications</span>
                <p className="text-2xl font-extrabold text-white mt-1">{stats?.enrollments?.applied_pending ?? 0}</p>
                <span className="text-[11px] text-[#D4A72C] font-bold">Review enrollments →</span>
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <ApprovalNote />
              <span className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-600" />
                Student sign-ups are reviewed by staff in the staff dashboard.
              </span>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ------------------------------------------------------ STUDENTS */}
      {activeTab === 'Students' && (
        <SectionCard
          title={`All students (${filteredStudents.length})`}
          description="Read-only register. Student sign-ups are approved by staff; enrolments are managed under Programs."
        >
          <AsyncState
            loading={studentsRes.loading}
            error={studentsRes.error}
            isEmpty={filteredStudents.length === 0}
            onRetry={studentsRes.load}
            emptyMessage={term ? 'No students match your search.' : 'No students on record yet.'}
          >
            <TableWrap headers={['Student', 'ID / USN', 'College', 'Course', 'Enrollments', 'Status']}>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="text-gray-300 hover:bg-[#17181A]/60">
                  <td className="py-3 pr-4">
                    <span className="font-bold text-white block">{student.user_details?.full_name}</span>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {student.user_details?.email}
                    </span>
                    {student.user_details?.phone && (
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {student.user_details.phone}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-mono text-[11px] text-[#D4A72C] block">{student.business_id}</span>
                    <span className="text-[11px] text-gray-500">{student.usn || '—'}</span>
                  </td>
                  <td className="py-3 pr-4 text-[11px]">{student.institution_name || '—'}</td>
                  <td className="py-3 pr-4 text-[11px]">
                    {[student.degree, student.semester ? `Sem ${student.semester}` : null]
                      .filter(Boolean).join(' • ') || '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={(student.enrollments || []).length ? 'green' : 'gray'}>
                      {(student.enrollments || []).length}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={student.user_details?.is_active ? 'green' : 'amber'}>
                      {student.user_details?.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </TableWrap>
          </AsyncState>
        </SectionCard>
      )}

      {/* -------------------------------------------------- INSTITUTIONS */}
      {activeTab === 'Institutions' && (
        <div className="space-y-6">
          <SignupQueue
            kind="INSTITUTION"
            title="Institution partnership requests"
            description="Colleges that signed up for a coordinator account. Approving creates the institution and makes the applicant its coordinator."
            showToast={showToast}
            onDecided={() => { loadPendingCounts(); institutionsRes.load(); loadStats(); }}
          />

          <SectionCard
            title={`Partner institutions (${filteredInstitutions.length})`}
            actions={
              <IconButton
                tone="gold" icon={Plus}
                onClick={() => { setInstitutionModal({ id: null, form: { ...EMPTY_INSTITUTION } }); setFormError(''); }}
              >
                Add institution
              </IconButton>
            }
          >
            <AsyncState
              loading={institutionsRes.loading}
              error={institutionsRes.error}
              isEmpty={filteredInstitutions.length === 0}
              onRetry={institutionsRes.load}
              emptyMessage={term ? 'No institutions match your search.' : 'No partner institutions yet.'}
            >
              <TableWrap headers={['Institution', 'Code', 'City', 'Contact', 'Coordinator', 'Actions']}>
                {filteredInstitutions.map((institution) => (
                  <tr key={institution.id} className="text-gray-300 hover:bg-[#17181A]/60">
                    <td className="py-3 pr-4 font-bold text-white">{institution.name}</td>
                    <td className="py-3 pr-4 font-mono text-[11px] text-[#D4A72C]">{institution.code}</td>
                    <td className="py-3 pr-4 text-[11px]">{institution.city || '—'}</td>
                    <td className="py-3 pr-4 text-[11px]">
                      <span className="block">{institution.contact_email || '—'}</span>
                      <span className="text-gray-500">{institution.contact_phone || ''}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={institution.coordinator ? 'green' : 'gray'}>
                        {institution.coordinator ? 'Linked' : 'None'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <IconButton
                          tone="gray" icon={Edit} title={`Edit ${institution.name}`}
                          onClick={() => {
                            setInstitutionModal({
                              id: institution.id,
                              form: {
                                code: institution.code || '', name: institution.name || '',
                                city: institution.city || '', state: institution.state || 'Karnataka',
                                contact_email: institution.contact_email || '',
                                contact_phone: institution.contact_phone || '',
                                address: institution.address || '',
                              },
                            });
                            setFormError('');
                          }}
                        />
                        <IconButton
                          tone="red" icon={Trash2} title={`Remove ${institution.name}`}
                          onClick={() => removeInstitution(institution)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </TableWrap>
            </AsyncState>
          </SectionCard>
        </div>
      )}

      {/* --------------------------------------------------- STAFF ACCESS */}
      {activeTab === 'Staff Access' && (
        <div className="space-y-6">
          <SignupQueue
            kind="STAFF"
            title="Staff sign-up requests"
            description="People who registered on the staff sign-up page. Approving grants the ERP role you select and creates their employee record."
            showToast={showToast}
            allowRoleOverride
            onDecided={() => { loadPendingCounts(); employeesRes.load(); }}
          />

          <SectionCard
            title={`Staff with access (${filteredEmployees.length})`}
            description="Everyone who currently holds an employee record."
          >
            <AsyncState
              loading={employeesRes.loading}
              error={employeesRes.error}
              isEmpty={filteredEmployees.length === 0}
              onRetry={employeesRes.load}
              emptyMessage={term ? 'No staff match your search.' : 'No staff records yet.'}
            >
              <TableWrap headers={['Name', 'Employee ID', 'Designation', 'Roles', 'Department', 'Status']}>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="text-gray-300 hover:bg-[#17181A]/60">
                    <td className="py-3 pr-4">
                      <span className="font-bold text-white block">{employee.user_details?.full_name}</span>
                      <span className="text-[11px] text-gray-500">{employee.user_details?.email}</span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[11px] text-[#D4A72C]">{employee.employee_id}</td>
                    <td className="py-3 pr-4 text-[11px]">{employee.designation}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {(employee.user_details?.roles || []).map((role) => (
                          <Badge key={role} tone="blue">{role.replace(/_/g, ' ')}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-[11px]">{employee.department_name || '—'}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={employee.user_details?.is_active ? 'green' : 'amber'}>
                        {employee.user_details?.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </TableWrap>
            </AsyncState>
          </SectionCard>
        </div>
      )}

      {/* ------------------------------------------------------ PROGRAMS */}
      {activeTab === 'Programs' && (
        <SectionCard
          title={`Programs (${filteredPrograms.length})`}
          description="Enrolment numbers are live. Use “Enroll” to add students to a specific program."
          actions={
            <>
              <IconButton tone="gray" icon={UserPlus} onClick={() => openEnrollModal(null)}>
                Enroll a student
              </IconButton>
              <IconButton
                tone="gold" icon={Plus}
                onClick={() => { setProgramModal({ id: null, form: { ...EMPTY_PROGRAM } }); setFormError(''); }}
              >
                New program
              </IconButton>
            </>
          }
        >
          <AsyncState
            loading={programsRes.loading}
            error={programsRes.error}
            isEmpty={filteredPrograms.length === 0}
            onRetry={programsRes.load}
            emptyMessage={term ? 'No programs match your search.' : 'No programs defined yet.'}
          >
            <TableWrap headers={['Program', 'Type', 'Duration', 'Fee', 'Enrolled', 'Published', 'Actions']}>
              {filteredPrograms.map((program) => (
                <tr key={program.id} className="text-gray-300 hover:bg-[#17181A]/60">
                  <td className="py-3 pr-4">
                    <span className="font-bold text-white block">{program.title}</span>
                    <span className="font-mono text-[11px] text-[#D4A72C]">{program.code}</span>
                  </td>
                  <td className="py-3 pr-4 text-[11px]">{program.program_type?.replace(/_/g, ' ')}</td>
                  <td className="py-3 pr-4 text-[11px] whitespace-nowrap">{program.duration_weeks} wks</td>
                  <td className="py-3 pr-4 text-[11px] whitespace-nowrap">
                    ₹{Number(program.base_fee || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <Badge tone={program.enrollment_count ? 'green' : 'gray'}>
                        {program.enrollment_count ?? 0} total
                      </Badge>
                      <span className="text-[11px] text-gray-500">
                        {program.active_enrollment_count ?? 0} active
                      </span>
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={program.is_published ? 'green' : 'amber'}>
                      {program.is_published ? 'Live' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      <IconButton
                        tone="green" icon={UserPlus} title={`Enroll a student in ${program.title}`}
                        onClick={() => openEnrollModal(program)}
                      />
                      <IconButton
                        tone="gray" icon={Edit} title={`Edit ${program.title}`}
                        onClick={() => {
                          setProgramModal({
                            id: program.id,
                            form: {
                              code: program.code || '', title: program.title || '',
                              program_type: program.program_type || 'COURSE',
                              description: program.description || '',
                              duration_weeks: program.duration_weeks ?? 4,
                              base_fee: program.base_fee ?? 0,
                              is_published: !!program.is_published,
                            },
                          });
                          setFormError('');
                        }}
                      />
                      <IconButton
                        tone="red" icon={Trash2} title={`Delete ${program.title}`}
                        onClick={() => removeProgram(program)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </TableWrap>
          </AsyncState>
        </SectionCard>
      )}

      {/* --------------------------------------------------- ENROLLMENTS */}
      {activeTab === 'Enrollments' && (
        <SectionCard
          title={`Enrollments (${filteredEnrollments.length})`}
          description="Every student–program link. Applications stay pending until approved."
          actions={
            <IconButton tone="gold" icon={Plus} onClick={() => openEnrollModal(null)}>
              Add enrollment
            </IconButton>
          }
        >
          <AsyncState
            loading={enrollmentsRes.loading}
            error={enrollmentsRes.error}
            isEmpty={filteredEnrollments.length === 0}
            onRetry={enrollmentsRes.load}
            emptyMessage={term ? 'No enrollments match your search.' : 'No enrollments recorded yet.'}
          >
            <TableWrap headers={['Enrollment', 'Student', 'Program', 'Batch', 'Status', 'Approved', 'Actions']}>
              {filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.id} className="text-gray-300 hover:bg-[#17181A]/60">
                  <td className="py-3 pr-4 font-mono text-[11px] text-[#D4A72C]">{enrollment.business_id}</td>
                  <td className="py-3 pr-4">
                    <span className="font-bold text-white block">{enrollment.student_name}</span>
                    <span className="text-[11px] text-gray-500">{enrollment.institution_name}</span>
                  </td>
                  <td className="py-3 pr-4 text-[11px]">{enrollment.program_title}</td>
                  <td className="py-3 pr-4 text-[11px]">{enrollment.batch_name}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={statusTone(enrollment.status)}>{enrollment.status}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={enrollment.coordinator_approval ? 'green' : 'amber'}>
                      {enrollment.coordinator_approval ? 'Yes' : 'Pending'}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      {!enrollment.coordinator_approval && (
                        <IconButton
                          tone="green" icon={Check} title="Approve this enrollment"
                          onClick={() => approveEnrollment(enrollment)}
                        >
                          Approve
                        </IconButton>
                      )}
                      <IconButton
                        tone="red" icon={Trash2} title="Remove this enrollment"
                        onClick={() => removeEnrollment(enrollment)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </TableWrap>
          </AsyncState>
        </SectionCard>
      )}

      {/* ------------------------------------------------- MODAL: INSTITUTION */}
      <ModalShell
        isOpen={!!institutionModal}
        onClose={() => setInstitutionModal(null)}
        icon={Building2}
        title={institutionModal?.id ? 'Edit institution' : 'Add institution'}
        footer={
          <>
            <IconButton tone="gray" onClick={() => setInstitutionModal(null)}>Cancel</IconButton>
            <IconButton tone="gold" icon={Check} disabled={saving} onClick={saveInstitution}>
              {saving ? 'Saving…' : 'Save institution'}
            </IconButton>
          </>
        }
      >
        {institutionModal && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name *">
                <input
                  className={INPUT_CLASS}
                  value={institutionModal.form.name}
                  onChange={(e) => setInstitutionModal((m) => ({ ...m, form: { ...m.form, name: e.target.value } }))}
                  placeholder="Soundarya Institute of Management"
                />
              </Field>
              <Field label="Code *" hint="Short unique identifier, e.g. SIMS">
                <input
                  className={INPUT_CLASS}
                  value={institutionModal.form.code}
                  onChange={(e) => setInstitutionModal((m) => ({ ...m, form: { ...m.form, code: e.target.value.toUpperCase() } }))}
                  placeholder="SIMS"
                />
              </Field>
              <Field label="City">
                <input
                  className={INPUT_CLASS}
                  value={institutionModal.form.city}
                  onChange={(e) => setInstitutionModal((m) => ({ ...m, form: { ...m.form, city: e.target.value } }))}
                />
              </Field>
              <Field label="State">
                <input
                  className={INPUT_CLASS}
                  value={institutionModal.form.state}
                  onChange={(e) => setInstitutionModal((m) => ({ ...m, form: { ...m.form, state: e.target.value } }))}
                />
              </Field>
              <Field label="Contact email">
                <input
                  type="email"
                  className={INPUT_CLASS}
                  value={institutionModal.form.contact_email}
                  onChange={(e) => setInstitutionModal((m) => ({ ...m, form: { ...m.form, contact_email: e.target.value } }))}
                />
              </Field>
              <Field label="Contact phone">
                <input
                  className={INPUT_CLASS}
                  value={institutionModal.form.contact_phone}
                  onChange={(e) => setInstitutionModal((m) => ({ ...m, form: { ...m.form, contact_phone: e.target.value } }))}
                />
              </Field>
            </div>
            <Field label="Address">
              <textarea
                rows={2}
                className={`${INPUT_CLASS} resize-none`}
                value={institutionModal.form.address}
                onChange={(e) => setInstitutionModal((m) => ({ ...m, form: { ...m.form, address: e.target.value } }))}
              />
            </Field>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
          </>
        )}
      </ModalShell>

      {/* ----------------------------------------------------- MODAL: PROGRAM */}
      <ModalShell
        isOpen={!!programModal}
        onClose={() => setProgramModal(null)}
        icon={BookOpen}
        title={programModal?.id ? 'Edit program' : 'New program'}
        footer={
          <>
            <IconButton tone="gray" onClick={() => setProgramModal(null)}>Cancel</IconButton>
            <IconButton tone="gold" icon={Check} disabled={saving} onClick={saveProgram}>
              {saving ? 'Saving…' : 'Save program'}
            </IconButton>
          </>
        }
      >
        {programModal && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Title *">
                <input
                  className={INPUT_CLASS}
                  value={programModal.form.title}
                  onChange={(e) => setProgramModal((m) => ({ ...m, form: { ...m.form, title: e.target.value } }))}
                />
              </Field>
              <Field label="Code *" hint="Unique, e.g. CRS-FULLSTACK-WEB">
                <input
                  className={INPUT_CLASS}
                  value={programModal.form.code}
                  onChange={(e) => setProgramModal((m) => ({ ...m, form: { ...m.form, code: e.target.value.toUpperCase() } }))}
                />
              </Field>
              <Field label="Type">
                <select
                  className={INPUT_CLASS}
                  value={programModal.form.program_type}
                  onChange={(e) => setProgramModal((m) => ({ ...m, form: { ...m.form, program_type: e.target.value } }))}
                >
                  {PROGRAM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Duration (weeks)">
                <input
                  type="number" min="1"
                  className={INPUT_CLASS}
                  value={programModal.form.duration_weeks}
                  onChange={(e) => setProgramModal((m) => ({ ...m, form: { ...m.form, duration_weeks: e.target.value } }))}
                />
              </Field>
              <Field label="Base fee (₹)">
                <input
                  type="number" min="0"
                  className={INPUT_CLASS}
                  value={programModal.form.base_fee}
                  onChange={(e) => setProgramModal((m) => ({ ...m, form: { ...m.form, base_fee: e.target.value } }))}
                />
              </Field>
              <Field label="Visible on the public site">
                <select
                  className={INPUT_CLASS}
                  value={programModal.form.is_published ? 'yes' : 'no'}
                  onChange={(e) => setProgramModal((m) => ({ ...m, form: { ...m.form, is_published: e.target.value === 'yes' } }))}
                >
                  <option value="yes">Published</option>
                  <option value="no">Draft (hidden)</option>
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea
                rows={4}
                className={`${INPUT_CLASS} resize-none`}
                value={programModal.form.description}
                onChange={(e) => setProgramModal((m) => ({ ...m, form: { ...m.form, description: e.target.value } }))}
              />
            </Field>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
          </>
        )}
      </ModalShell>

      {/* -------------------------------------------------- MODAL: ENROLLMENT */}
      <ModalShell
        isOpen={!!enrollModal}
        onClose={() => setEnrollModal(null)}
        icon={GraduationCap}
        title="Add an enrollment"
        footer={
          <>
            <IconButton tone="gray" onClick={() => setEnrollModal(null)}>Cancel</IconButton>
            <IconButton tone="gold" icon={Check} disabled={saving} onClick={saveEnrollment}>
              {saving ? 'Enrolling…' : 'Enroll student'}
            </IconButton>
          </>
        }
      >
        {enrollModal && (
          <>
            <Field label="Program *">
              <select
                className={INPUT_CLASS}
                value={enrollModal.program}
                onChange={(e) => setEnrollModal((m) => ({ ...m, program: e.target.value, batch: '' }))}
              >
                <option value="">Select a program…</option>
                {programsRes.items.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title} ({program.enrollment_count ?? 0} enrolled)
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Student *" hint="The student's own college is used as the enrolling institution.">
              <select
                className={INPUT_CLASS}
                value={enrollModal.student}
                onChange={(e) => setEnrollModal((m) => ({ ...m, student: e.target.value }))}
              >
                <option value="">Select a student…</option>
                {studentsRes.items.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.user_details?.full_name} — {student.institution_name || 'No college'}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Batch"
              hint={batchesLoading
                ? 'Loading batches…'
                : programBatches.length
                  ? 'Pick the batch this student joins.'
                  : 'This program has no batches yet — name one below and it will be created.'}
            >
              <select
                className={INPUT_CLASS}
                value={enrollModal.batch}
                onChange={(e) => setEnrollModal((m) => ({ ...m, batch: e.target.value }))}
                disabled={!enrollModal.program || batchesLoading}
              >
                <option value="">
                  {programBatches.length ? 'Create a new batch instead…' : 'No existing batch'}
                </option>
                {programBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} — {batch.status}
                  </option>
                ))}
              </select>
            </Field>

            {!enrollModal.batch && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="New batch name">
                  <input
                    className={INPUT_CLASS}
                    value={enrollModal.newBatchName}
                    onChange={(e) => setEnrollModal((m) => ({ ...m, newBatchName: e.target.value }))}
                    placeholder="BCA-2026-B1"
                  />
                </Field>
                <Field label="Start date">
                  <input
                    type="date"
                    className={INPUT_CLASS}
                    value={enrollModal.newBatchStart}
                    onChange={(e) => setEnrollModal((m) => ({ ...m, newBatchStart: e.target.value }))}
                  />
                </Field>
              </div>
            )}

            {formError && <p className="text-xs text-red-400">{formError}</p>}
          </>
        )}
      </ModalShell>
    </DashboardShell>
  );
};
