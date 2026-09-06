import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, Layers, UserPlus, 
  CheckSquare, FileBarChart, LogOut, Award
} from 'lucide-react';
import { Logo } from '../../components/Logo';

export const InstitutionDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Derive active tab from current URL path
  const getTabFromPath = () => {
    const path = location.pathname.replace('/institution', '').replace('/', '').toLowerCase();
    const matched = sidebarItems.find(item => item.name.toLowerCase() === path);
    return matched ? matched.name : 'Dashboard';
  };

  const activeTab = getTabFromPath();

  const handleTabClick = (itemName) => {
    const path = itemName === 'Dashboard' ? '/institution/dashboard' : `/institution/${itemName.toLowerCase()}`;
    navigate(path);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#252525] flex flex-col lg:flex-row max-w-full overflow-x-hidden">
      
      {/* Institution Sidebar - Fixed on desktop, scrollable on mobile */}
      <aside className="w-full lg:w-64 bg-[#17181A] text-white flex-shrink-0 flex flex-col justify-between p-4 border-b lg:border-b-0 lg:border-r border-[#D4A72C]/30 lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:z-30 lg:overflow-y-auto">
        <div>
          <div className="pb-6 pt-2 px-2 border-b border-gray-800 flex items-center">
            <Logo variant="dark" size="normal" stacked={true} />
          </div>

          <div className="my-4 p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
            <p className="font-bold text-white truncate">{collegeProfile.name}</p>
            <p className="text-[#D4A72C] font-mono text-[10px] mt-0.5 truncate">{collegeProfile.code}</p>
          </div>

          <nav className="space-y-1 max-h-[50vh] lg:max-h-none overflow-y-auto pr-1">
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
                <div className="flex items-center space-x-3 min-w-0">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.count && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                    activeTab === item.name ? 'bg-[#17181A] text-[#D4A72C]' : 'bg-gray-800 text-[#D4A72C]'
                  }`}>
                    {item.count}
                  </span>
                )}
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
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Institution Portal Content Column */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:ml-64 overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E8E1D2]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#D4A72C] text-[#17181A] flex-shrink-0">
                Partner
              </span>
              <span className="text-xs uppercase font-bold text-[#B88918] tracking-wider">
                Institution Administration • {activeTab}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222326] break-words mt-1">
              {collegeProfile.name} Portal
            </h1>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <Link to="/" className="px-3.5 py-2 rounded-xl bg-[#17181A] text-[#D4A72C] border border-[#D4A72C]/40 text-xs font-bold hover:bg-[#222326] transition-colors inline-flex items-center space-x-1.5">
              <span>Public Website</span>
            </Link>
          </div>
        </div>

        {/* TAB CONTENT SWITCHER */}

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-8">
            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Enrolled Students</span>
                  <Users className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#222326]">120</h3>
                <p className="text-xs text-gray-500 mt-1">BCA & BSc Computer Science</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Active Batches</span>
                  <Layers className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#222326]">3</h3>
                <p className="text-xs text-gray-500 mt-1">MERN & Python Track</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#6B6B6B]">Campus Workshops</span>
                  <Award className="w-5 h-5 text-[#D4A72C] flex-shrink-0" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#222326]">5 Completed</h3>
                <p className="text-xs text-emerald-600 font-semibold mt-1">100% Attendance Compliance</p>
              </div>
            </div>

            {/* Institutional Reports & Batches */}
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-4 sm:p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#222326] mb-4">College Student Progress Reports</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#222326] break-words">Batch BCA-2026-A (Final Year Projects)</h4>
                    <p className="text-gray-500">45 Students • Mentored by GCS Sunkadakatte</p>
                  </div>
                  <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold whitespace-nowrap">100% Code Verified</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#222326] break-words">Batch PY-DATA-2026 (Data Analytics Bootcamp)</h4>
                    <p className="text-gray-500">35 Students • Weekend Track</p>
                  </div>
                  <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold whitespace-nowrap">In Progress</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. STUDENTS TAB */}
        {activeTab === 'Students' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#E8E1D2] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#222326]">Enrolled College Students Directory</h3>
                  <p className="text-xs text-gray-500">Active students from {collegeProfile.name}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#17181A] text-[#D4A72C] font-bold text-xs">Total: 120 Students</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#252525]">
                  <thead className="bg-[#FAFAF7] text-gray-600 uppercase font-bold border-b border-[#E8E1D2]">
                    <tr>
                      <th className="p-3">Student ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Enrolled Course</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3">Progress</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E1D2]">
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-[#B88918]">GCS-2026-BCA04</td>
                      <td className="p-3 font-bold text-[#222326]">Prajwal Gowda</td>
                      <td className="p-3">BCA Final Year Project & MERN Stack</td>
                      <td className="p-3 font-mono">BCA-2026-A</td>
                      <td className="p-3 font-bold text-emerald-600">75%</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Active</span></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-[#B88918]">GCS-2026-BCA09</td>
                      <td className="p-3 font-bold text-[#222326]">Meghana Rao</td>
                      <td className="p-3">BCA Final Year Project Guidance</td>
                      <td className="p-3 font-mono">BCA-2026-A</td>
                      <td className="p-3 font-bold text-emerald-600">65%</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Active</span></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-[#B88918]">GCS-2026-PY02</td>
                      <td className="p-3 font-bold text-[#222326]">Ketan V.</td>
                      <td className="p-3">Python & Data Science Track</td>
                      <td className="p-3 font-mono">PY-DATA-2026</td>
                      <td className="p-3 font-bold text-blue-600">40%</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">In Progress</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. PROGRAMS TAB */}
        {activeTab === 'Programs' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3">Active Institutional Programs</h3>
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-[#D4A72C] text-[#17181A] font-bold text-[10px] uppercase">Academic Degree Track</span>
                    <h4 className="font-bold text-[#222326] text-sm mt-1">BCA Final Year Academic Project & MERN Stack</h4>
                    <p className="text-gray-500 mt-0.5">SRS Documentation, IEEE standard coding, database schema & mock viva voce.</p>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold whitespace-nowrap">45 Enrolled</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-[#17181A] text-[#D4A72C] font-bold text-[10px] uppercase">Skill Certification</span>
                    <h4 className="font-bold text-[#222326] text-sm mt-1">Python, Data Science & Machine Learning Bootcamp</h4>
                    <p className="text-gray-500 mt-0.5">Core Python, Pandas, Machine Learning models and hands-on dataset analytics.</p>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold whitespace-nowrap">35 Enrolled</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. BATCHES TAB */}
        {activeTab === 'Batches' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3">Active Campus & Lab Batches</h3>
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <span className="font-mono font-bold text-[#B88918]">Batch Code: BCA-2026-A</span>
                    <h4 className="font-bold text-[#222326] text-sm mt-0.5">BCA Final Year Project Execution Batch</h4>
                    <p className="text-gray-500 mt-1">Schedule: 09:30 AM - 11:30 AM (Mon - Fri) • Trainer: Naveen Kumar</p>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold whitespace-nowrap">Ongoing</span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <span className="font-mono font-bold text-[#B88918]">Batch Code: PY-DATA-2026</span>
                    <h4 className="font-bold text-[#222326] text-sm mt-0.5">Python & Data Analytics Weekend Batch</h4>
                    <p className="text-gray-500 mt-1">Schedule: 02:30 PM - 04:30 PM (Sat - Sun) • Trainer: Sowmya M.</p>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold whitespace-nowrap">Ongoing</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. ENROLLMENTS TAB */}
        {activeTab === 'Enrollments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3">Institutional Student Registration Log</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#222326]">Prajwal Gowda (GCS-2026-BCA04)</span>
                    <span className="text-gray-500 block text-[11px]">Registered: Jan 15, 2026 • Program: BCA Project & MERN</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">Confirmed</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#222326]">Meghana Rao (GCS-2026-BCA09)</span>
                    <span className="text-gray-500 block text-[11px]">Registered: Jan 20, 2026 • Program: BCA Project Guidance</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">Confirmed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. ATTENDANCE TAB */}
        {activeTab === 'Attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#17181A] text-white p-6 rounded-2xl border border-[#D4A72C]/40 shadow-md">
                <span className="text-xs text-gray-400 uppercase font-bold">Campus Attendance Rate</span>
                <h3 className="text-3xl font-extrabold text-[#D4A72C] mt-1">96%</h3>
                <p className="text-xs text-emerald-400 mt-1 font-semibold">Complies with University Mandate</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <span className="text-xs text-gray-500 uppercase font-bold">Total Conducted Sessions</span>
                <h3 className="text-3xl font-extrabold text-[#222326] mt-1">48</h3>
                <p className="text-xs text-gray-500 mt-1">Across all 3 active batches</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E1D2] shadow-sm">
                <span className="text-xs text-gray-500 uppercase font-bold">ISO Compliance</span>
                <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">100%</h3>
                <p className="text-xs text-gray-500 mt-1">Biometric & Register Verified</p>
              </div>
            </div>
          </div>
        )}

        {/* 7. REPORTS TAB */}
        {activeTab === 'Reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E1D2] p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#222326] border-b border-[#E8E1D2] pb-3">Academic Performance & Progress Analytics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] space-y-2">
                  <span className="text-gray-500 font-semibold block">IEEE Synopsis Approval Rate</span>
                  <h4 className="text-xl font-extrabold text-[#222326]">100% Approved</h4>
                  <p className="text-gray-500">All 45 final year BCA project synopses approved by university panel.</p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] space-y-2">
                  <span className="text-gray-500 font-semibold block">Viva Voce Defense Preparedness</span>
                  <h4 className="text-xl font-extrabold text-emerald-600">92% Ready</h4>
                  <p className="text-gray-500">Mock viva voce trial scheduled for March 20, 2026 at Sunkadakatte Lab.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};

export default InstitutionDashboard;
