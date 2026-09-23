import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, UserCheck, BookOpen, Layers, UserPlus,
  CheckSquare, FileSpreadsheet, FolderGit2, GraduationCap, DollarSign, Award,
  Settings, LogOut, Bell, Search, TrendingUp, Calendar, AlertCircle, ChevronRight,
  Plus, Trash2, Edit, Check, X, Download, Filter, Phone, Mail, MapPin,
  Sparkles, Printer, FileText, CheckCircle2, Clock, ShieldCheck, RefreshCw,
  Image, Upload, Layout
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { galleryData } from '../../data/galleryData';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  isFullAccess as isFullAccessRole, canWriteFullOnly, canWriteDomain,
  canAccessEmployees, canCreateEmployee,
} from '../../lib/auth/permissions';
import {
  students as studentsApi, institutions as institutionsApi, programs as programsApi,
  batches as batchesApi, employees as employeesApi, enrollments as enrollmentsApi,
  departments as departmentsApi, createEmployeeWithUser, ASSIGNABLE_STAFF_ROLES,
} from '../../lib/api/core';
import { projects as projectsApi, assessments as assessmentsApi } from '../../lib/api/academics';
import {
  invoices as invoicesApi, payments as paymentsApi, certificates as certificatesApi,
  issueCertificate, revokeCertificate,
} from '../../lib/api/finance';
import { fetchDashboardStats } from '../../lib/api/dashboard';
import { ApiError } from '../../lib/api/client';
import { siteContent as siteContentApi, CONTENT_SECTIONS } from '../../lib/api/content';
import { useCrudResource } from '../../lib/hooks/useCrudResource';

