import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building2, UserCheck, BookOpen, Layers, UserPlus, 
  CheckSquare, FileSpreadsheet, FolderGit2, GraduationCap, DollarSign, Award, 
  Settings, LogOut, Bell, Search, TrendingUp, Calendar, AlertCircle, ChevronRight,
  Plus, Trash2, Edit, Check, X, Download, Filter, Eye, Phone, Mail, MapPin, 
  Sparkles, Printer, FileText, CheckCircle2, Clock, ShieldCheck, RefreshCw,
  Image, Upload
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { galleryData } from '../../data/galleryData';

export const ErpDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

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
  // 1. STATE: STUDENTS
  // ----------------------------------------------------
  const [students, setStudents] = useState([
    { id: 'GCS-2026-001', name: 'Prajwal Gowda', college: 'Sunkadakatte Degree College', course: 'BCA Final Year Project', batch: 'BCA-2026-B1', fee: 'Paid', status: 'Active', phone: '9845012345', email: 'prajwal.g@gmail.com', progress: 85 },
    { id: 'GCS-2026-002', name: 'Kavya R.', college: 'Acharya Group of Institutions', course: 'Full Stack Web Dev (MERN)', batch: 'MERN-2026-A', fee: 'Paid', status: 'Active', phone: '9845012346', email: 'kavya.r@gmail.com', progress: 70 },
    { id: 'GCS-2026-003', name: 'Sharath Kumar', college: 'Soundarya Institute of Mgmt', course: 'Python & AI Track', batch: 'PY-2026-C', fee: 'Paid', status: 'Completed', phone: '9845012347', email: 'sharath.k@gmail.com', progress: 100 },
    { id: 'GCS-2026-004', name: 'Nithin V.', college: 'GFGC Peenya', course: 'MCA Academic Project', batch: 'MCA-2026-B', fee: 'Pending', status: 'Active', phone: '9845012348', email: 'nithin.v@gmail.com', progress: 45 },
    { id: 'GCS-2026-005', name: 'Divya Shree', college: 'East West Inst. of Tech (EWIT)', course: 'Java Spring Boot Full Stack', batch: 'JAVA-2026-D', fee: 'Paid', status: 'Active', phone: '9845012349', email: 'divya.s@gmail.com', progress: 60 },
    { id: 'GCS-2026-006', name: 'Manoj Kumar', college: 'Peenya Govt Tech Institute', course: 'Cloud & DevOps Engineering', batch: 'MERN-2026-A', fee: 'Pending', status: 'Active', phone: '9845012350', email: 'manoj.k@gmail.com', progress: 30 }
  ]);

  // ----------------------------------------------------
  // 2. STATE: INSTITUTIONS
  // ----------------------------------------------------
  const [institutions, setInstitutions] = useState([
    { id: 1, name: 'Sunkadakatte First Grade Degree College', location: 'Sunkadakatte, Bangalore', type: 'Academic Partner', mouStatus: 'Active', students: 120, contact: 'Dr. Ramesh N. (Principal)' },
    { id: 2, name: 'Acharya Group of Institutions', location: 'Soladevanahalli, Bangalore', type: 'College Association', mouStatus: 'Active', students: 250, contact: 'Prof. Suresh K. (HOD CS)' },
    { id: 3, name: 'Soundarya Institute of Management & Science', location: 'Soundarya Layout, Bangalore', type: 'Workshop Partner', mouStatus: 'Active', students: 95, contact: 'Mrs. Anitha Rao' },
    { id: 4, name: 'Peenya Govt. Technical Institute', location: 'Peenya Industrial Area', type: 'Skill Partner', mouStatus: 'Active', students: 80, contact: 'Mr. Siddaramaiah' },
    { id: 5, name: 'Government First Grade College, Peenya', location: 'Peenya, Bangalore North', type: 'Degree Project Lab', mouStatus: 'Active', students: 110, contact: 'Dr. Manjunath P.' },
    { id: 6, name: 'East West Institute of Technology (EWIT)', location: 'Magadi Main Road, Bangalore', type: 'Institutional Network', mouStatus: 'Active', students: 160, contact: 'Prof. Hemant Kumar' }
  ]);

  // ----------------------------------------------------
  // 3. STATE: EMPLOYEES / STAFF
  // ----------------------------------------------------
  const [employees, setEmployees] = useState([
    { id: 'EMP-01', name: 'Naveen Kumar', role: 'Principal Tech Architect', dept: 'Software & Mentorship', email: 'naveen@gnanacomputech.com', phone: '9880198801', status: 'Active' },
    { id: 'EMP-02', name: 'Sowmya M.', role: 'Senior Python & AI Trainer', dept: 'Skill Training', email: 'sowmya@gnanacomputech.com', phone: '9880198802', status: 'Active' },
    { id: 'EMP-03', name: 'Harish Babu', role: 'MERN Stack Lead', dept: 'Software Development', email: 'harish@gnanacomputech.com', phone: '9880198803', status: 'Active' },
    { id: 'EMP-04', name: 'Pavithra S.', role: 'Academic Project Coordinator', dept: 'Student Relations', email: 'pavithra@gnanacomputech.com', phone: '9880198804', status: 'Active' },
    { id: 'EMP-05', name: 'Chandrashekar K.', role: 'Lab & System Administrator', dept: 'Infrastructure', email: 'shekar@gnanacomputech.com', phone: '9880198805', status: 'Active' }
  ]);

  // ----------------------------------------------------
  // 4. STATE: BATCHES
  // ----------------------------------------------------
  const [batches, setBatches] = useState([
    { code: 'BCA-2026-B1', program: 'BCA Final Year Project', timing: '09:30 AM - 11:30 AM', trainer: 'Naveen Kumar', room: 'Lab 1 (Sunkadakatte HQ)', count: 28, max: 30, status: 'Ongoing' },
    { code: 'MERN-2026-A', program: 'Full Stack Web Dev (MERN)', timing: '11:45 AM - 01:45 PM', trainer: 'Harish Babu', room: 'Lab 2 (Cloud Suite)', count: 24, max: 25, status: 'Ongoing' },
    { code: 'PY-2026-C', program: 'Python & AI / ML Track', timing: '02:30 PM - 04:30 PM', trainer: 'Sowmya M.', room: 'Lab 1 (Sunkadakatte HQ)', count: 22, max: 25, status: 'Ongoing' },
    { code: 'MCA-2026-B', program: 'MCA Academic Project Lab', timing: '04:45 PM - 06:45 PM', trainer: 'Naveen Kumar', room: 'Lab 3 (Research Lab)', count: 18, max: 20, status: 'Ongoing' },
    { code: 'JAVA-2026-D', program: 'Java Spring Boot Full Stack', timing: '10:00 AM - 12:00 PM (Weekend)', trainer: 'Harish Babu', room: 'Lab 2 (Cloud Suite)', count: 15, max: 20, status: 'Starting Next Week' }
  ]);

  // ----------------------------------------------------
  // 5. STATE: PROGRAMS & COURSES
  // ----------------------------------------------------
  const [programs, setPrograms] = useState([
    { id: 'PROG-01', title: 'BCA Final Year Academic Project Guidance', duration: '3 - 6 Months', fee: '₹6,500', category: 'Academic Degree', modules: 'SRS Doc, IEEE Coding, DB Schema, Viva Voce Prep' },
    { id: 'PROG-02', title: 'MCA Enterprise Software Project Track', duration: '4 - 6 Months', fee: '₹9,500', category: 'Academic Post-Grad', modules: 'Architecture, Microservices, Cloud Deploy, Research Paper' },
    { id: 'PROG-03', title: 'Full Stack Web Development (MERN)', duration: '12 Weeks', fee: '₹14,000', category: 'Professional Certification', modules: 'MongoDB, Express, React, Node.js, Git, CI/CD' },
    { id: 'PROG-04', title: 'Python, Data Science & Machine Learning', duration: '10 Weeks', fee: '₹12,500', category: 'Professional Certification', modules: 'Core Python, Pandas, Scikit-Learn, Flask APIs, Live Models' },
    { id: 'PROG-05', title: 'Java Full Stack & Spring Boot Enterprise', duration: '12 Weeks', fee: '₹14,500', category: 'Professional Certification', modules: 'Core Java, Spring Boot, Hibernate, MySQL, Angular/React' }
  ]);

  // ----------------------------------------------------
  // 6. STATE: PROJECTS
  // ----------------------------------------------------
  const [projects, setProjects] = useState([
    { id: 'PRJ-101', title: 'AI-Driven Healthcare Disease Diagnostic System', student: 'Prajwal Gowda & Team', stack: 'Python, Flask, React, OpenCV', phase: 'Phase 3: Integration', mentor: 'Sowmya M.', status: 'In Progress' },
    { id: 'PRJ-102', title: 'Smart College ERP & Automated Attendance Suite', student: 'Kavya R.', stack: 'React, Node.js, Express, MongoDB', phase: 'Phase 4: IEEE Doc', mentor: 'Harish Babu', status: 'Ready for Viva' },
    { id: 'PRJ-103', title: 'Blockchain-Based Verifiable Academic Certificates', student: 'Sharath Kumar', stack: 'Solidity, Ethereum, Web3.js, React', phase: 'Completed', mentor: 'Naveen Kumar', status: 'Completed' },
    { id: 'PRJ-104', title: 'IoT-Powered Industrial Asset Monitoring', student: 'Nithin V. & Team', stack: 'Node-RED, MQTT, Raspberry Pi, React', phase: 'Phase 2: DB Schema', mentor: 'Naveen Kumar', status: 'In Progress' },
    { id: 'PRJ-105', title: 'E-Commerce Microservices Engine with Kafka', student: 'Divya Shree', stack: 'Java Spring Boot, Docker, React', phase: 'Phase 3: Integration', mentor: 'Harish Babu', status: 'In Progress' }
  ]);

  // ----------------------------------------------------
  // 7. STATE: FEES & TRANSACTIONS
  // ----------------------------------------------------
  const [transactions, setTransactions] = useState([
    { receiptNo: 'REC-2026-901', student: 'Prajwal Gowda', program: 'BCA Final Year Project', amount: '₹6,500', mode: 'UPI / PhonePe', date: '2026-02-10', status: 'Success' },
    { receiptNo: 'REC-2026-902', student: 'Kavya R.', program: 'Full Stack Web Dev (MERN)', amount: '₹14,000', mode: 'Google Pay', date: '2026-02-15', status: 'Success' },
    { receiptNo: 'REC-2026-903', student: 'Sharath Kumar', program: 'Python & AI Track', amount: '₹12,500', mode: 'Bank Transfer (NEFT)', date: '2026-01-20', status: 'Success' },
    { receiptNo: 'REC-2026-904', student: 'Divya Shree', program: 'Java Spring Boot Full Stack', amount: '₹14,500', mode: 'UPI', date: '2026-02-28', status: 'Success' }
  ]);

  // ----------------------------------------------------
  // 8. STATE: CERTIFICATES
  // ----------------------------------------------------
  const [certificates, setCertificates] = useState([
    { certId: 'GCS-2026-CERT-081', studentName: 'Sharath Kumar', program: 'Python & AI Machine Learning Track', date: '2026-02-25', grade: 'Grade A+ (Distinction)', verification: 'QR Code Verified' },
    { certId: 'GCS-2026-CERT-082', studentName: 'Deepa Narayan', program: 'Full Stack Web Dev (MERN)', date: '2026-02-18', grade: 'Grade A', verification: 'QR Code Verified' },
    { certId: 'GCS-2026-CERT-083', studentName: 'Anil Kumar S.', program: 'BCA Final Year Degree Project Defense', date: '2026-01-30', grade: 'Grade A+', verification: 'QR Code Verified' }
  ]);

  // ----------------------------------------------------
  // 9. STATE: ATTENDANCE REGISTER
  // ----------------------------------------------------
  const [selectedBatch, setSelectedBatch] = useState('BCA-2026-B1');
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
  // 10. STATE: ASSESSMENTS / VIVA SCORES
  // ----------------------------------------------------
  const [assessments, setAssessments] = useState([
    { studentId: 'GCS-2026-001', studentName: 'Prajwal Gowda', synopsis: 24, architecture: 23, coding: 22, viva: 24, total: 93, grade: 'A+' },
    { studentId: 'GCS-2026-002', studentName: 'Kavya R.', synopsis: 22, architecture: 21, coding: 23, viva: 22, total: 88, grade: 'A' },
    { studentId: 'GCS-2026-003', studentName: 'Sharath Kumar', synopsis: 25, architecture: 25, coding: 24, viva: 25, total: 99, grade: 'A+' },
    { studentId: 'GCS-2026-004', studentName: 'Nithin V.', synopsis: 19, architecture: 18, coding: 20, viva: 19, total: 76, grade: 'B+' },
    { studentId: 'GCS-2026-005', studentName: 'Divya Shree', synopsis: 23, architecture: 22, coding: 21, viva: 23, total: 89, grade: 'A' }
  ]);

  // ----------------------------------------------------
  // 11. STATE: ENROLLMENTS APPROVAL QUEUE
  // ----------------------------------------------------
  const [enrollmentQueue, setEnrollmentQueue] = useState([
    { id: 'ENR-101', name: 'Varun Gowda', college: 'Acharya Institute', program: 'MERN Full Stack', contact: '9845112233', date: '2026-03-01', status: 'Pending Review' },
    { id: 'ENR-102', name: 'Meghana Rao', college: 'Sunkadakatte Degree College', program: 'BCA Academic Project', contact: '9845112244', date: '2026-03-02', status: 'Pending Review' },
    { id: 'ENR-103', name: 'Chethan Kumar', college: 'EWIT Bangalore', program: 'Python Data Science', contact: '9845112255', date: '2026-03-03', status: 'Approved' }
  ]);

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
  // MODAL STATES
  // ----------------------------------------------------
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [viewCertificateModal, setViewCertificateModal] = useState(null);

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
  const [newFee, setNewFee] = useState({ student: 'Prajwal Gowda', program: 'BCA Final Year Project', amount: '6500', mode: 'UPI' });
  const [newCert, setNewCert] = useState({ studentName: '', program: 'BCA Final Year Project', grade: 'Grade A+ (Distinction)' });
  const [newProject, setNewProject] = useState({ title: '', student: '', stack: 'React, Node.js, Express, MongoDB', mentor: 'Naveen Kumar' });
  const [newBatch, setNewBatch] = useState({ code: '', program: 'BCA Final Year Project', timing: '09:30 AM - 11:30 AM', trainer: 'Naveen Kumar', room: 'Lab 1 (Sunkadakatte HQ)', max: 30 });

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------
  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.phone) {
      showToast('Please provide student name and contact number', 'error');
      return;
    }
    const id = `GCS-2026-${String(students.length + 1).padStart(3, '0')}`;
    const entry = { ...newStudent, id, status: 'Active', progress: 10 };
    setStudents([entry, ...students]);
    setIsEnrollModalOpen(false);
    setNewStudent({ name: '', college: '', course: 'BCA Final Year Project', batch: 'BCA-2026-B1', phone: '', email: '', fee: 'Paid' });
    showToast(`Student ${entry.name} enrolled successfully with ID: ${id}`);
  };

  const handleDeleteStudent = (id) => {
    setStudents(students.filter(s => s.id !== id));
    showToast('Student record removed from ERP');
  };

  const toggleStudentFee = (id) => {
    setStudents(students.map(s => {
      if (s.id === id) {
        const nextFee = s.fee === 'Paid' ? 'Pending' : 'Paid';
        return { ...s, fee: nextFee };
      }
      return s;
    }));
    showToast('Student fee status updated');
  };

  const handleRecordFee = (e) => {
    e.preventDefault();
    const receiptNo = `REC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const tx = {
      receiptNo,
      student: newFee.student,
      program: newFee.program,
      amount: `₹${Number(newFee.amount).toLocaleString()}`,
      mode: newFee.mode,
      date: new Date().toISOString().split('T')[0],
      status: 'Success'
    };
    setTransactions([tx, ...transactions]);
    // update student fee status
    setStudents(students.map(s => s.name === newFee.student ? { ...s, fee: 'Paid' } : s));
    setIsFeeModalOpen(false);
    showToast(`Payment recorded! Receipt #${receiptNo} generated`);
  };

  const handleIssueCertificate = (e) => {
    e.preventDefault();
    if (!newCert.studentName) {
      showToast('Please specify the recipient student name', 'error');
      return;
    }
    const certId = `GCS-2026-CERT-${Math.floor(100 + Math.random() * 900)}`;
    const cert = {
      certId,
      studentName: newCert.studentName,
      program: newCert.program,
      date: new Date().toISOString().split('T')[0],
      grade: newCert.grade,
      verification: 'QR Code Verified'
    };
    setCertificates([cert, ...certificates]);
    setIsCertModalOpen(false);
    setNewCert({ studentName: '', program: 'BCA Final Year Project', grade: 'Grade A+ (Distinction)' });
    showToast(`Certificate ${certId} issued successfully!`);
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProject.title || !newProject.student) {
      showToast('Please fill all project details', 'error');
      return;
    }
    const prjId = `PRJ-${Math.floor(100 + Math.random() * 900)}`;
    const prj = {
      id: prjId,
      title: newProject.title,
      student: newProject.student,
      stack: newProject.stack,
      mentor: newProject.mentor,
      phase: 'Phase 1: Synopsis',
      status: 'In Progress'
    };
    setProjects([prj, ...projects]);
    setIsProjectModalOpen(false);
    setNewProject({ title: '', student: '', stack: 'React, Node.js, Express, MongoDB', mentor: 'Naveen Kumar' });
    showToast(`Project "${prj.title}" created and assigned!`);
  };

  const handleCreateBatch = (e) => {
    e.preventDefault();
    if (!newBatch.code) {
      showToast('Please provide a batch code', 'error');
      return;
    }
    const b = { ...newBatch, count: 0, status: 'Upcoming' };
    setBatches([...batches, b]);
    setIsBatchModalOpen(false);
    setNewBatch({ code: '', program: 'BCA Final Year Project', timing: '09:30 AM - 11:30 AM', trainer: 'Naveen Kumar', room: 'Lab 1 (Sunkadakatte HQ)', max: 30 });
    showToast(`Batch ${b.code} created successfully!`);
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

  const handleApproveEnrollment = (id) => {
    setEnrollmentQueue(enrollmentQueue.map(item => item.id === id ? { ...item, status: 'Approved' } : item));
    showToast(`Application ${id} approved!`);
  };

  const sidebarItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Students', icon: Users, count: students.length },
    { name: 'Institutions', icon: Building2, count: institutions.length },
    { name: 'Employees', icon: UserCheck, count: employees.length },
    { name: 'Programs', icon: BookOpen, count: programs.length },
    { name: 'Batches', icon: Layers, count: batches.length },
    { name: 'Enrollments', icon: UserPlus, count: enrollmentQueue.filter(e => e.status === 'Pending Review').length },
    { name: 'Attendance', icon: CheckSquare },
    { name: 'Assessments', icon: FileSpreadsheet, count: assessments.length },
    { name: 'Projects', icon: FolderGit2, count: projects.length },
    { name: 'Fees', icon: DollarSign, count: transactions.length },
    { name: 'Certificates', icon: Award, count: certificates.length },
    { name: 'Gallery', icon: Image, count: galleryPhotos.length },
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

  // Search filter helper
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.id.toLowerCase().includes(term) || 
      s.course.toLowerCase().includes(term) ||
      s.college.toLowerCase().includes(term) ||
      s.batch.toLowerCase().includes(term)
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
              <p className="font-bold text-white truncate">GCS Admin Office</p>
              <p className="text-[10px] text-[#D4A72C] truncate">Sunkadakatte HQ (Active)</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Logout ERP</span>
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
            {/* 4 Quick Stat Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#222326] border border-gray-800 hover:border-[#D4A72C]/40 transition-colors">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Enrolled Students</span>
                  <Users className="w-4 h-4 text-[#D4A72C]" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">{students.length} Active</h3>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +14% this batch (Sunkadakatte)
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#222326] border border-gray-800 hover:border-[#D4A72C]/40 transition-colors">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Active Projects</span>
                  <FolderGit2 className="w-4 h-4 text-[#D4A72C]" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">{projects.length} Guides</h3>
                <p className="text-[11px] text-[#D4A72C] mt-1">BCA & MCA Degree Tracks</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#222326] border border-gray-800 hover:border-[#D4A72C]/40 transition-colors">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Partner Institutions</span>
                  <Building2 className="w-4 h-4 text-[#D4A72C]" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">{institutions.length} Colleges</h3>
                <p className="text-[11px] text-gray-400 mt-1">Bangalore North Network</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#222326] border border-gray-800 hover:border-[#D4A72C]/40 transition-colors">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Certificates Issued</span>
                  <Award className="w-4 h-4 text-[#D4A72C]" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">{certificates.length} Issued</h3>
                <p className="text-[11px] text-emerald-400 mt-1">QR Code Verifiable</p>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-[#222326] p-6 rounded-2xl border border-gray-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#D4A72C] mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Quick Admin Operations
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <button
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-[#D4A72C] text-left transition-all group cursor-pointer"
                >
                  <UserPlus className="w-5 h-5 text-[#D4A72C] mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-white">Enroll Student</p>
                  <p className="text-[10px] text-gray-400">Generate ID & Batch</p>
                </button>

                <button
                  onClick={() => setIsFeeModalOpen(true)}
                  className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-500 text-left transition-all group cursor-pointer"
                >
                  <DollarSign className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-white">Record Payment</p>
                  <p className="text-[10px] text-gray-400">Print UPI / Cash Receipt</p>
                </button>

                <button
                  onClick={() => setIsCertModalOpen(true)}
                  className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-blue-500 text-left transition-all group cursor-pointer"
                >
                  <Award className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-white">Issue Certificate</p>
                  <p className="text-[10px] text-gray-400">QR Code Verification</p>
                </button>

                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-purple-500 text-left transition-all group cursor-pointer"
                >
                  <FolderGit2 className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-white">Assign Project</p>
                  <p className="text-[10px] text-gray-400">IEEE Title & Mentor</p>
                </button>

                <button
                  onClick={() => setIsBatchModalOpen(true)}
                  className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-cyan-500 text-left transition-all group cursor-pointer"
                >
                  <Layers className="w-5 h-5 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-white">Create Batch</p>
                  <p className="text-[10px] text-gray-400">Slot & Room Schedule</p>
                </button>
              </div>
            </div>

            {/* Recent Students Table */}
            <div className="bg-[#222326] rounded-2xl border border-gray-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Recent Student Admissions & Fee Status</h3>
                  <p className="text-xs text-gray-400">Live synchronization with Sunkadakatte Central Server</p>
                </div>
                <button
                  onClick={() => setActiveTab('Students')}
                  className="text-xs text-[#D4A72C] hover:underline font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <span>View All Students ({students.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                    <tr>
                      <th className="p-3">Student ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">College</th>
                      <th className="p-3">Program</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3">Fee Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredStudents.slice(0, 5).map((std) => (
                      <tr key={std.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#D4A72C]">{std.id}</td>
                        <td className="p-3 font-bold text-white">{std.name}</td>
                        <td className="p-3 text-gray-400">{std.college}</td>
                        <td className="p-3">{std.course}</td>
                        <td className="p-3 font-mono text-gray-300">{std.batch}</td>
                        <td className="p-3">
                          <button
                            onClick={() => toggleStudentFee(std.id)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                              std.fee === 'Paid' 
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800 hover:bg-emerald-900' 
                                : 'bg-amber-950 text-amber-400 border-amber-800 hover:bg-amber-900'
                            }`}
                            title="Click to toggle fee status"
                          >
                            {std.fee} ⟳
                          </button>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteStudent(std.id)}
                            className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/50 cursor-pointer"
                            title="Remove Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                <span className="text-xs font-bold text-gray-300">Total: {filteredStudents.length} Students</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                  Paid: {students.filter(s => s.fee === 'Paid').length}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 text-[10px] font-bold border border-amber-800">
                  Pending: {students.filter(s => s.fee === 'Pending').length}
                </span>
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
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                    <tr>
                      <th className="p-3.5">Student ID</th>
                      <th className="p-3.5">Name</th>
                      <th className="p-3.5">College</th>
                      <th className="p-3.5">Course / Project</th>
                      <th className="p-3.5">Batch</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Progress</th>
                      <th className="p-3.5">Fee Status</th>
                      <th className="p-3.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredStudents.map((std) => (
                      <tr key={std.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-[#D4A72C]">{std.id}</td>
                        <td className="p-3.5 font-bold text-white">{std.name}</td>
                        <td className="p-3.5 text-gray-300">{std.college}</td>
                        <td className="p-3.5">{std.course}</td>
                        <td className="p-3.5 font-mono text-gray-400">{std.batch}</td>
                        <td className="p-3.5 text-gray-400">
                          <div>{std.phone}</div>
                          <div className="text-[10px] text-gray-500">{std.email}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="w-20 bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div className="bg-[#D4A72C] h-full" style={{ width: `${std.progress}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400">{std.progress}%</span>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => toggleStudentFee(std.id)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                              std.fee === 'Paid' 
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800 hover:bg-emerald-900' 
                                : 'bg-amber-950 text-amber-400 border-amber-800 hover:bg-amber-900'
                            }`}
                            title="Click to toggle fee"
                          >
                            {std.fee} ⟳
                          </button>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleDeleteStudent(std.id)}
                            className="p-1.5 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <button
                onClick={() => {
                  const name = prompt('Enter Partner College / Institution Name:');
                  if (name) {
                    const loc = prompt('Enter Location (e.g. Bangalore North):') || 'Bangalore';
                    setInstitutions([...institutions, {
                      id: institutions.length + 1,
                      name,
                      location: loc,
                      type: 'Academic Partner',
                      mouStatus: 'Active',
                      students: 0,
                      contact: 'Coordinator'
                    }]);
                    showToast(`Institution "${name}" added to ERP!`);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Institution</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {institutions.map((inst) => (
                <div key={inst.id} className="bg-[#222326] p-5 rounded-2xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#D4A72C]/20 text-[#D4A72C] border border-[#D4A72C]/30">
                      {inst.type}
                    </span>
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> MoU {inst.mouStatus}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{inst.name}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D4A72C]" /> {inst.location}
                  </p>
                  <div className="pt-3 border-t border-gray-800 flex justify-between items-center text-xs text-gray-300">
                    <span>Contact: {inst.contact}</span>
                    <span className="font-bold text-[#D4A72C]">{inst.students} Students</span>
                  </div>
                </div>
              ))}
            </div>
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
              <button
                onClick={() => {
                  const name = prompt('Employee Name:');
                  if (name) {
                    const role = prompt('Role (e.g. Senior Tech Guide):') || 'Tech Trainer';
                    const dept = prompt('Department:') || 'Training';
                    setEmployees([...employees, {
                      id: `EMP-0${employees.length + 1}`,
                      name,
                      role,
                      dept,
                      email: `${name.toLowerCase().replace(/\s+/g, '')}@gnanacomputech.com`,
                      phone: '9880198800',
                      status: 'Active'
                    }]);
                    showToast(`Employee "${name}" added to ERP roster`);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Employee</span>
              </button>
            </div>

            <div className="bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="p-3.5">Emp ID</th>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#D4A72C]">{emp.id}</td>
                      <td className="p-3.5 font-bold text-white">{emp.name}</td>
                      <td className="p-3.5 text-gray-300">{emp.role}</td>
                      <td className="p-3.5 text-gray-400">{emp.dept}</td>
                      <td className="p-3.5 text-gray-400">{emp.phone} • {emp.email}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <button
                onClick={() => {
                  const title = prompt('Program Title:');
                  if (title) {
                    const fee = prompt('Fee (e.g. ₹8,000):') || '₹8,000';
                    const dur = prompt('Duration (e.g. 10 Weeks):') || '10 Weeks';
                    setPrograms([...programs, {
                      id: `PROG-0${programs.length + 1}`,
                      title,
                      duration: dur,
                      fee,
                      category: 'Professional Track',
                      modules: 'Theory, Practical Labs, Live Project'
                    }]);
                    showToast(`Program "${title}" created`);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Program</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {programs.map((prog) => (
                <div key={prog.id} className="bg-[#222326] p-5 rounded-2xl border border-gray-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#D4A72C]/20 text-[#D4A72C]">
                        {prog.category}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">{prog.fee}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">{prog.title}</h4>
                    <p className="text-xs text-gray-400">Duration: {prog.duration}</p>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">Modules: {prog.modules}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-800 text-[11px] text-gray-400">
                    ID: <span className="font-mono text-[#D4A72C]">{prog.id}</span>
                  </div>
                </div>
              ))}
            </div>
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
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Batch</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {batches.map((b) => (
                <div key={b.code} className="bg-[#222326] p-5 rounded-2xl border border-gray-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-sm text-[#D4A72C]">{b.code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {b.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{b.program}</h4>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>🕒 Timing: <span className="text-white">{b.timing}</span></p>
                    <p>👨‍🏫 Trainer: <span className="text-white">{b.trainer}</span></p>
                    <p>🏢 Location: <span className="text-white">{b.room}</span></p>
                  </div>
                  <div className="pt-3 border-t border-gray-800 flex justify-between text-xs">
                    <span className="text-gray-400">Enrollment:</span>
                    <span className="font-bold text-white">{b.count} / {b.max} Students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 7: ENROLLMENTS APPROVAL QUEUE */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Enrollments' && (
          <div className="space-y-6">
            <div className="bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <h3 className="font-bold text-white text-sm">Pending Online Admissions & Registrations</h3>
              <p className="text-xs text-gray-400">Review student applications received through the public website portal</p>
            </div>

            <div className="bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="p-3.5">App ID</th>
                    <th className="p-3.5">Applicant Name</th>
                    <th className="p-3.5">College</th>
                    <th className="p-3.5">Selected Program</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Application Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {enrollmentQueue.map((enr) => (
                    <tr key={enr.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#D4A72C]">{enr.id}</td>
                      <td className="p-3.5 font-bold text-white">{enr.name}</td>
                      <td className="p-3.5 text-gray-300">{enr.college}</td>
                      <td className="p-3.5">{enr.program}</td>
                      <td className="p-3.5 text-gray-400">{enr.contact}</td>
                      <td className="p-3.5 text-gray-400">{enr.date}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          enr.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {enr.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {enr.status !== 'Approved' ? (
                          <button
                            onClick={() => handleApproveEnrollment(enr.id)}
                            className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Enrolled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                      <option key={b.code} value={b.code}>{b.code} ({b.program})</option>
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
                    <th className="p-3.5">College</th>
                    <th className="p-3.5">Course</th>
                    <th className="p-3.5 text-center">Mark Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {students.map((std) => {
                    const currentStatus = attendanceRecords[std.id] || 'Present';
                    return (
                      <tr key={std.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-[#D4A72C]">{std.id}</td>
                        <td className="p-3.5 font-bold text-white">{std.name}</td>
                        <td className="p-3.5 text-gray-300">{std.college}</td>
                        <td className="p-3.5 text-gray-400">{std.course}</td>
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
                <h3 className="font-bold text-white text-sm">Student Viva-Voce & Project Evaluation Scores</h3>
                <p className="text-xs text-gray-400">IEEE compliance, system design, coding defense, and viva readiness marks</p>
              </div>
              <button
                onClick={() => {
                  const studentName = prompt('Student Name:');
                  if (studentName) {
                    const total = prompt('Total Viva Marks (/100):') || '85';
                    setAssessments([...assessments, {
                      studentId: `GCS-2026-00${assessments.length + 1}`,
                      studentName,
                      synopsis: 22,
                      architecture: 22,
                      coding: 22,
                      viva: 22,
                      total: Number(total),
                      grade: Number(total) >= 90 ? 'A+' : 'A'
                    }]);
                    showToast(`Assessment recorded for ${studentName}`);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Assessment</span>
              </button>
            </div>

            <div className="bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="p-3.5">Student ID</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Synopsis (/25)</th>
                    <th className="p-3.5">Architecture (/25)</th>
                    <th className="p-3.5">Code Defense (/25)</th>
                    <th className="p-3.5">Viva Voce (/25)</th>
                    <th className="p-3.5">Total (/100)</th>
                    <th className="p-3.5">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {assessments.map((a) => (
                    <tr key={a.studentId} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#D4A72C]">{a.studentId}</td>
                      <td className="p-3.5 font-bold text-white">{a.studentName}</td>
                      <td className="p-3.5">{a.synopsis}</td>
                      <td className="p-3.5">{a.architecture}</td>
                      <td className="p-3.5">{a.coding}</td>
                      <td className="p-3.5">{a.viva}</td>
                      <td className="p-3.5 font-bold text-white text-sm">{a.total}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4A72C]/20 text-[#D4A72C] border border-[#D4A72C]/40">
                          {a.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 10: PROJECTS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'Projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#222326] p-4 rounded-2xl border border-gray-800">
              <div>
                <h3 className="font-bold text-white text-sm">Degree Academic & Industry Live Projects</h3>
                <p className="text-xs text-gray-400">Track milestones from IEEE SRS to GitHub source code and viva demonstration</p>
              </div>
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assign New Project</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((prj) => (
                <div key={prj.id} className="bg-[#222326] p-6 rounded-2xl border border-gray-800 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs text-[#D4A72C] font-bold">{prj.id}</span>
                      <h4 className="font-bold text-white text-base mt-1">{prj.title}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#0f766e]/20 text-emerald-400 border border-emerald-800">
                      {prj.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-400 bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <p>👨‍🎓 Student: <span className="text-white font-semibold">{prj.student}</span></p>
                    <p>💻 Tech Stack: <span className="text-emerald-400 font-mono">{prj.stack}</span></p>
                    <p>👨‍🏫 Mentor: <span className="text-white">{prj.mentor}</span></p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800">
                    <span className="text-gray-400 font-medium">Milestone: <strong className="text-[#D4A72C]">{prj.phase}</strong></span>
                    <button
                      onClick={() => {
                        const phases = ['Phase 1: Synopsis', 'Phase 2: DB Schema', 'Phase 3: Integration', 'Phase 4: IEEE Doc', 'Completed'];
                        const currIdx = phases.indexOf(prj.phase);
                        const nextPhase = phases[(currIdx + 1) % phases.length];
                        setProjects(projects.map(p => p.id === prj.id ? { ...p, phase: nextPhase, status: nextPhase === 'Completed' ? 'Completed' : 'In Progress' } : p));
                        showToast(`Project ${prj.id} updated to ${nextPhase}`);
                      }}
                      className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Advance Phase ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">₹47,500</h3>
                <p className="text-[10px] text-gray-400 mt-1">Current Active Batches</p>
              </div>

              <div className="bg-[#222326] p-5 rounded-2xl border border-gray-800">
                <span className="text-xs text-gray-400">Pending Student Dues</span>
                <h3 className="text-2xl font-extrabold text-amber-400 mt-1">₹14,500</h3>
                <p className="text-[10px] text-gray-400 mt-1">2 Students Pending</p>
              </div>

              <div className="bg-[#222326] p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400">Quick Payment</span>
                  <p className="text-xs font-bold text-white mt-1">Record Ledger Entry</p>
                </div>
                <button
                  onClick={() => setIsFeeModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] font-bold text-xs cursor-pointer"
                >
                  + Record Fee
                </button>
              </div>
            </div>

            <div className="bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h4 className="font-bold text-white text-sm">Receipts & Payment Transactions</h4>
                <span className="text-xs text-gray-400">Auto-Generated Receipt Register</span>
              </div>
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="p-3.5">Receipt #</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Program</th>
                    <th className="p-3.5">Amount Paid</th>
                    <th className="p-3.5">Payment Mode</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {transactions.map((tx) => (
                    <tr key={tx.receiptNo} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#D4A72C]">{tx.receiptNo}</td>
                      <td className="p-3.5 font-bold text-white">{tx.student}</td>
                      <td className="p-3.5 text-gray-300">{tx.program}</td>
                      <td className="p-3.5 font-bold text-emerald-400">{tx.amount}</td>
                      <td className="p-3.5 text-gray-400">{tx.mode}</td>
                      <td className="p-3.5 text-gray-400">{tx.date}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <button
                onClick={() => setIsCertModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Certificate</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {certificates.map((cert) => (
                <div key={cert.certId} className="bg-[#222326] p-6 rounded-2xl border border-gray-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-[#D4A72C] font-bold">{cert.certId}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0f766e]/20 text-emerald-400 border border-emerald-800">
                        {cert.grade}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-base">{cert.studentName}</h4>
                    <p className="text-xs text-gray-300 mt-1">{cert.program}</p>
                    <p className="text-[11px] text-gray-400 mt-1">Issue Date: {cert.date}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> QR Verifiable
                    </span>
                    <button
                      onClick={() => setViewCertificateModal(cert)}
                      className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold border border-gray-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#D4A72C]" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                    <option>Full Stack Web Dev (MERN)</option>
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
                      <option key={b.code} value={b.code}>{b.code}</option>
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
      {/* MODAL 2: RECORD FEE PAYMENT */}
      {/* ---------------------------------------------------- */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Record Fee Payment & Receipt
              </h3>
              <button onClick={() => setIsFeeModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordFee} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Select Student</label>
                <select
                  value={newFee.student}
                  onChange={(e) => setNewFee({ ...newFee, student: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.id} - {s.course})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Amount to Collect (₹) *</label>
                <input
                  type="number"
                  required
                  value={newFee.amount}
                  onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-base font-bold font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Payment Method</label>
                <select
                  value={newFee.mode}
                  onChange={(e) => setNewFee({ ...newFee, mode: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                >
                  <option value="UPI / PhonePe / GPay">UPI / PhonePe / GPay</option>
                  <option value="Cash at Sunkadakatte Desk">Cash at Sunkadakatte Desk</option>
                  <option value="Direct Bank Transfer (NEFT/IMPS)">Direct Bank Transfer (NEFT/IMPS)</option>
                  <option value="Debit / Credit Card">Debit / Credit Card</option>
                </select>
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
                  Generate & Print Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: ISSUE CERTIFICATE */}
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
              <div>
                <label className="block text-gray-400 mb-1">Student Recipient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kavya R."
                  value={newCert.studentName}
                  onChange={(e) => setNewCert({ ...newCert, studentName: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Program / Course Title</label>
                <select
                  value={newCert.program}
                  onChange={(e) => setNewCert({ ...newCert, program: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                >
                  <option>BCA Final Year Degree Project Defense</option>
                  <option>MCA Enterprise Software Project Track</option>
                  <option>Full Stack Web Development (MERN)</option>
                  <option>Python & AI Machine Learning Track</option>
                  <option>Java Spring Boot Full Stack</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Performance Grade</label>
                <select
                  value={newCert.grade}
                  onChange={(e) => setNewCert({ ...newCert, grade: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4A72C]"
                >
                  <option value="Grade A+ (Distinction)">Grade A+ (Distinction)</option>
                  <option value="Grade A (Excellent)">Grade A (Excellent)</option>
                  <option value="Grade B+ (Good)">Grade B+ (Good)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-[11px] text-gray-400 space-y-1">
                <p className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Official QR Code Verification
                </p>
                <p>Certificate will be stamped with CIN: U85500KA2025PTC205651</p>
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
                  Issue & Generate Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: ASSIGN PROJECT */}
      {/* ---------------------------------------------------- */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-purple-400" /> Assign Degree Project
              </h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Powered Autonomous Warehouse Fleet"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Assigned Student / Team *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prajwal Gowda & Manoj Kumar"
                  value={newProject.student}
                  onChange={(e) => setNewProject({ ...newProject, student: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Technology Stack</label>
                <input
                  type="text"
                  value={newProject.stack}
                  onChange={(e) => setNewProject({ ...newProject, stack: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Assigned Mentor</label>
                <select
                  value={newProject.mentor}
                  onChange={(e) => setNewProject({ ...newProject, mentor: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                >
                  <option>Naveen Kumar (Principal Architect)</option>
                  <option>Harish Babu (MERN Lead)</option>
                  <option>Sowmya M. (Python/AI Guide)</option>
                </select>
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
                  Assign Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 5: CREATE BATCH */}
      {/* ---------------------------------------------------- */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#222326] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" /> Create Lab Batch
              </h3>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Batch Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCA-2026-B2"
                  value={newBatch.code}
                  onChange={(e) => setNewBatch({ ...newBatch, code: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Program</label>
                <select
                  value={newBatch.program}
                  onChange={(e) => setNewBatch({ ...newBatch, program: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option>BCA Final Year Project</option>
                  <option>MCA Academic Track</option>
                  <option>Full Stack Web Dev (MERN)</option>
                  <option>Python & AI Track</option>
                  <option>Java Spring Boot Full Stack</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newBatch.timing}
                    onChange={(e) => setNewBatch({ ...newBatch, timing: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={newBatch.max}
                    onChange={(e) => setNewBatch({ ...newBatch, max: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Assigned Trainer</label>
                <select
                  value={newBatch.trainer}
                  onChange={(e) => setNewBatch({ ...newBatch, trainer: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option>Naveen Kumar</option>
                  <option>Harish Babu</option>
                  <option>Sowmya M.</option>
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
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 6: VIEW CERTIFICATE PREVIEW */}
      {/* ---------------------------------------------------- */}
      {viewCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white text-[#17181A] rounded-3xl p-8 max-w-2xl w-full border-4 border-[#D4A72C] shadow-2xl relative">
            <button
              onClick={() => setViewCertificateModal(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="border-2 border-dashed border-[#D4A72C]/70 p-6 sm:p-8 rounded-2xl text-center space-y-4 bg-gradient-to-b from-amber-50/40 to-white">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-[#17181A] text-[#D4A72C] flex items-center justify-center font-extrabold text-xl shadow">
                  GCS
                </div>
              </div>

              <span className="text-xs uppercase font-extrabold tracking-widest text-[#0f766e]">
                Gnana Computech Solutions Private Limited
              </span>
              <p className="text-[10px] text-gray-500 font-mono">CIN: U85500KA2025PTC205651 • Sunkadakatte, Bangalore</p>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#17181A] pt-2">
                Certificate of Academic Excellence
              </h2>

              <p className="text-xs text-gray-600">This is to officially certify that</p>
              <h3 className="text-xl sm:text-2xl font-bold text-[#01083f] underline decoration-[#D4A72C] decoration-2">
                {viewCertificateModal.studentName}
              </h3>

              <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed">
                has successfully completed all project modules and viva-voce requirements for the program:
              </p>

              <p className="text-sm font-extrabold text-[#0f766e]">
                {viewCertificateModal.program}
              </p>

              <div className="inline-block px-4 py-1 rounded-full bg-[#D4A72C]/20 border border-[#D4A72C] text-xs font-bold text-[#17181A]">
                {viewCertificateModal.grade}
              </div>

              <div className="pt-6 mt-4 border-t border-gray-200 flex justify-between items-end text-left text-xs">
                <div>
                  <p className="font-mono text-[10px] text-gray-500">Certificate ID: <strong>{viewCertificateModal.certId}</strong></p>
                  <p className="font-mono text-[10px] text-gray-500">Issued On: {viewCertificateModal.date}</p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">✓ Corporate Standard Verified</p>
                </div>
                <div className="text-center">
                  <div className="w-28 border-b border-gray-800 pb-1 mb-1 font-serif italic text-xs">Naveen Kumar</div>
                  <p className="text-[10px] text-gray-500 font-bold">Authorized Signatory</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs flex items-center gap-2 hover:bg-black cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#D4A72C]" />
                <span>Print / Save PDF</span>
              </button>
            </div>
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

    </div>
  );
};
