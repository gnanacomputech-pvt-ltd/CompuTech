import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building2, UserCheck, BookOpen, Layers, UserPlus, 
  CheckSquare, FileSpreadsheet, FolderGit2, GraduationCap, DollarSign, Award, 
  Settings, LogOut, Bell, Search, TrendingUp, Calendar, AlertCircle, ChevronRight
} from 'lucide-react';
import { Logo } from '../../components/Logo';

export const ErpDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  const sidebarItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Students', icon: Users, count: 480 },
    { name: 'Institutions', icon: Building2, count: 18 },
    { name: 'Employees', icon: UserCheck, count: 24 },
    { name: 'Programs', icon: BookOpen },
    { name: 'Batches', icon: Layers },
    { name: 'Enrollments', icon: UserPlus },
    { name: 'Attendance', icon: CheckSquare },
    { name: 'Assessments', icon: FileSpreadsheet },
    { name: 'Projects', icon: FolderGit2, count: 145 },
    { name: 'Courses', icon: GraduationCap },
    { name: 'Fees', icon: DollarSign },
    { name: 'Certificates', icon: Award },
    { name: 'Settings', icon: Settings },
  ];

  const mockStudents = [
    { id: 'GCS-2026-001', name: 'Prajwal Gowda', course: 'BCA Final Year Project', status: 'Active', batch: 'BCA-2026-B1', fee: 'Paid' },
    { id: 'GCS-2026-002', name: 'Kavya R.', course: 'Full Stack Web Dev', status: 'Active', batch: 'MERN-2026-A', fee: 'Paid' },
    { id: 'GCS-2026-003', name: 'Sharath Kumar', course: 'Python & Data Science', status: 'Completed', batch: 'PY-2025-C', fee: 'Paid' },
    { id: 'GCS-2026-004', name: 'Nithin V.', course: 'MCA Academic Track', status: 'Active', batch: 'MCA-2026-B', fee: 'Pending' },
  ];

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#17181A] text-white flex flex-col lg:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-[#222326] border-b lg:border-b-0 lg:border-r border-gray-800 flex-shrink-0 flex flex-col justify-between p-4">
        <div>
          <div className="pb-6 pt-2 px-2 border-b border-gray-800 flex items-center justify-between">
            <Logo variant="dark" size="normal" />
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#D4A72C] text-[#17181A]">ERP v2.4</span>
          </div>

          <nav className="mt-4 space-y-1 max-h-[65vh] overflow-y-auto pr-1">
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
                <div className="flex items-center space-x-2.5">
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.count && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
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
        <div className="pt-4 border-t border-gray-800 space-y-2">
          <div className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
            <div className="text-xs">
              <p className="font-bold text-white">GCS Admin Office</p>
              <p className="text-[10px] text-[#D4A72C]">Sunkadakatte HQ</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout ERP</span>
          </button>
        </div>
      </aside>

      {/* Main ERP Dashboard Area */}
      <main className="flex-1 bg-[#17181A] p-4 sm:p-8 overflow-y-auto">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-800">
          <div>
            <span className="text-xs uppercase font-bold text-[#D4A72C] tracking-wider">Staff Management System</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">GCS Central ERP Dashboard</h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search students, projects, fees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4A72C] w-60"
              />
            </div>
            
            <button className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-[#D4A72C] relative">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#D4A72C] absolute top-1 right-1" />
            </button>

            <Link to="/" className="px-3 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] text-xs font-bold hover:bg-[#B88918] transition-colors">
              Public Website
            </Link>
          </div>
        </div>

        {/* 4 Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-[#222326] border border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Total Enrolled Students</span>
              <Users className="w-4 h-4 text-[#D4A72C]" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">480</h3>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +14% this month (Sunkadakatte)
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#222326] border border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Active Academic Projects</span>
              <FolderGit2 className="w-4 h-4 text-[#D4A72C]" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">145</h3>
            <p className="text-[11px] text-[#D4A72C] mt-1">BCA & MCA Final Year Track</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#222326] border border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Partner Institutions</span>
              <Building2 className="w-4 h-4 text-[#D4A72C]" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">18</h3>
            <p className="text-[11px] text-gray-400 mt-1">Colleges in Bangalore North</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#222326] border border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Certificates Issued</span>
              <Award className="w-4 h-4 text-[#D4A72C]" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">1,250+</h3>
            <p className="text-[11px] text-emerald-400 mt-1">ISO 9001:2015 Verifiable</p>
          </div>
        </div>

        {/* Data Table: Recent Enrolled Students */}
        <div className="bg-[#222326] rounded-2xl border border-gray-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Recent Student Registrations & Projects</h3>
            <span className="text-xs text-[#D4A72C] font-semibold">Real-time ERP Ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900 text-gray-400 uppercase font-bold border-b border-gray-800">
                <tr>
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Program / Course</th>
                  <th className="p-3">Batch Code</th>
                  <th className="p-3">Fee Status</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {mockStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#D4A72C]">{std.id}</td>
                    <td className="p-3 font-bold text-white">{std.name}</td>
                    <td className="p-3">{std.course}</td>
                    <td className="p-3 font-mono text-gray-400">{std.batch}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        std.fee === 'Paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {std.fee}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                        {std.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ERP Quick Actions & Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#222326] p-6 rounded-2xl border border-gray-800 space-y-4">
            <h4 className="font-bold text-white text-base">Quick Admin Operations</h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-left hover:border-[#D4A72C] transition-colors">
                <UserPlus className="w-5 h-5 text-[#D4A72C] mb-1" />
                <p className="text-xs font-bold text-white">Enroll New Student</p>
                <p className="text-[10px] text-gray-400">Generate ID & Ledger</p>
              </button>
              <button className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-left hover:border-[#D4A72C] transition-colors">
                <Award className="w-5 h-5 text-[#D4A72C] mb-1" />
                <p className="text-xs font-bold text-white">Issue Certificate</p>
                <p className="text-[10px] text-gray-400">ISO QR Verification</p>
              </button>
            </div>
          </div>

          <div className="bg-[#222326] p-6 rounded-2xl border border-gray-800 space-y-3">
            <h4 className="font-bold text-white text-base">Upcoming ERP Tasks & Events</h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-between">
                <span className="text-gray-300">BCA Project Synopsis Submissions</span>
                <span className="text-[#D4A72C] font-bold">March 28</span>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-between">
                <span className="text-gray-300">Soundarya College Workshop Setup</span>
                <span className="text-[#D4A72C] font-bold">April 05</span>
              </div>
            </div>
          </div>
        </div>

      </main>

    </div>
  );
};