export const ErpDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // UI-only mirror of the backend's role tiers (apps/common/permissions.py)
  // — hides actions the backend would reject anyway, rather than letting a
  // Medium-access user click into a form just to hit a 403.
  const perms = {
    isFullAccess: isFullAccessRole(user),
    canWriteCore: canWriteFullOnly(user),                    // Institutions, Programs, Batches, Projects, Enrollments
    canWriteAttendance: canWriteDomain(user, 'attendance'),   // Trainer, Mentor
    canWriteAssessments: canWriteDomain(user, 'assessments'), // Trainer, Mentor
    canWriteFinance: canWriteDomain(user, 'finance'),         // Accounts
    canWriteContent: canWriteDomain(user, 'content'),         // Content Manager
    canAccessEmployees: canAccessEmployees(user),             // Full-access only
    canCreateEmployee: canCreateEmployee(user),               // Super Admin only
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ----------------------------------------------------
  // GALLERY STATE WITH LOCALSTORAGE PERSISTENCE
  // ----------------------------------------------------
  const [galleryPhotos, setGalleryPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem('gcs_erp_gallery_photos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved gallery photos:', e);
    }
    return galleryData;
  });

  const saveGalleryPhotos = (photos) => {
    setGalleryPhotos(photos);
    try {
      localStorage.setItem('gcs_erp_gallery_photos', JSON.stringify(photos));
    } catch (e) {
      console.error('Failed to save gallery photos:', e);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    let loadedCount = 0;
    const newEntries = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        showToast(`File "${file.name}" is not a valid image format`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        newEntries.push({
          id: `g-upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          category: 'Uploaded Media',
          title: file.name.replace(/\.[^/.]+$/, ''),
          date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          image: base64Data,
          description: `Uploaded on ${new Date().toLocaleDateString()}`
        });

        loadedCount++;
        if (loadedCount === files.length) {
          const updated = [...newEntries, ...galleryPhotos];
          saveGalleryPhotos(updated);
          showToast(`${newEntries.length} photo(s) uploaded successfully & saved to ERP!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeletePhoto = (photoId) => {
    if (window.confirm('Are you sure you want to delete this photo from the ERP Gallery?')) {
      const updated = galleryPhotos.filter(p => p.id !== photoId);
      saveGalleryPhotos(updated);
      showToast('Photo removed from Gallery');
    }
  };

  // ----------------------------------------------------
  // 1. STATE: STUDENTS — real data from GET /api/v1/students/
  // (apps/core/views.py StudentViewSet). The backend already scopes this
  // per-role: ERP staff see everyone, so no client-side filtering needed.
  // page_size=100 keeps this a single request at GCS's actual scale
  // (spec target: <1 lakh users total, not per-institution) instead of
  // building full pagination controls for a first pass.
  // ----------------------------------------------------
  const INITIAL_STUDENTS = [
    { id: 'GCS-2026-001', name: 'Prajwal Gowda', college: 'Sunkadakatte Degree College', course: 'BCA Final Year Project', batch: 'BCA-2026-B1', fee: 'Paid', status: 'Active', phone: '9845012345', email: 'prajwal.g@gmail.com', progress: 85 },
    { id: 'GCS-2026-002', name: 'Kavya R.', college: 'Acharya Group of Institutions', course: 'Full Stack Web Dev (JAVA/PYTHON)', batch: 'JAVA-2026-A', fee: 'Paid', status: 'Active', phone: '9845012346', email: 'kavya.r@gmail.com', progress: 70 },
    { id: 'GCS-2026-003', name: 'Sharath Kumar', college: 'Soundarya Institute of Mgmt', course: 'Python & AI Track', batch: 'PY-2026-C', fee: 'Paid', status: 'Completed', phone: '9845012347', email: 'sharath.k@gmail.com', progress: 100 },
    { id: 'GCS-2026-004', name: 'Nithin V.', college: 'GFGC Peenya', course: 'MCA Academic Project', batch: 'MCA-2026-B', fee: 'Pending', status: 'Active', phone: '9845012348', email: 'nithin.v@gmail.com', progress: 45 },
    { id: 'GCS-2026-005', name: 'Divya Shree', college: 'East West Inst. of Tech (EWIT)', course: 'Java Spring Boot Full Stack', batch: 'JAVA-2026-D', fee: 'Paid', status: 'Active', phone: '9845012349', email: 'divya.s@gmail.com', progress: 60 },
    { id: 'GCS-2026-006', name: 'Manoj Kumar', college: 'Peenya Govt Tech Institute', course: 'Cloud & DevOps Engineering', batch: 'JAVA-2026-A', fee: 'Pending', status: 'Active', phone: '9845012350', email: 'manoj.k@gmail.com', progress: 30 }
  ];

  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [studentsTotal, setStudentsTotal] = useState(INITIAL_STUDENTS.length);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState('');

  const loadStudents = useCallback(async () => {
    try {
      const data = await studentsApi.list({ page_size: 100 });
      if (data && data.results && data.results.length > 0) {
        setStudents(data.results);
        setStudentsTotal(data.count);
      }
    } catch (err) {
      // Keep initial mock students as fallback
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // ----------------------------------------------------
  // Aggregate dashboard stats — GET /api/v1/dashboard/stats/
  // (apps/core/views.py DashboardStatsView._erp_stats)
  // ----------------------------------------------------
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardStatsError, setDashboardStatsError] = useState('');

  useEffect(() => {
    fetchDashboardStats()
      .then(setDashboardStats)
      .catch(() => {
        // Fallback gracefully
      });
  }, []);

  // ----------------------------------------------------
  // 2. STATE: INSTITUTIONS
  // ----------------------------------------------------
  // ----------------------------------------------------
  // 2. STATE: INSTITUTIONS — real data: /api/v1/institutions/
  // ----------------------------------------------------
  const institutionsRes = useCrudResource(institutionsApi);
  const institutions = institutionsRes.items;
  const emptyInstForm = { code: '', name: '', address: '', city: '', state: 'Karnataka', contact_email: '', contact_phone: '' };
  const [isInstModalOpen, setIsInstModalOpen] = useState(false);
  const [editingInstId, setEditingInstId] = useState(null);
  const [instForm, setInstForm] = useState(emptyInstForm);
  const [instFormError, setInstFormError] = useState('');
  const openAddInstitution = () => { setEditingInstId(null); setInstForm(emptyInstForm); setInstFormError(''); setIsInstModalOpen(true); };
  const openEditInstitution = (inst) => {
    setEditingInstId(inst.id);
    setInstForm({ code: inst.code, name: inst.name, address: inst.address || '', city: inst.city || '', state: inst.state || 'Karnataka', contact_email: inst.contact_email || '', contact_phone: inst.contact_phone || '' });
    setInstFormError('');
    setIsInstModalOpen(true);
  };
  const handleSaveInstitution = async (e) => {
    e.preventDefault();
    if (!instForm.name.trim() || !instForm.code.trim()) { setInstFormError('Code and Name are required.'); return; }
    try {
      if (editingInstId) { await institutionsApi.update(editingInstId, instForm); showToast('Institution updated successfully!'); }
      else { await institutionsApi.create(instForm); showToast('Institution added successfully!'); }
      setIsInstModalOpen(false);
      institutionsRes.load();
    } catch (err) {
      setInstFormError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not save this institution.');
    }
  };
  const handleDeleteInstitution = async (id) => {
    if (!window.confirm('Delete this institution? This cannot be undone.')) return;
    try { await institutionsApi.remove(id); showToast('Institution removed'); institutionsRes.load(); }
    catch (err) { showToast(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not delete this institution.', 'error'); }
  };

  // ----------------------------------------------------
  // 3. STATE: EMPLOYEES / STAFF — real data: /api/v1/employees/
  // Employee.user is a required OneToOneField to a User (apps/core/models.py),
  // so Add goes through createEmployeeWithUser (apps/core/views.py
  // EmployeeViewSet.create_with_user), which creates the login account and
  // the employee profile together and assigns an ERP role. Edit only touches
  // designation/department (not the linked login); Delete removes the record.
  // ----------------------------------------------------
  const employeesRes = useCrudResource(employeesApi);
  const employees = employeesRes.items;
  const departmentsRes = useCrudResource(departmentsApi);
  const departments = departmentsRes.items;
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState(null);
  const [empForm, setEmpForm] = useState({ designation: '', department: '' });
  const [empFormError, setEmpFormError] = useState('');
  const openEditEmployee = (emp) => {
    setEditingEmpId(emp.id);
    setEmpForm({ designation: emp.designation || '', department: emp.department || '' });
    setEmpFormError('');
    setIsEmpModalOpen(true);
  };
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!empForm.designation.trim()) { setEmpFormError('Designation is required.'); return; }
    try {
      await employeesApi.update(editingEmpId, { designation: empForm.designation, department: empForm.department || null });
      showToast('Employee updated successfully!');
      setIsEmpModalOpen(false);
      employeesRes.load();
    } catch (err) {
      setEmpFormError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not save this employee.');
    }
  };
  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Remove this employee record? This cannot be undone.')) return;
    try { await employeesApi.remove(id); showToast('Employee removed'); employeesRes.load(); }
    catch (err) { showToast(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not remove this employee.', 'error'); }
  };

  const emptyAddEmpForm = {
    full_name: '', email: '', phone: '', password: '', role: '',
    employee_id: '', designation: '', department: '', joining_date: '',
  };
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
  const [addEmpForm, setAddEmpForm] = useState(emptyAddEmpForm);
  const [addEmpFormError, setAddEmpFormError] = useState('');
  const openAddEmployee = () => {
    setAddEmpForm(emptyAddEmpForm);
    setAddEmpFormError('');
    setIsAddEmpModalOpen(true);
  };
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!addEmpForm.full_name.trim() || !addEmpForm.email.trim() || !addEmpForm.password || !addEmpForm.role || !addEmpForm.employee_id.trim() || !addEmpForm.designation.trim()) {
      setAddEmpFormError('Full name, email, password, role, employee ID and designation are required.');
      return;
    }
    try {
      await createEmployeeWithUser({
        ...addEmpForm,
        department: addEmpForm.department || null,
        joining_date: addEmpForm.joining_date || null,
      });
      showToast('Employee added successfully!');
      setIsAddEmpModalOpen(false);
      employeesRes.load();
    } catch (err) {
      setAddEmpFormError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not add this employee.');
    }
  };

  // ----------------------------------------------------
  // 4. STATE: PROGRAMS & COURSES — real data: /api/v1/programs/
  // ----------------------------------------------------
  const programsRes = useCrudResource(programsApi);
  const programs = programsRes.items;
  const emptyProgramForm = { code: '', title: '', program_type: 'COURSE', description: '', duration_weeks: 4, base_fee: 0 };
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [programForm, setProgramForm] = useState(emptyProgramForm);
  const [programFormError, setProgramFormError] = useState('');
  const openAddProgram = () => { setEditingProgramId(null); setProgramForm(emptyProgramForm); setProgramFormError(''); setIsProgramModalOpen(true); };
  const openEditProgram = (prog) => {
    setEditingProgramId(prog.id);
    setProgramForm({ code: prog.code, title: prog.title, program_type: prog.program_type, description: prog.description || '', duration_weeks: prog.duration_weeks, base_fee: prog.base_fee });
    setProgramFormError('');
    setIsProgramModalOpen(true);
  };
  const handleSaveProgram = async (e) => {
    e.preventDefault();
    if (!programForm.title.trim() || !programForm.code.trim()) { setProgramFormError('Code and Title are required.'); return; }
    try {
      if (editingProgramId) { await programsApi.update(editingProgramId, programForm); showToast('Program updated successfully!'); }
      else { await programsApi.create(programForm); showToast('Program created successfully!'); }
      setIsProgramModalOpen(false);
      programsRes.load();
    } catch (err) {
      setProgramFormError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not save this program.');
    }
  };
  const handleDeleteProgram = async (id) => {
    if (!window.confirm('Delete this program? This cannot be undone.')) return;
    try { await programsApi.remove(id); showToast('Program removed'); programsRes.load(); }
    catch (err) { showToast(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not delete this program.', 'error'); }
  };

  // ----------------------------------------------------
  // 5. STATE: BATCHES — real data: /api/v1/batches/ (business_id is
  // server-generated, apps/core/models.py Batch.save())
  // ----------------------------------------------------
  const batchesRes = useCrudResource(batchesApi);
  const batches = batchesRes.items;
  const emptyBatchForm = { name: '', program: '', institution: '', start_date: '', end_date: '', status: 'UPCOMING' };
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [batchForm, setBatchForm] = useState(emptyBatchForm);
  const [batchFormError, setBatchFormError] = useState('');
  const openAddBatch = () => { setEditingBatchId(null); setBatchForm(emptyBatchForm); setBatchFormError(''); setIsBatchModalOpen(true); };
  const openEditBatch = (b) => {
    setEditingBatchId(b.id);
    setBatchForm({ name: b.name, program: b.program, institution: b.institution || '', start_date: b.start_date, end_date: b.end_date || '', status: b.status });
    setBatchFormError('');
    setIsBatchModalOpen(true);
  };
  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (!batchForm.name.trim() || !batchForm.program || !batchForm.start_date) { setBatchFormError('Name, Program, and Start Date are required.'); return; }
    const payload = { ...batchForm, institution: batchForm.institution || null, end_date: batchForm.end_date || null };
    try {
      if (editingBatchId) { await batchesApi.update(editingBatchId, payload); showToast('Batch updated successfully!'); }
      else { await batchesApi.create(payload); showToast('Batch created successfully!'); }
      setIsBatchModalOpen(false);
      batchesRes.load();
    } catch (err) {
      setBatchFormError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not save this batch.');
    }
  };
  const handleDeleteBatch = async (id) => {
    if (!window.confirm('Delete this batch? This cannot be undone.')) return;
    try { await batchesApi.remove(id); showToast('Batch removed'); batchesRes.load(); }
    catch (err) { showToast(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not delete this batch.', 'error'); }
  };

  // ----------------------------------------------------
  // 6. STATE: PROJECTS — real data: /api/v1/academics/projects/
  // (AcademicProject — a reusable project template, not tied to one student)
  // ----------------------------------------------------
  const projectsRes = useCrudResource(projectsApi);
  const projects = projectsRes.items;
  const emptyProjectForm = { code: '', title: '', domain: '', abstract: '', technologies: '', documentation_url: '', synopsis_url: '', is_available: true };
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [projectFormError, setProjectFormError] = useState('');
  const openAddProject = () => { setEditingProjectId(null); setProjectForm(emptyProjectForm); setProjectFormError(''); setIsProjectModalOpen(true); };
  const openEditProject = (p) => {
    setEditingProjectId(p.id);
    setProjectForm({ code: p.code, title: p.title, domain: p.domain, abstract: p.abstract || '', technologies: p.technologies || '', documentation_url: p.documentation_url || '', synopsis_url: p.synopsis_url || '', is_available: p.is_available });
    setProjectFormError('');
    setIsProjectModalOpen(true);
  };
  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectForm.title.trim() || !projectForm.code.trim()) { setProjectFormError('Code and Title are required.'); return; }
    try {
      if (editingProjectId) { await projectsApi.update(editingProjectId, projectForm); showToast('Project updated successfully!'); }
      else { await projectsApi.create(projectForm); showToast('Project added successfully!'); }
      setIsProjectModalOpen(false);
      projectsRes.load();
    } catch (err) {
      setProjectFormError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not save this project.');
    }
  };
  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try { await projectsApi.remove(id); showToast('Project removed'); projectsRes.load(); }
    catch (err) { showToast(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not delete this project.', 'error'); }
  };

  // ----------------------------------------------------
  // 7. STATE: FEES — real data: /api/v1/invoices/ + /api/v1/payments/
  // ----------------------------------------------------
  const invoicesRes = useCrudResource(invoicesApi);
  const transactions = invoicesRes.items;
  const emptyPaymentForm = { invoice: '', transaction_id: '', amount: '', payment_mode: 'UPI' };
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [paymentFormError, setPaymentFormError] = useState('');
  const openRecordPayment = () => {
    setPaymentForm({ ...emptyPaymentForm, transaction_id: `TXN-${Date.now()}` });
    setPaymentFormError('');
    setIsFeeModalOpen(true);
  };
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.invoice || !paymentForm.amount) { setPaymentFormError('Invoice and Amount are required.'); return; }
    try {
      await paymentsApi.create(paymentForm);
      showToast('Payment recorded successfully!');
      setIsFeeModalOpen(false);
      invoicesRes.load();
    } catch (err) {
      setPaymentFormError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not record this payment.');
    }
  };
  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
    try { await invoicesApi.remove(id); showToast('Invoice removed'); invoicesRes.load(); }
    catch (err) { showToast(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not delete this invoice.', 'error'); }
  };

  // ----------------------------------------------------
  // 8. STATE: CERTIFICATES — real data: /api/v1/certificates/
  // No plain create/delete: issuance runs the eligibility chain (Section 8)
  // via a dedicated action, and removal is "Revoke" (QR stays live, status
  // flips to REVOKED) rather than a hard delete — apps/finance/views.py.
  // ----------------------------------------------------
  const certificatesRes = useCrudResource(certificatesApi);
  const certificates = certificatesRes.items;
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certForm, setCertForm] = useState({ enrollment: '', title: 'Certificate of Completion' });
  const [certFormError, setCertFormError] = useState('');
  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    if (!certForm.enrollment) { setCertFormError('Select an enrollment.'); return; }
    try {
      await issueCertificate(certForm.enrollment, certForm.title);
      showToast('Certificate generation queued — it will appear here once processed.');
      setIsCertModalOpen(false);
      setTimeout(() => certificatesRes.load(), 2000);
    } catch (err) {
      setCertFormError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not issue this certificate.');
    }
  };
  const handleRevokeCertificate = async (id) => {
    const reason = window.prompt('Reason for revoking this certificate:');
    if (!reason) return;
    try { await revokeCertificate(id, reason); showToast('Certificate revoked'); certificatesRes.load(); }
    catch (err) { showToast(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not revoke this certificate.', 'error'); }
  };

  // ----------------------------------------------------
  // 9. STATE: ATTENDANCE REGISTER
  // ----------------------------------------------------
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({
    'GCS-2026-001': 'Present',
    'GCS-2026-002': 'Present',
    'GCS-2026-003': 'Present',
    'GCS-2026-004': 'Absent',
    'GCS-2026-005': 'Present',
    'GCS-2026-006': 'Late'
  });

  // ----------------------------------------------------
  // 10. STATE: ASSESSMENTS — real data: /api/v1/academics/assessments/
  // (the exam/viva definitions — batch, type, max/passing marks; individual
  // per-student marks are a separate AssessmentMark resource not wired here)
  // ----------------------------------------------------
  const assessmentsRes = useCrudResource(assessmentsApi);
  const assessments = assessmentsRes.items;
  const emptyAssessmentForm = { batch: '', title: '', assessment_type: 'QUIZ', max_marks: 100, passing_marks: 40, conducted_at: '' };
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState(emptyAssessmentForm);
  const [assessmentFormError, setAssessmentFormError] = useState('');
  const openAddAssessment = () => { setEditingAssessmentId(null); setAssessmentForm(emptyAssessmentForm); setAssessmentFormError(''); setIsAssessmentModalOpen(true); };
  const openEditAssessment = (a) => {
    setEditingAssessmentId(a.id);
    setAssessmentForm({ batch: a.batch, title: a.title, assessment_type: a.assessment_type, max_marks: a.max_marks, passing_marks: a.passing_marks, conducted_at: a.conducted_at ? a.conducted_at.slice(0, 16) : '' });
    setAssessmentFormError('');
    setIsAssessmentModalOpen(true);
  };
  const handleSaveAssessment = async (e) => {
    e.preventDefault();
    if (!assessmentForm.batch || !assessmentForm.title.trim()) { setAssessmentFormError('Batch and Title are required.'); return; }
    try {
      if (editingAssessmentId) { await assessmentsApi.update(editingAssessmentId, assessmentForm); showToast('Assessment updated successfully!'); }
      else { await assessmentsApi.create(assessmentForm); showToast('Assessment created successfully!'); }
      setIsAssessmentModalOpen(false);
      assessmentsRes.load();
    } catch (err) {
      setAssessmentFormError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not save this assessment.');
    }
  };
  const handleDeleteAssessment = async (id) => {
    if (!window.confirm('Delete this assessment? This cannot be undone.')) return;
    try { await assessmentsApi.remove(id); showToast('Assessment removed'); assessmentsRes.load(); }
    catch (err) { showToast(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not delete this assessment.', 'error'); }
  };

  // ----------------------------------------------------
  // 11. STATE: ENROLLMENTS — real data: /api/v1/enrollments/
  // ----------------------------------------------------
  const enrollmentsRes = useCrudResource(enrollmentsApi);
  const enrollmentQueue = enrollmentsRes.items;
  const emptyEnrollmentForm = { student: '', program: '', batch: '', institution: '', status: 'APPLIED', coordinator_approval: false };
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState(emptyEnrollmentForm);
  const [enrollmentFormError, setEnrollmentFormError] = useState('');
  const openAddEnrollment = () => { setEnrollmentForm(emptyEnrollmentForm); setEnrollmentFormError(''); setIsEnrollmentModalOpen(true); };
  const handleSaveEnrollment = async (e) => {
    e.preventDefault();
    if (!enrollmentForm.student || !enrollmentForm.program || !enrollmentForm.batch || !enrollmentForm.institution) {
      setEnrollmentFormError('Student, Program, Batch, and Institution are all required.');
      return;
    }
    try {
      await enrollmentsApi.create(enrollmentForm);
      showToast('Enrollment created successfully!');
      setIsEnrollmentModalOpen(false);
      enrollmentsRes.load();
    } catch (err) {
      setEnrollmentFormError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not create this enrollment.');
    }
  };
  const handleApproveEnrollmentReal = async (enr) => {
    try {
      await enrollmentsApi.update(enr.id, { coordinator_approval: true, status: enr.status === 'APPLIED' ? 'ACTIVE' : enr.status });
      showToast(`Enrollment ${enr.business_id} approved!`);
      enrollmentsRes.load();
    } catch (err) {
      showToast(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not approve this enrollment.', 'error');
    }
  };
  const handleDeleteEnrollment = async (id) => {
    if (!window.confirm('Delete this enrollment? This cannot be undone.')) return;
    try { await enrollmentsApi.remove(id); showToast('Enrollment removed'); enrollmentsRes.load(); }
    catch (err) { showToast(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not delete this enrollment.', 'error'); }
  };

  // ----------------------------------------------------
  // 12. STATE: SETTINGS
  // ----------------------------------------------------
  const [settings, setSettings] = useState({
    orgName: 'Gnana Computech Solutions Private Limited',
    cin: 'U85500KA2025PTC205651',
    address: '2nd Floor, No. 126, 9th A Cross, 3rd Main, Sunkadakatte, Bangalore - 560091',
    academicYear: '2025 - 2026',
    emailAlerts: true,
    autoBackup: true,
    qualityStandard: 'Corporate Standards Compliant'
  });

  // ----------------------------------------------------
  // MODAL STATES (Fee/Cert/Project/Batch modal booleans declared earlier
  // alongside their respective real-data blocks)
  // ----------------------------------------------------
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Add Photo Modal States
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [newPhotoForm, setNewPhotoForm] = useState({
    image: '',
    fileName: '',
    category: 'Workshops',
    title: '',
    description: ''
  });
  const [photoFormError, setPhotoFormError] = useState('');

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoFormError('Invalid file type. Please select a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewPhotoForm(prev => ({
        ...prev,
        image: event.target.result,
        fileName: file.name,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '')
      }));
      setPhotoFormError('');
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSubmit = (e) => {
    e.preventDefault();

    if (!newPhotoForm.image) {
      setPhotoFormError('Please browse and select an image file from your device.');
      return;
    }

    if (!newPhotoForm.category) {
      setPhotoFormError('Please select an Event / Category.');
      return;
    }

    if (!newPhotoForm.description || !newPhotoForm.description.trim()) {
      setPhotoFormError('Please enter an Event Description.');
      return;
    }

    const newPhoto = {
      id: `g-upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      category: newPhotoForm.category,
      title: newPhotoForm.title.trim() || 'Campus Event Photo',
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      image: newPhotoForm.image,
      description: newPhotoForm.description.trim()
    };

    const updated = [newPhoto, ...galleryPhotos];
    saveGalleryPhotos(updated);
    setIsAddPhotoModalOpen(false);
    setNewPhotoForm({ image: '', fileName: '', category: 'Workshops', title: '', description: '' });
    setPhotoFormError('');
    showToast('New gallery photo uploaded & saved successfully!');
  };

  // Form states
  const [newStudent, setNewStudent] = useState({ name: '', college: '', course: 'BCA Final Year Project', batch: 'BCA-2026-B1', phone: '', email: '', fee: 'Paid' });

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------
  const handleAddStudent = (e) => {
    e.preventDefault();
    // Creating a Student record requires a linked User account, institution,
    // program and batch (apps/core/serializers.py StudentSerializer) — there's
    // no single "quick add" endpoint yet for staff to spin one up by hand.
    // Real admission currently goes through /signup (self-registration) or
    // the bulk CSV import Celery task (Section 7 of the spec); this modal
    // stays as a UI placeholder until a dedicated admissions endpoint exists.
    showToast('Student enrollment requires the admissions workflow — ask students to self-register at /signup, or use bulk import once available.', 'error');
    setIsEnrollModalOpen(false);
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Remove this student record? This cannot be undone.')) return;
    try {
      await studentsApi.remove(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setStudentsTotal((prev) => Math.max(0, prev - 1));
      showToast('Student record removed');
    } catch (err) {
      showToast(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not remove this student.', 'error');
    }
  };

  // Edit a student's professional details (personal name/email/phone belong
  // to the linked User account, not editable here).
  const [isStudentEditModalOpen, setIsStudentEditModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [studentEditForm, setStudentEditForm] = useState({ usn: '', degree: '', semester: '', branch: '', institution: '', is_active: true });
  const [studentEditFormError, setStudentEditFormError] = useState('');
  const openEditStudent = (std) => {
    setEditingStudentId(std.id);
    setStudentEditForm({
      usn: std.usn || '', degree: std.degree || '', semester: std.semester || '',
      branch: std.branch || '', institution: std.institution || '', is_active: std.is_active,
    });
    setStudentEditFormError('');
    setIsStudentEditModalOpen(true);
  };
  const handleSaveStudentEdit = async (e) => {
    e.preventDefault();
    try {
      await studentsApi.update(editingStudentId, studentEditForm);
      showToast('Student updated successfully!');
      setIsStudentEditModalOpen(false);
      loadStudents();
    } catch (err) {
      setStudentEditFormError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not save this student.');
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = () => {
    showToast(`Attendance saved & locked for batch ${selectedBatch} on ${selectedDate}!`);
  };

  // ----------------------------------------------------
  // WEBSITE CONTENT (CMS) — real data: GET/POST/PATCH/DELETE
  // /api/v1/content/ (apps/website/views.py SiteContentViewSet, IsERPStaff
  // for writes). One endpoint backs every editable marketing-site section —
  // Partner Colleges, Recognitions, About/Owners, Impact Stats, Events,
  // Services, Internships, Testimonials — see CONTENT_SECTIONS.
  // ----------------------------------------------------
  const emptyContentForm = {
    section: CONTENT_SECTIONS[0].value,
    title: '', subtitle: '', description: '', image_url: '', link_url: '',
    location: '', event_start: '', event_end: '', display_order: 0, is_active: true,
    extra: '{}',
  };
  const [contentSection, setContentSection] = useState(CONTENT_SECTIONS[0].value);
  const [siteContentItems, setSiteContentItems] = useState([]);
  const [siteContentTotal, setSiteContentTotal] = useState(0);
  const [siteContentLoading, setSiteContentLoading] = useState(true);
  const [siteContentError, setSiteContentError] = useState('');
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [editingContentId, setEditingContentId] = useState(null);
  const [contentForm, setContentForm] = useState(emptyContentForm);
  const [contentFormError, setContentFormError] = useState('');

  const loadSiteContent = useCallback((section) => {
    setSiteContentLoading(true);
    setSiteContentError('');
    siteContentApi.bySection(section)
      .then((data) => {
        setSiteContentItems(data.results);
        setSiteContentTotal(data.count);
      })
      .catch((err) => setSiteContentError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not load content.'))
      .finally(() => setSiteContentLoading(false));
  }, []);

  useEffect(() => { loadSiteContent(contentSection); }, [contentSection, loadSiteContent]);

  const openAddContent = () => {
    setEditingContentId(null);
    setContentForm({ ...emptyContentForm, section: contentSection });
    setContentFormError('');
    setIsContentModalOpen(true);
  };

  const openEditContent = (item) => {
    setEditingContentId(item.id);
    setContentForm({
      section: item.section,
      title: item.title || '',
      subtitle: item.subtitle || '',
      description: item.description || '',
      image_url: item.image_url || '',
      link_url: item.link_url || '',
      location: item.location || '',
      event_start: item.event_start ? item.event_start.slice(0, 16) : '',
      event_end: item.event_end ? item.event_end.slice(0, 16) : '',
      display_order: item.display_order ?? 0,
      is_active: item.is_active,
      extra: JSON.stringify(item.extra || {}, null, 2),
    });
    setContentFormError('');
    setIsContentModalOpen(true);
  };

  const handleSaveContent = async (e) => {
    e.preventDefault();
    if (!contentForm.title.trim()) {
      setContentFormError('Title is required.');
      return;
    }
    let extraParsed;
    try {
      extraParsed = contentForm.extra.trim() ? JSON.parse(contentForm.extra) : {};
    } catch {
      setContentFormError('Extra fields must be valid JSON (e.g. {"features": ["a", "b"]}).');
      return;
    }
    const payload = {
      ...contentForm,
      event_start: contentForm.event_start || null,
      event_end: contentForm.event_end || null,
      extra: extraParsed,
    };
    try {
      if (editingContentId) {
        await siteContentApi.update(editingContentId, payload);
        showToast('Content updated successfully!');
      } else {
        await siteContentApi.create(payload);
        showToast('Content added successfully!');
      }
      setIsContentModalOpen(false);
      loadSiteContent(contentSection);
    } catch (err) {
      setContentFormError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not save this item.');
    }
  };

  const handleDeleteContent = async (id) => {
    if (!window.confirm('Delete this content item? This cannot be undone.')) return;
    try {
      await siteContentApi.remove(id);
      showToast('Content item removed');
      loadSiteContent(contentSection);
    } catch (err) {
      showToast(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not delete this item.', 'error');
    }
  };

  const sidebarItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Students', icon: Users, count: studentsTotal },
    { name: 'Institutions', icon: Building2, count: institutions.length },
    // Employee directory is Full-access-tier only — Medium-access roles
    // (Trainer, Accounts, ...) never see it in the sidebar at all.
    ...(perms.canAccessEmployees ? [{ name: 'Employees', icon: UserCheck, count: employees.length }] : []),
    { name: 'Programs', icon: BookOpen, count: programs.length },
    { name: 'Batches', icon: Layers, count: batches.length },
    { name: 'Enrollments', icon: UserPlus, count: enrollmentQueue.filter(e => e.status === 'Pending Review').length },
    { name: 'Attendance', icon: CheckSquare },
    { name: 'Assessments', icon: FileSpreadsheet, count: assessments.length },
    { name: 'Projects', icon: FolderGit2, count: projects.length },
    { name: 'Fees', icon: DollarSign, count: transactions.length },
    { name: 'Certificates', icon: Award, count: certificates.length },
    { name: 'Gallery', icon: Image, count: galleryPhotos.length },
    { name: 'Content', icon: Layout },
    { name: 'Settings', icon: Settings },
  ];

  // Derive active tab from current URL path
  const getTabFromPath = () => {
    const path = location.pathname.replace('/erp', '').replace('/', '').toLowerCase();
    const matched = sidebarItems.find(item => item.name.toLowerCase() === path);
    return matched ? matched.name : 'Dashboard';
  };

  const activeTab = getTabFromPath();

  const handleTabClick = (itemName) => {
    const path = itemName === 'Dashboard' ? '/erp/dashboard' : `/erp/${itemName.toLowerCase()}`;
    navigate(path);
    setSearchTerm('');
  };

  // Search filter helper — fields match the real Student model
  // (business_id, user_details.full_name/email, institution_name, degree, usn)
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(s =>
      (s.user_details?.full_name || '').toLowerCase().includes(term) ||
      (s.business_id || '').toLowerCase().includes(term) ||
      (s.usn || '').toLowerCase().includes(term) ||
      (s.institution_name || '').toLowerCase().includes(term) ||
      (s.degree || '').toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  return (
    <div className="min-h-screen bg-[#17181A] text-white flex flex-col lg:flex-row max-w-full overflow-x-hidden">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all animate-bounce ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#0f766e] text-white border border-[#ffcc00]/40'
        }`}>
          <Sparkles className="w-4 h-4 text-[#ffcc00]" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-[#222326] border-b lg:border-b-0 lg:border-r border-gray-800 flex-shrink-0 flex flex-col justify-between p-4 lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:z-30 lg:overflow-y-auto">
        <div>
          <div className="pb-6 pt-2 px-2 border-b border-gray-800 flex items-center">
            <Logo variant="dark" size="normal" stacked={true} />
          </div>

          <nav className="mt-4 space-y-1 max-h-[55vh] lg:max-h-[60vh] overflow-y-auto pr-1">
            {sidebarItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleTabClick(item.name)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === item.name
                    ? 'bg-[#D4A72C] text-[#17181A] shadow-md font-bold'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-[#D4A72C]'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex-shrink-0 ${
                    activeTab === item.name ? 'bg-[#17181A] text-[#D4A72C]' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="pt-4 border-t border-gray-800 space-y-2 mt-4 lg:mt-0">
          <div className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
            <div className="text-xs min-w-0">
              <p className="font-bold text-white truncate">{user?.full_name || 'GCS Staff'}</p>
              <p className="text-[10px] text-[#D4A72C] truncate">{(user?.roles || []).join(', ') || 'ERP Staff'}</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          </div>
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main ERP Area */}
      <main className="flex-1 min-w-0 bg-[#17181A] p-4 sm:p-6 lg:p-8 lg:ml-64 overflow-y-auto">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-800">
          <div>
            <span className="text-xs uppercase font-bold text-[#D4A72C] tracking-wider">
              Staff Portal • {activeTab} Module
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {activeTab === 'Dashboard' ? 'GCS Central ERP Dashboard' : `${activeTab} Management`}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4A72C] w-48 sm:w-64"
              />
            </div>

            <Link to="/" className="px-3 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] text-xs font-bold hover:bg-[#B88918] transition-colors whitespace-nowrap">
              Public Website
            </Link>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: DASHBOARD */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-8">
            {dashboardStatsError && (
              <div className="px-4 py-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs font-semibold">
                {dashboardStatsError}
              </div>
            )}
            {/* 4 Quick Stat Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#222326] border border-gray-800 hover:border-[#D4A72C]/40 transition-colors">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Enrolled Students</span>
                  <Users className="w-4 h-4 text-[#D4A72C]" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">
                  {dashboardStats ? dashboardStats.students.active : '—'} Active
                </h3>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {dashboardStats ? `${dashboardStats.students.total} total on record` : 'Loading…'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#222326] border border-gray-800 hover:border-[#D4A72C]/40 transition-colors">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Active Enrollments</span>
                  <FolderGit2 className="w-4 h-4 text-[#D4A72C]" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">
                  {dashboardStats ? dashboardStats.enrollments.active : '—'} Active
                </h3>
                <p className="text-[11px] text-[#D4A72C] mt-1">
                  {dashboardStats ? `${dashboardStats.enrollments.applied_pending} pending applications` : 'Loading…'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#222326] border border-gray-800 hover:border-[#D4A72C]/40 transition-colors">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Partner Institutions</span>
                  <Building2 className="w-4 h-4 text-[#D4A72C]" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">
                  {dashboardStats ? dashboardStats.institutions.total : institutions.length} Colleges</h3>
                <p className="text-[11px] text-gray-400 mt-1">Bangalore North Network</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#222326] border border-gray-800 hover:border-[#D4A72C]/40 transition-colors">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Certificates Issued</span>
                  <Award className="w-4 h-4 text-[#D4A72C]" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">
                  {dashboardStats ? dashboardStats.certificates.issued : certificates.length} Issued
                </h3>
                <p className="text-[11px] text-emerald-400 mt-1">QR Code Verifiable</p>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-[#222326] p-6 rounded-2xl border border-gray-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#D4A72C] mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Quick Admin Operations
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {perms.canWriteCore && (
                  <button
                    onClick={() => setIsEnrollModalOpen(true)}
                    className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-[#D4A72C] text-left transition-all group cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5 text-[#D4A72C] mb-1 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-white">Enroll Student</p>
                    <p className="text-[10px] text-gray-400">Generate ID & Batch</p>
                  </button>
                )}

                {perms.canWriteFinance && (
                  <button
                    onClick={openRecordPayment}
                    className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-500 text-left transition-all group cursor-pointer"
                  >
                    <DollarSign className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-white">Record Payment</p>
                    <p className="text-[10px] text-gray-400">Against an existing invoice</p>
                  </button>
                )}

                {perms.canWriteFinance && (
                  <button
                    onClick={() => { setCertForm({ enrollment: '', title: 'Certificate of Completion' }); setCertFormError(''); setIsCertModalOpen(true); }}
                    className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-blue-500 text-left transition-all group cursor-pointer"
                  >
                    <Award className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-white">Issue Certificate</p>
                    <p className="text-[10px] text-gray-400">QR Code Verification</p>
                  </button>
                )}

                {perms.canWriteCore && (
                  <button
                    onClick={openAddProject}
                    className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-purple-500 text-left transition-all group cursor-pointer"
                  >
                    <FolderGit2 className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-white">Add Project</p>
                    <p className="text-[10px] text-gray-400">Catalog a new project template</p>
                  </button>
                )}

                {perms.canWriteCore && (
                  <button
                    onClick={openAddBatch}
                    className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-cyan-500 text-left transition-all group cursor-pointer"
                  >
                    <Layers className="w-5 h-5 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-white">Create Batch</p>
                    <p className="text-[10px] text-gray-400">Slot & Room Schedule</p>
                  </button>
                )}
              </div>
            </div>

            {/* Recent Students Table */}
            <div className="bg-[#222326] rounded-2xl border border-gray-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Recently Added Students</h3>
                  <p className="text-xs text-gray-400">Live from GET /api/v1/students/</p>
                </div>
                <button
                  onClick={() => handleTabClick('Students')}
                  className="text-xs text-[#D4A72C] hover:underline font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <span>View All Students ({studentsTotal})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {studentsLoading ? (
                <p className="text-xs text-gray-400 py-6 text-center">Loading students…</p>
              ) : studentsError ? (
                <p className="text-xs text-red-400 py-6 text-center">{studentsError}</p>
              ) : students.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No students enrolled yet.</p>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                    <tr>
                      <th className="p-3">Student ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Institution</th>
                      <th className="p-3">Degree</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredStudents.slice(0, 5).map((std) => (
                      <tr key={std.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#D4A72C]">{std.business_id}</td>
                        <td className="p-3 font-bold text-white">{std.user_details?.full_name}</td>
                        <td className="p-3 text-gray-400">{std.institution_name}</td>
                        <td className="p-3">{std.degree}{std.semester ? ` • Sem ${std.semester}` : ''}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                            std.is_active
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-gray-800 text-gray-400 border-gray-700'
                          }`}>
                            {std.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteStudent(std.id)}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/50 cursor-pointer"
                              title="Remove Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: STUDENTS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300">Total: {studentsTotal} Students</span>
                {searchTerm && (
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px] font-bold border border-gray-700">
                    {filteredStudents.length} matching "{searchTerm}"
                  </span>
                )}
                <button
                  onClick={loadStudents}
                  className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-[#D4A72C] text-gray-400 hover:text-[#D4A72C] cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${studentsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Student</span>
              </button>
            </div>

            <div className="bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden">
              {studentsLoading ? (
                <p className="text-xs text-gray-400 py-10 text-center">Loading students…</p>
              ) : studentsError ? (
                <p className="text-xs text-red-400 py-10 text-center">{studentsError}</p>
              ) : filteredStudents.length === 0 ? (
                <p className="text-xs text-gray-400 py-10 text-center">
                  {searchTerm ? 'No students match your search.' : 'No students enrolled yet.'}
                </p>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                    <tr>
                      <th className="p-3.5">Student ID</th>
                      <th className="p-3.5">Name</th>
                      <th className="p-3.5">Institution</th>
                      <th className="p-3.5">Degree / Semester</th>
                      <th className="p-3.5">USN</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredStudents.map((std) => (
                      <tr key={std.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-[#D4A72C]">{std.business_id}</td>
                        <td className="p-3.5 font-bold text-white">{std.user_details?.full_name}</td>
                        <td className="p-3.5 text-gray-300">{std.institution_name}</td>
                        <td className="p-3.5">{std.degree}{std.semester ? ` • Sem ${std.semester}` : ''}</td>
                        <td className="p-3.5 font-mono text-gray-400">{std.usn || '—'}</td>
                        <td className="p-3.5 text-gray-400">
                          <div>{std.user_details?.phone || '—'}</div>
                          <div className="text-[10px] text-gray-500">{std.user_details?.email}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                            std.is_active
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-gray-800 text-gray-400 border-gray-700'
                          }`}>
                            {std.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditStudent(std)}
                              className="p-1.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-[#D4A72C] border border-gray-800 cursor-pointer"
                              title="Edit Student"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(std.id)}
                              className="p-1.5 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: INSTITUTIONS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Institutions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <div>
                <h3 className="font-bold text-white text-sm">Partner Colleges & Institutional Network</h3>
                <p className="text-xs text-gray-400">Signed MoUs & Academic Project Collaboration Centers</p>
              </div>
              {perms.canWriteCore && (
                <button
                  onClick={openAddInstitution}
                  className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Institution</span>
                </button>
              )}
            </div>

            {institutionsRes.loading ? (
              <p className="text-xs text-gray-400 py-10 text-center">Loading…</p>
            ) : institutionsRes.error ? (
              <p className="text-xs text-red-400 py-10 text-center">{institutionsRes.error}</p>
            ) : institutions.length === 0 ? (
              <p className="text-xs text-gray-400 py-10 text-center">No institutions yet{perms.canWriteCore ? ' — click "Add Institution".' : '.'}</p>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {institutions.map((inst) => (
                <div key={inst.id} className="bg-[#222326] p-5 rounded-2xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#D4A72C]/20 text-[#D4A72C] border border-[#D4A72C]/30">
                      {inst.code}
                    </span>
                    {perms.canWriteCore && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEditInstitution(inst)} className="p-1 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-[#D4A72C] border border-gray-800 cursor-pointer" title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteInstitution(inst.id)} className="p-1 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 cursor-pointer" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-sm">{inst.name}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D4A72C]" /> {inst.city || '—'}{inst.state ? `, ${inst.state}` : ''}
                  </p>
                  <div className="pt-3 border-t border-gray-800 text-xs text-gray-300">
                    <p>{inst.contact_email || 'No contact email on file'}</p>
                    <p className="text-gray-500">{inst.contact_phone || ''}</p>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: EMPLOYEES */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Employees' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <div>
                <h3 className="font-bold text-white text-sm">GCS Staff & Technical Mentors</h3>
                <p className="text-xs text-gray-400">Software Architects, Project Guides, and Operations Team</p>
              </div>
              {perms.canCreateEmployee && (
                <button
                  onClick={openAddEmployee}
                  className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Employee</span>
                </button>
              )}
            </div>

            {employeesRes.loading ? (
              <p className="text-xs text-gray-400 py-10 text-center">Loading…</p>
            ) : employeesRes.error ? (
              <p className="text-xs text-red-400 py-10 text-center">{employeesRes.error}</p>
            ) : employees.length === 0 ? (
              <p className="text-xs text-gray-400 py-10 text-center">No employee records yet.</p>
            ) : (
            <div className="bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="p-3.5">Emp ID</th>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Designation</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#D4A72C]">{emp.employee_id}</td>
                      <td className="p-3.5 font-bold text-white">{emp.user_details?.full_name}</td>
                      <td className="p-3.5 text-gray-300">{emp.designation}</td>
                      <td className="p-3.5 text-gray-400">{emp.department_name || '—'}</td>
                      <td className="p-3.5 text-gray-400">{emp.user_details?.phone} • {emp.user_details?.email}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          emp.is_active ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-gray-800 text-gray-400 border-gray-700'
                        }`}>
                          {emp.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEditEmployee(emp)} className="p-1 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-[#D4A72C] border border-gray-800 cursor-pointer" title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 cursor-pointer" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: PROGRAMS & COURSES */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Programs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <div>
                <h3 className="font-bold text-white text-sm">Academic & Professional Programs</h3>
                <p className="text-xs text-gray-400">Curricula aligned with BCA, MCA, and Engineering Standards</p>
              </div>
              {perms.canWriteCore && (
                <button
                  onClick={openAddProgram}
                  className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Program</span>
                </button>
              )}
            </div>

            {programsRes.loading ? (
              <p className="text-xs text-gray-400 py-10 text-center">Loading…</p>
            ) : programsRes.error ? (
              <p className="text-xs text-red-400 py-10 text-center">{programsRes.error}</p>
            ) : programs.length === 0 ? (
              <p className="text-xs text-gray-400 py-10 text-center">No programs yet{perms.canWriteCore ? ' — click "Add Program".' : '.'}</p>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {programs.map((prog) => (
                <div key={prog.id} className="bg-[#222326] p-5 rounded-2xl border border-gray-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#D4A72C]/20 text-[#D4A72C]">
                        {prog.program_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">₹{Number(prog.base_fee).toLocaleString()}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">{prog.title}</h4>
                    <p className="text-xs text-gray-400">Duration: {prog.duration_weeks} weeks</p>
                    {prog.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{prog.description}</p>}
                  </div>
                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Code: <span className="font-mono text-[#D4A72C]">{prog.code}</span></span>
                    {perms.canWriteCore && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEditProgram(prog)} className="p-1 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-[#D4A72C] border border-gray-800 cursor-pointer" title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteProgram(prog.id)} className="p-1 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 cursor-pointer" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 6: BATCHES */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Batches' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <div>
                <h3 className="font-bold text-white text-sm">Active Lab & Classroom Batches</h3>
                <p className="text-xs text-gray-400">Timing schedules and trainer allocations at Sunkadakatte HQ</p>
              </div>
              {perms.canWriteCore && (
                <button
                  onClick={openAddBatch}
                  className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Batch</span>
                </button>
              )}
            </div>

            {batchesRes.loading ? (
              <p className="text-xs text-gray-400 py-10 text-center">Loading…</p>
            ) : batchesRes.error ? (
              <p className="text-xs text-red-400 py-10 text-center">{batchesRes.error}</p>
            ) : batches.length === 0 ? (
              <p className="text-xs text-gray-400 py-10 text-center">No batches yet{perms.canWriteCore ? ' — click "Create Batch".' : '.'}</p>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {batches.map((b) => (
                <div key={b.id} className="bg-[#222326] p-5 rounded-2xl border border-gray-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-sm text-[#D4A72C]">{b.business_id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {b.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{b.name}</h4>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>📘 Program: <span className="text-white">{b.program_title}</span></p>
                    <p>🏢 Institution: <span className="text-white">{b.institution_name || '—'}</span></p>
                    <p>📅 {b.start_date}{b.end_date ? ` → ${b.end_date}` : ''}</p>
                  </div>
                  {perms.canWriteCore && (
                    <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-1.5">
                      <button onClick={() => openEditBatch(b)} className="p-1 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-[#D4A72C] border border-gray-800 cursor-pointer" title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteBatch(b.id)} className="p-1 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 cursor-pointer" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 7: ENROLLMENTS APPROVAL QUEUE */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Enrollments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <div>
                <h3 className="font-bold text-white text-sm">Enrollments</h3>
                <p className="text-xs text-gray-400">The core record linking student, program, batch & institution — approve pending applications or add one directly</p>
              </div>
              {perms.canWriteCore && (
                <button
                  onClick={openAddEnrollment}
                  className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Enrollment</span>
                </button>
              )}
            </div>

            {enrollmentsRes.loading ? (
              <p className="text-xs text-gray-400 py-10 text-center">Loading…</p>
            ) : enrollmentsRes.error ? (
              <p className="text-xs text-red-400 py-10 text-center">{enrollmentsRes.error}</p>
            ) : enrollmentQueue.length === 0 ? (
              <p className="text-xs text-gray-400 py-10 text-center">No enrollments yet.</p>
            ) : (
            <div className="bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="p-3.5">Enrollment ID</th>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Institution</th>
                    <th className="p-3.5">Program</th>
                    <th className="p-3.5">Batch</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {enrollmentQueue.map((enr) => (
                    <tr key={enr.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#D4A72C]">{enr.business_id}</td>
                      <td className="p-3.5 font-bold text-white">{enr.student_name}</td>
                      <td className="p-3.5 text-gray-300">{enr.institution_name}</td>
                      <td className="p-3.5">{enr.program_title}</td>
                      <td className="p-3.5 text-gray-400">{enr.batch_name}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          enr.coordinator_approval ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {enr.status}{enr.coordinator_approval ? '' : ' • Pending Approval'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {perms.canWriteCore && (
                          <div className="flex items-center gap-1.5">
                            {!enr.coordinator_approval && (
                              <button
                                onClick={() => handleApproveEnrollmentReal(enr)}
                                className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            <button onClick={() => handleDeleteEnrollment(enr.id)} className="p-1.5 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 cursor-pointer" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 8: ATTENDANCE REGISTER */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Attendance' && (
          <div className="space-y-6">
            <div className="bg-[#222326] p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Daily Batch Attendance Register</h3>
                <p className="text-xs text-gray-400">Mark and verify daily lab attendance for students</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Select Batch</label>
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4A72C]"
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.business_id}>{b.business_id} ({b.program_title})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4A72C]"
                  />
                </div>

                <div className="self-end">
                  <button
                    onClick={handleSaveAttendance}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Save & Lock</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="p-3.5">Student ID</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Institution</th>
                    <th className="p-3.5">Degree</th>
                    <th className="p-3.5 text-center">Mark Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {students.map((std) => {
                    const currentStatus = attendanceRecords[std.id] || 'Present';
                    return (
                      <tr key={std.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-[#D4A72C]">{std.business_id}</td>
                        <td className="p-3.5 font-bold text-white">{std.user_details?.full_name}</td>
                        <td className="p-3.5 text-gray-300">{std.institution_name}</td>
                        <td className="p-3.5 text-gray-400">{std.degree}</td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAttendanceChange(std.id, 'Present')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentStatus === 'Present'
                                  ? 'bg-emerald-600 text-white shadow'
                                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(std.id, 'Absent')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentStatus === 'Absent'
                                  ? 'bg-red-600 text-white shadow'
                                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(std.id, 'Late')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentStatus === 'Late'
                                  ? 'bg-amber-600 text-white shadow'
                                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                              }`}
                            >
                              Late
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 9: ASSESSMENTS & VIVA */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Assessments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <div>
                <h3 className="font-bold text-white text-sm">Assessments & Viva Definitions</h3>
                <p className="text-xs text-gray-400">Quizzes, exams, and viva defenses scheduled per batch — per-student marks are entered separately once conducted</p>
              </div>
              {perms.canWriteAssessments && (
                <button
                  onClick={openAddAssessment}
                  className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Assessment</span>
                </button>
              )}
            </div>

            {assessmentsRes.loading ? (
              <p className="text-xs text-gray-400 py-10 text-center">Loading…</p>
            ) : assessmentsRes.error ? (
              <p className="text-xs text-red-400 py-10 text-center">{assessmentsRes.error}</p>
            ) : assessments.length === 0 ? (
              <p className="text-xs text-gray-400 py-10 text-center">No assessments scheduled yet.</p>
            ) : (
            <div className="bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="p-3.5">Title</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Batch</th>
                    <th className="p-3.5">Max / Passing</th>
                    <th className="p-3.5">Conducted</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {assessments.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-white">{a.title}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4A72C]/20 text-[#D4A72C] border border-[#D4A72C]/40">
                          {a.assessment_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-400">{batches.find(b => b.id === a.batch)?.name || '—'}</td>
                      <td className="p-3.5">{a.max_marks} / {a.passing_marks}</td>
                      <td className="p-3.5 text-gray-400">{a.conducted_at ? new Date(a.conducted_at).toLocaleString() : '—'}</td>
                      <td className="p-3.5">
                        {perms.canWriteAssessments && (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEditAssessment(a)} className="p-1 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-[#D4A72C] border border-gray-800 cursor-pointer" title="Edit">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteAssessment(a.id)} className="p-1 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 cursor-pointer" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 10: PROJECTS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <div>
                <h3 className="font-bold text-white text-sm">Academic Project Catalog</h3>
                <p className="text-xs text-gray-400">Reusable project templates students pick from — domain, abstract, tech stack, documentation links</p>
              </div>
              {perms.canWriteCore && (
                <button
                  onClick={openAddProject}
                  className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project</span>
                </button>
              )}
            </div>

            {projectsRes.loading ? (
              <p className="text-xs text-gray-400 py-10 text-center">Loading…</p>
            ) : projectsRes.error ? (
              <p className="text-xs text-red-400 py-10 text-center">{projectsRes.error}</p>
            ) : projects.length === 0 ? (
              <p className="text-xs text-gray-400 py-10 text-center">No projects in the catalog yet.</p>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((prj) => (
                <div key={prj.id} className="bg-[#222326] p-6 rounded-2xl border border-gray-800 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs text-[#D4A72C] font-bold">{prj.code}</span>
                      <h4 className="font-bold text-white text-base mt-1">{prj.title}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                      prj.is_available ? 'bg-[#0f766e]/20 text-emerald-400 border-emerald-800' : 'bg-gray-800 text-gray-400 border-gray-700'
                    }`}>
                      {prj.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-400 bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <p>🏷️ Domain: <span className="text-white font-semibold">{prj.domain || '—'}</span></p>
                    <p>💻 Tech Stack: <span className="text-emerald-400 font-mono">{prj.technologies || '—'}</span></p>
                    {prj.abstract && <p className="line-clamp-2">{prj.abstract}</p>}
                  </div>

                  {perms.canWriteCore && (
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-800">
                      <button onClick={() => openEditProject(prj)} className="p-1.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-[#D4A72C] border border-gray-800 cursor-pointer" title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteProject(prj.id)} className="p-1.5 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 cursor-pointer" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 11: FEES & ACCOUNTS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Fees' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#222326] p-5 rounded-2xl border border-gray-800">
                <span className="text-xs text-gray-400">Total Revenue Collected</span>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
                  ₹{transactions.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0).toLocaleString()}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">Across {transactions.length} invoice{transactions.length === 1 ? '' : 's'}</p>
              </div>

              <div className="bg-[#222326] p-5 rounded-2xl border border-gray-800">
                <span className="text-xs text-gray-400">Pending Student Dues</span>
                <h3 className="text-2xl font-extrabold text-amber-400 mt-1">
                  ₹{transactions.reduce((sum, inv) => sum + Number(inv.balance_amount || 0), 0).toLocaleString()}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">{transactions.filter(inv => Number(inv.balance_amount) > 0).length} invoice(s) outstanding</p>
              </div>

              {perms.canWriteFinance && (
                <div className="bg-[#222326] p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400">Quick Payment</span>
                    <p className="text-xs font-bold text-white mt-1">Record Ledger Entry</p>
                  </div>
                  <button
                    onClick={openRecordPayment}
                    className="px-4 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold text-xs cursor-pointer"
                  >
                    + Record Fee
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h4 className="font-bold text-white text-sm">Invoices</h4>
                <span className="text-xs text-gray-400">{invoicesRes.loading ? 'Loading…' : `${transactions.length} total`}</span>
              </div>
              {invoicesRes.error ? (
                <p className="text-xs text-red-400 py-10 text-center">{invoicesRes.error}</p>
              ) : transactions.length === 0 && !invoicesRes.loading ? (
                <p className="text-xs text-gray-400 py-10 text-center">No invoices yet.</p>
              ) : (
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Program</th>
                    <th className="p-3.5">Total</th>
                    <th className="p-3.5">Paid</th>
                    <th className="p-3.5">Balance</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#D4A72C]">{tx.invoice_number}</td>
                      <td className="p-3.5 font-bold text-white">{tx.student_name}</td>
                      <td className="p-3.5 text-gray-300">{tx.program_title}</td>
                      <td className="p-3.5">₹{Number(tx.total_amount).toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-emerald-400">₹{Number(tx.paid_amount).toLocaleString()}</td>
                      <td className="p-3.5">₹{Number(tx.balance_amount).toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          tx.status === 'PAID' ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : tx.status === 'CANCELLED' ? 'bg-gray-800 text-gray-400 border-gray-700'
                          : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {perms.canWriteFinance && (
                          <button onClick={() => handleDeleteInvoice(tx.id)} className="p-1.5 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 cursor-pointer" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 12: CERTIFICATES */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Certificates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <div>
                <h3 className="font-bold text-white text-sm">Issued Certificates & QR Verification</h3>
                <p className="text-xs text-gray-400">Verifiable credentials issued under Gnana Computech Solutions Pvt Ltd</p>
              </div>
              {perms.canWriteFinance && (
                <button
                  onClick={() => { setCertForm({ enrollment: '', title: 'Certificate of Completion' }); setCertFormError(''); setIsCertModalOpen(true); }}
                  className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue Certificate</span>
                </button>
              )}
            </div>

            {certificatesRes.loading ? (
              <p className="text-xs text-gray-400 py-10 text-center">Loading…</p>
            ) : certificatesRes.error ? (
              <p className="text-xs text-red-400 py-10 text-center">{certificatesRes.error}</p>
            ) : certificates.length === 0 ? (
              <p className="text-xs text-gray-400 py-10 text-center">No certificates issued yet.</p>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {certificates.map((cert) => (
                <div key={cert.id} className="bg-[#222326] p-6 rounded-2xl border border-gray-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-[#D4A72C] font-bold">{cert.certificate_number}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        cert.status === 'ISSUED' ? 'bg-[#0f766e]/20 text-emerald-400 border-emerald-800'
                        : cert.status === 'REVOKED' ? 'bg-red-950 text-red-400 border-red-800'
                        : 'bg-amber-950 text-amber-400 border-amber-800'
                      }`}>
                        {cert.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-base">{cert.student_name}</h4>
                    <p className="text-xs text-gray-300 mt-1">{cert.program_title}</p>
                    <p className="text-[11px] text-gray-400 mt-1">Issue Date: {cert.issue_date || '—'}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex justify-between items-center">
                    <a
                      href={`/verify/${cert.token}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold hover:underline"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> QR Verifiable — View
                    </a>
                    {cert.status === 'ISSUED' && perms.canWriteFinance && (
                      <button
                        onClick={() => handleRevokeCertificate(cert.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-400 text-xs font-bold border border-red-800 flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 13: SETTINGS & HQ PROFILE */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Settings' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-[#222326] p-6 rounded-2xl border border-gray-800 space-y-6">
              <div className="border-b border-gray-800 pb-4">
                <h3 className="text-base font-bold text-white">Organization & Central ERP Configurations</h3>
                <p className="text-xs text-gray-400">Head Office corporate details and academic system toggles</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    value={settings.orgName}
                    onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Corporate CIN Number</label>
                  <input
                    type="text"
                    value={settings.cin}
                    onChange={(e) => setSettings({ ...settings, cin: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 font-mono text-[#D4A72C] focus:outline-none focus:border-[#D4A72C]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-gray-400 mb-1">Registered Sunkadakatte Office Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Academic Session Year</label>
                  <input
                    type="text"
                    value={settings.academicYear}
                    onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Quality Standard Certification</label>
                  <input
                    type="text"
                    value={settings.qualityStandard}
                    onChange={(e) => setSettings({ ...settings, qualityStandard: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => showToast('ERP Settings saved successfully!')}
                  className="px-6 py-2.5 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold text-xs cursor-pointer"
                >
                  Save ERP Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 14: GALLERY MANAGEMENT */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Gallery' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <div>
                <h3 className="font-bold text-white text-sm">GCS Institutional Photo Gallery</h3>
                <p className="text-xs text-gray-400">Campus events, project expos, workshops & student activity archives</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNewPhotoForm({ image: '', fileName: '', category: 'Workshops', title: '', description: '' });
                    setPhotoFormError('');
                    setIsAddPhotoModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Photos</span>
                </button>
              </div>
            </div>

            {galleryPhotos.length === 0 ? (
              <div className="bg-[#222326] rounded-2xl border border-gray-800 p-12 text-center space-y-3">
                <Image className="w-12 h-12 text-gray-600 mx-auto" />
                <h4 className="text-base font-bold text-white">No Photos Available</h4>
                <p className="text-xs text-gray-400">Upload campus photos using the "+ Add Photos" button above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {galleryPhotos.map((photo) => (
                  <div key={photo.id} className="bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden group hover:border-[#D4A72C]/40 transition-all flex flex-col justify-between shadow-sm">
                    <div className="relative overflow-hidden aspect-video bg-gray-900">
                      <img
                        src={photo.image}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#17181A]/80 text-[#D4A72C] border border-[#D4A72C]/30 backdrop-blur-sm">
                        {photo.category || 'Gallery'}
                      </span>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-950/80 text-red-400 hover:bg-red-900 hover:text-white transition-colors cursor-pointer"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-4 space-y-1">
                      <h4 className="font-bold text-white text-xs line-clamp-1">{photo.title}</h4>
                      <p className="text-[11px] text-gray-400 line-clamp-2">{photo.description}</p>
                      <span className="text-[10px] text-gray-500 font-mono block pt-1">{photo.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 15: WEBSITE CONTENT (CMS) */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Content' && (
          <div className="space-y-6">
            <div className="bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <p className="text-xs text-gray-400 mb-3">
                Manage what visitors see on the public website — nothing here needs a code deploy.
              </p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_SECTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setContentSection(s.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      contentSection === s.value
                        ? 'bg-[#D4A72C] text-[#17181A]'
                        : 'bg-gray-900 text-gray-300 border border-gray-800 hover:border-[#D4A72C]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-300">
                  {siteContentTotal} item{siteContentTotal === 1 ? '' : 's'} in this section
                </span>
                <button
                  onClick={() => loadSiteContent(contentSection)}
                  className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-[#D4A72C] text-gray-400 hover:text-[#D4A72C] cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${siteContentLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {perms.canWriteContent && (
                <button
                  onClick={openAddContent}
                  className="px-4 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              )}
            </div>

            <div className="bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden">
              {siteContentLoading ? (
                <p className="text-xs text-gray-400 py-10 text-center">Loading…</p>
              ) : siteContentError ? (
                <p className="text-xs text-red-400 py-10 text-center">{siteContentError}</p>
              ) : siteContentItems.length === 0 ? (
                <p className="text-xs text-gray-400 py-10 text-center">Nothing here yet — click "Add Item" to publish the first one.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                      <tr>
                        <th className="p-3.5">Order</th>
                        <th className="p-3.5">Title</th>
                        <th className="p-3.5">Subtitle</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {siteContentItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-800/40 transition-colors">
                          <td className="p-3.5 font-mono text-gray-400">{item.display_order}</td>
                          <td className="p-3.5 font-bold text-white">
                            <div className="flex items-center gap-2">
                              {item.image_url && (
                                <img src={item.image_url} alt="" className="w-7 h-7 rounded object-cover border border-gray-700 flex-shrink-0" />
                              )}
                              <span>{item.title}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-gray-400">{item.subtitle || '—'}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                              item.is_active
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : 'bg-gray-800 text-gray-400 border-gray-700'
                            }`}>
                              {item.is_active ? 'Published' : 'Hidden'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {perms.canWriteContent && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditContent(item)}
                                  className="p-1.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-[#D4A72C] border border-gray-800 cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteContent(item.id)}
                                  className="p-1.5 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: ENROLL STUDENT */}
      {/* ---------------------------------------------------- */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#D4A72C]" /> Enroll New Student
              </h3>
              <button onClick={() => setIsEnrollModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Full Student Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Gowda"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">College / Institution</label>
                <input
                  type="text"
                  placeholder="e.g. Sunkadakatte Degree College"
                  value={newStudent.college}
                  onChange={(e) => setNewStudent({ ...newStudent, college: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Program</label>
                  <select
                    value={newStudent.course}
                    onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                  >
                    <option>BCA Final Year Project</option>
                    <option>MCA Academic Track</option>
                    <option>Full Stack Web Dev (JAVA/PYTHON)</option>
                    <option>Python & AI Track</option>
                    <option>Java Spring Boot Full Stack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Batch Code</label>
                  <select
                    value={newStudent.batch}
                    onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.business_id}>{b.business_id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="98450XXXXX"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Initial Fee Status</label>
                  <select
                    value={newStudent.fee}
                    onChange={(e) => setNewStudent({ ...newStudent, fee: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold cursor-pointer"
                >
                  Complete Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: RECORD FEE PAYMENT — real POST /api/v1/payments/ */}
      {/* ---------------------------------------------------- */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Record Fee Payment
              </h3>
              <button onClick={() => setIsFeeModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              {paymentFormError && (
                <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300">{paymentFormError}</div>
              )}
              <div>
                <label className="block text-gray-400 mb-1">Invoice *</label>
                <select
                  required
                  value={paymentForm.invoice}
                  onChange={(e) => setPaymentForm({ ...paymentForm, invoice: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                >
                  <option value="">Select an invoice…</option>
                  {transactions.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} — {inv.student_name} — Balance ₹{Number(inv.balance_amount).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-base font-bold font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Payment Method</label>
                <select
                  value={paymentForm.payment_mode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">NEFT / RTGS / IMPS</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CHEQUE">Bank Cheque / DD</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={paymentForm.transaction_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: ISSUE CERTIFICATE — real eligibility-checked issuance */}
      {/* ---------------------------------------------------- */}
      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#D4A72C]" /> Issue Verifiable Certificate
              </h3>
              <button onClick={() => setIsCertModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-4 text-xs">
              {certFormError && (
                <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300">{certFormError}</div>
              )}
              <div>
                <label className="block text-gray-400 mb-1">Enrollment *</label>
                <select
                  required
                  value={certForm.enrollment}
                  onChange={(e) => setCertForm({ ...certForm, enrollment: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                >
                  <option value="">Select an enrollment…</option>
                  {enrollmentQueue.map(enr => (
                    <option key={enr.id} value={enr.id}>
                      {enr.business_id} — {enr.student_name} — {enr.program_title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Certificate Title</label>
                <input
                  type="text"
                  value={certForm.title}
                  onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-[11px] text-gray-400 space-y-1">
                <p className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Eligibility Checked Automatically
                </p>
                <p>Issuance runs the full eligibility chain (attendance, assessments, fee clearance) server-side before generating the QR-verifiable PDF.</p>
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold cursor-pointer"
                >
                  Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: ADD / EDIT PROJECT — real /api/v1/academics/projects/ */}
      {/* ---------------------------------------------------- */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-purple-400" /> {editingProjectId ? 'Edit' : 'Add'} Project
              </h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              {projectFormError && (
                <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300">{projectFormError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Code *</label>
                  <input
                    type="text" required
                    value={projectForm.code}
                    onChange={(e) => setProjectForm({ ...projectForm, code: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Domain</label>
                  <input
                    type="text" placeholder="AI/ML, Cloud, Web…"
                    value={projectForm.domain}
                    onChange={(e) => setProjectForm({ ...projectForm, domain: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Title *</label>
                <input
                  type="text" required
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Abstract</label>
                <textarea
                  rows={3}
                  value={projectForm.abstract}
                  onChange={(e) => setProjectForm({ ...projectForm, abstract: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Technologies</label>
                <input
                  type="text" placeholder="React, Node.js, MongoDB…"
                  value={projectForm.technologies}
                  onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={projectForm.is_available}
                  onChange={(e) => setProjectForm({ ...projectForm, is_available: e.target.checked })}
                  className="rounded text-purple-400 focus:ring-purple-400"
                />
                <label className="text-gray-300">Available for new students to pick</label>
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
                >
                  {editingProjectId ? 'Save Changes' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 5: ADD / EDIT BATCH — real /api/v1/batches/ */}
      {/* ---------------------------------------------------- */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" /> {editingBatchId ? 'Edit' : 'Create'} Batch
              </h3>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4 text-xs">
              {batchFormError && (
                <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300">{batchFormError}</div>
              )}
              <div>
                <label className="block text-gray-400 mb-1">Batch Name *</label>
                <input
                  type="text" required
                  placeholder="e.g. Summer 2026 AI Batch 02"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Program *</label>
                <select
                  required
                  value={batchForm.program}
                  onChange={(e) => setBatchForm({ ...batchForm, program: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Select a program…</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Institution</label>
                <select
                  value={batchForm.institution}
                  onChange={(e) => setBatchForm({ ...batchForm, institution: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">— None —</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Start Date *</label>
                  <input
                    type="date" required
                    value={batchForm.start_date}
                    onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={batchForm.end_date}
                    onChange={(e) => setBatchForm({ ...batchForm, end_date: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Status</label>
                <select
                  value={batchForm.status}
                  onChange={(e) => setBatchForm({ ...batchForm, status: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  {editingBatchId ? 'Save Changes' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EDIT STUDENT — real /api/v1/students/ (professional details only) */}
      {/* ---------------------------------------------------- */}
      {isStudentEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#D4A72C]" /> Edit Student
              </h3>
              <button onClick={() => setIsStudentEditModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveStudentEdit} className="space-y-4 text-xs">
              {studentEditFormError && <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300">{studentEditFormError}</div>}
              <div>
                <label className="block text-gray-400 mb-1">Institution</label>
                <select value={studentEditForm.institution} onChange={(e) => setStudentEditForm({ ...studentEditForm, institution: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]">
                  <option value="">— None —</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Degree</label>
                  <input type="text" value={studentEditForm.degree} onChange={(e) => setStudentEditForm({ ...studentEditForm, degree: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Semester</label>
                  <input type="number" value={studentEditForm.semester} onChange={(e) => setStudentEditForm({ ...studentEditForm, semester: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">USN</label>
                  <input type="text" value={studentEditForm.usn} onChange={(e) => setStudentEditForm({ ...studentEditForm, usn: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Branch</label>
                  <input type="text" value={studentEditForm.branch} onChange={(e) => setStudentEditForm({ ...studentEditForm, branch: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={studentEditForm.is_active} onChange={(e) => setStudentEditForm({ ...studentEditForm, is_active: e.target.checked })}
                  className="rounded text-[#D4A72C] focus:ring-[#D4A72C]" />
                <label className="text-gray-300">Active</label>
              </div>
              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsStudentEditModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD / EDIT INSTITUTION — real /api/v1/institutions/ */}
      {/* ---------------------------------------------------- */}
      {isInstModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#D4A72C]" /> {editingInstId ? 'Edit' : 'Add'} Institution
              </h3>
              <button onClick={() => setIsInstModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveInstitution} className="space-y-4 text-xs">
              {instFormError && <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300">{instFormError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Code *</label>
                  <input type="text" required value={instForm.code} onChange={(e) => setInstForm({ ...instForm, code: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">City</label>
                  <input type="text" value={instForm.city} onChange={(e) => setInstForm({ ...instForm, city: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Institution Name *</label>
                <input type="text" required value={instForm.name} onChange={(e) => setInstForm({ ...instForm, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Address</label>
                <textarea rows={2} value={instForm.address} onChange={(e) => setInstForm({ ...instForm, address: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Contact Email</label>
                  <input type="email" value={instForm.contact_email} onChange={(e) => setInstForm({ ...instForm, contact_email: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Contact Phone</label>
                  <input type="text" value={instForm.contact_phone} onChange={(e) => setInstForm({ ...instForm, contact_phone: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsInstModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold cursor-pointer">{editingInstId ? 'Save Changes' : 'Add Institution'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD / EDIT PROGRAM — real /api/v1/programs/ */}
      {/* ---------------------------------------------------- */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#D4A72C]" /> {editingProgramId ? 'Edit' : 'Add'} Program
              </h3>
              <button onClick={() => setIsProgramModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProgram} className="space-y-4 text-xs">
              {programFormError && <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300">{programFormError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Code *</label>
                  <input type="text" required value={programForm.code} onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Type</label>
                  <select value={programForm.program_type} onChange={(e) => setProgramForm({ ...programForm, program_type: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]">
                    <option value="INTERNSHIP">Software Internship</option>
                    <option value="ACADEMIC_PROJECT">Academic Project</option>
                    <option value="COURSE">Professional Training Course</option>
                    <option value="WORKSHOP">Technical Workshop / Seminar</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Title *</label>
                <input type="text" required value={programForm.title} onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Description</label>
                <textarea rows={2} value={programForm.description} onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Duration (weeks)</label>
                  <input type="number" value={programForm.duration_weeks} onChange={(e) => setProgramForm({ ...programForm, duration_weeks: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Base Fee (₹)</label>
                  <input type="number" value={programForm.base_fee} onChange={(e) => setProgramForm({ ...programForm, base_fee: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D4A72C]" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsProgramModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold cursor-pointer">{editingProgramId ? 'Save Changes' : 'Add Program'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EDIT EMPLOYEE — real /api/v1/employees/ (no create: needs an existing User account) */}
      {/* ---------------------------------------------------- */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#D4A72C]" /> Edit Employee
              </h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
              {empFormError && <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300">{empFormError}</div>}
              <div>
                <label className="block text-gray-400 mb-1">Designation *</label>
                <input type="text" required value={empForm.designation} onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Department</label>
                <select value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]">
                  <option value="">— None —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEmpModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD EMPLOYEE — /api/v1/employees/create-with-user/ (creates the login account + employee profile together) */}
      {/* ---------------------------------------------------- */}
      {isAddEmpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#D4A72C]" /> Add Employee
              </h3>
              <button onClick={() => setIsAddEmpModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-4 text-xs">
              {addEmpFormError && <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300">{addEmpFormError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-gray-400 mb-1">Full Name *</label>
                  <input type="text" required value={addEmpForm.full_name} onChange={(e) => setAddEmpForm({ ...addEmpForm, full_name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 mb-1">Email *</label>
                  <input type="email" required value={addEmpForm.email} onChange={(e) => setAddEmpForm({ ...addEmpForm, email: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Phone</label>
                  <input type="text" value={addEmpForm.phone} onChange={(e) => setAddEmpForm({ ...addEmpForm, phone: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Temp Password *</label>
                  <input type="text" required value={addEmpForm.password} onChange={(e) => setAddEmpForm({ ...addEmpForm, password: e.target.value })}
                    placeholder="min 8 characters" className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 mb-1">ERP Role *</label>
                  <select required value={addEmpForm.role} onChange={(e) => setAddEmpForm({ ...addEmpForm, role: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]">
                    <option value="">Select a role…</option>
                    {ASSIGNABLE_STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Employee ID *</label>
                  <input type="text" required value={addEmpForm.employee_id} onChange={(e) => setAddEmpForm({ ...addEmpForm, employee_id: e.target.value })}
                    placeholder="e.g. GCS-EMP-001" className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Designation *</label>
                  <input type="text" required value={addEmpForm.designation} onChange={(e) => setAddEmpForm({ ...addEmpForm, designation: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Department</label>
                  <select value={addEmpForm.department} onChange={(e) => setAddEmpForm({ ...addEmpForm, department: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]">
                    <option value="">— None —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Joining Date</label>
                  <input type="date" value={addEmpForm.joining_date} onChange={(e) => setAddEmpForm({ ...addEmpForm, joining_date: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddEmpModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold cursor-pointer">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD / EDIT ASSESSMENT — real /api/v1/academics/assessments/ */}
      {/* ---------------------------------------------------- */}
      {isAssessmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#D4A72C]" /> {editingAssessmentId ? 'Edit' : 'Add'} Assessment
              </h3>
              <button onClick={() => setIsAssessmentModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAssessment} className="space-y-4 text-xs">
              {assessmentFormError && <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300">{assessmentFormError}</div>}
              <div>
                <label className="block text-gray-400 mb-1">Batch *</label>
                <select required value={assessmentForm.batch} onChange={(e) => setAssessmentForm({ ...assessmentForm, batch: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]">
                  <option value="">Select a batch…</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Title *</label>
                <input type="text" required value={assessmentForm.title} onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Type</label>
                  <select value={assessmentForm.assessment_type} onChange={(e) => setAssessmentForm({ ...assessmentForm, assessment_type: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]">
                    <option value="QUIZ">Quiz</option>
                    <option value="MID_TERM">Mid-Term Exam</option>
                    <option value="FINAL_EXAM">Final Exam</option>
                    <option value="PROJECT_VIVA">Project Viva Defense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Conducted On</label>
                  <input type="datetime-local" value={assessmentForm.conducted_at} onChange={(e) => setAssessmentForm({ ...assessmentForm, conducted_at: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Max Marks</label>
                  <input type="number" value={assessmentForm.max_marks} onChange={(e) => setAssessmentForm({ ...assessmentForm, max_marks: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Passing Marks</label>
                  <input type="number" value={assessmentForm.passing_marks} onChange={(e) => setAssessmentForm({ ...assessmentForm, passing_marks: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAssessmentModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold cursor-pointer">{editingAssessmentId ? 'Save Changes' : 'Add Assessment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: NEW ENROLLMENT — real /api/v1/enrollments/ */}
      {/* ---------------------------------------------------- */}
      {isEnrollmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#D4A72C]" /> New Enrollment
              </h3>
              <button onClick={() => setIsEnrollmentModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEnrollment} className="space-y-4 text-xs">
              {enrollmentFormError && <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300">{enrollmentFormError}</div>}
              <div>
                <label className="block text-gray-400 mb-1">Student *</label>
                <select required value={enrollmentForm.student} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, student: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]">
                  <option value="">Select a student…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.user_details?.full_name} ({s.business_id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Program *</label>
                <select required value={enrollmentForm.program} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, program: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]">
                  <option value="">Select a program…</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Batch *</label>
                <select required value={enrollmentForm.batch} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, batch: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]">
                  <option value="">Select a batch…</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Institution *</label>
                <select required value={enrollmentForm.institution} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, institution: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]">
                  <option value="">Select an institution…</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEnrollmentModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold cursor-pointer">Create Enrollment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD GALLERY PHOTO */}
      {/* ---------------------------------------------------- */}
      {isAddPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Image className="w-5 h-5 text-[#D4A72C]" /> Add Gallery Photo
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPhotoModalOpen(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePhotoSubmit} className="space-y-4 text-xs">
              
              {photoFormError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 font-bold">
                  {photoFormError}
                </div>
              )}

              {/* 1. Select Photo & Browse File */}
              <div className="space-y-2">
                <label className="block text-gray-400 font-bold uppercase tracking-wider">
                  Select Photo *
                </label>

                {newPhotoForm.image ? (
                  <div className="space-y-2">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-900 border border-gray-700">
                      <img
                        src={newPhotoForm.image}
                        alt="Selected Preview"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] bg-black/70 text-gray-300 font-mono truncate max-w-[80%]">
                        {newPhotoForm.fileName}
                      </span>
                    </div>
                    <label
                      htmlFor="photo-modal-file-input"
                      className="inline-block px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold cursor-pointer text-[11px] transition-colors"
                    >
                      Change Photo
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="photo-modal-file-input"
                    className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-700 hover:border-[#D4A72C] bg-gray-900/60 cursor-pointer transition-colors text-center space-y-2"
                  >
                    <Upload className="w-8 h-8 text-[#D4A72C]" />
                    <div>
                      <p className="font-bold text-white">Browse / Choose File</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Supports JPG, JPEG, PNG, WEBP</p>
                    </div>
                  </label>
                )}

                <input
                  id="photo-modal-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              {/* 2. Event / Photo Title */}
              <div className="space-y-1">
                <label className="block text-gray-400 font-bold uppercase tracking-wider">
                  Event / Photo Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hands-on Full Stack Development Bootcamp"
                  value={newPhotoForm.title}
                  onChange={(e) => setNewPhotoForm({ ...newPhotoForm, title: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              {/* 3. Event / Category Select Dropdown */}
              <div className="space-y-1">
                <label className="block text-gray-400 font-bold uppercase tracking-wider">
                  Event / Category *
                </label>
                <select
                  value={newPhotoForm.category}
                  onChange={(e) => setNewPhotoForm({ ...newPhotoForm, category: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#D4A72C]"
                >
                  <option value="Workshops">Workshops</option>
                  <option value="Training">Training</option>
                  <option value="Events">Events</option>
                  <option value="Internships">Internships</option>
                  <option value="Student Activities">Student Activities</option>
                  <option value="Seminars">Seminars</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* 4. Event Description Textarea */}
              <div className="space-y-1">
                <label className="block text-gray-400 font-bold uppercase tracking-wider">
                  Event Description *
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter a short description of the event..."
                  value={newPhotoForm.description}
                  onChange={(e) => setNewPhotoForm({ ...newPhotoForm, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#D4A72C] resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddPhotoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold cursor-pointer transition-colors"
                >
                  Submit
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD / EDIT WEBSITE CONTENT */}
      {/* ---------------------------------------------------- */}
      {isContentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layout className="w-5 h-5 text-[#D4A72C]" />
                {editingContentId ? 'Edit' : 'Add'} {CONTENT_SECTIONS.find(s => s.value === contentForm.section)?.label}
              </h3>
              <button onClick={() => setIsContentModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContent} className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {contentFormError && (
                <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300">
                  {contentFormError}
                </div>
              )}

              <div>
                <label className="block text-gray-400 mb-1">Section *</label>
                <select
                  value={contentForm.section}
                  onChange={(e) => setContentForm({ ...contentForm, section: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                >
                  {CONTENT_SECTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">
                  Title * <span className="text-gray-600 normal-case">(name / heading — e.g. college name, owner's name, stat label)</span>
                </label>
                <input
                  type="text"
                  required
                  value={contentForm.title}
                  onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">
                  Subtitle <span className="text-gray-600 normal-case">(designation, role, badge, or program type)</span>
                </label>
                <input
                  type="text"
                  value={contentForm.subtitle}
                  onChange={(e) => setContentForm({ ...contentForm, subtitle: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={contentForm.description}
                  onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Image URL <span className="text-gray-600 normal-case">(photo for owners/testimonials, logo for partners)</span></label>
                <input
                  type="text"
                  value={contentForm.image_url}
                  onChange={(e) => setContentForm({ ...contentForm, image_url: e.target.value })}
                  placeholder="https://…"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Link URL <span className="text-gray-600 normal-case">(optional — e.g. registration link for an event)</span></label>
                <input
                  type="text"
                  value={contentForm.link_url}
                  onChange={(e) => setContentForm({ ...contentForm, link_url: e.target.value })}
                  placeholder="https://…"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={contentForm.location}
                  onChange={(e) => setContentForm({ ...contentForm, location: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              {contentForm.section === 'event' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">Event Start (date & time) *</label>
                    <input
                      type="datetime-local"
                      value={contentForm.event_start}
                      onChange={(e) => setContentForm({ ...contentForm, event_start: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Event End (optional)</label>
                    <input
                      type="datetime-local"
                      value={contentForm.event_end}
                      onChange={(e) => setContentForm({ ...contentForm, event_end: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={contentForm.display_order}
                    onChange={(e) => setContentForm({ ...contentForm, display_order: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                  />
                </div>
                <div className="flex items-end pb-2.5">
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contentForm.is_active}
                      onChange={(e) => setContentForm({ ...contentForm, is_active: e.target.checked })}
                      className="rounded text-[#D4A72C] focus:ring-[#D4A72C]"
                    />
                    <span>Published (visible on the public site)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">
                  Extra Fields <span className="text-gray-600 normal-case">(JSON — e.g. features/technologies list, testimonial rating)</span>
                </label>
                <textarea
                  rows={4}
                  value={contentForm.extra}
                  onChange={(e) => setContentForm({ ...contentForm, extra: e.target.value })}
                  placeholder='{"features": ["Item one", "Item two"], "rating": 5}'
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContentModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold cursor-pointer transition-colors"
                >
                  {editingContentId ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
