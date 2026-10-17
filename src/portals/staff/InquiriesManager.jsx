import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, Phone, Calendar, Clock, CheckCircle2, MessageSquare,
  Search, RefreshCw, Eye, Edit3, User, Building, ExternalLink,
  FolderGit2, Briefcase, Users, Code, BookOpen, MapPin, Sparkles
} from 'lucide-react';
import {
  SectionCard, AsyncState, TableWrap, Badge, ModalShell, Field, INPUT_CLASS,
} from '../shared/ui';
import { staffInquiriesApi } from '../../lib/api/public';
import { ApiError } from '../../lib/api/client';

export const InquiriesManager = ({ initialSection = 'projects', showToast }) => {
  const [subTab, setSubTab] = useState(initialSection); 
  // 'projects' | 'internships' | 'events' | 'courses' | 'contacts'

  const [projectRegistrations, setProjectRegistrations] = useState([]);
  const [internshipRegistrations, setInternshipRegistrations] = useState([]);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [courseRegistrations, setCourseRegistrations] = useState([]);
  const [contactInquiries, setContactInquiries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Selected item for detail / note modal
  const [activeItem, setActiveItem] = useState(null);
  const [modalType, setModalType] = useState(null); 
  // 'project' | 'internship' | 'event' | 'course' | 'contact'
  const [staffNote, setStaffNote] = useState('');
  const [itemStatus, setItemStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialSection) {
      setSubTab(initialSection);
    }
  }, [initialSection]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projRes, intRes, evtRes, crsRes, cntRes] = await Promise.all([
        staffInquiriesApi.listProjectRegistrations({ ordering: '-created_at' }).catch(() => ({ results: [] })),
        staffInquiriesApi.listInternshipRegistrations({ ordering: '-created_at' }).catch(() => ({ results: [] })),
        staffInquiriesApi.listEventRegistrations({ ordering: '-created_at' }).catch(() => ({ results: [] })),
        staffInquiriesApi.listRegistrationInquiries({ ordering: '-created_at' }).catch(() => ({ results: [] })),
        staffInquiriesApi.listContactInquiries({ ordering: '-created_at' }).catch(() => ({ results: [] })),
      ]);

      setProjectRegistrations(projRes.results || projRes || []);
      setInternshipRegistrations(intRes.results || intRes || []);
      setEventRegistrations(evtRes.results || evtRes || []);
      setCourseRegistrations(crsRes.results || crsRes || []);
      setContactInquiries(cntRes.results || cntRes || []);
    } catch (err) {
      setError(
        err instanceof ApiError && typeof err.message === 'string'
          ? err.message
          : 'Could not load registration inquiries. Please check your network connection.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleOpenDetail = (item, type) => {
    setActiveItem(item);
    setModalType(type);
    setStaffNote(item.staff_notes || '');
    setItemStatus(item.status || 'NEW');
  };

  const handleSaveModal = async () => {
    if (!activeItem || !modalType) return;
    setSaving(true);
    try {
      if (modalType === 'project') {
        const updated = await staffInquiriesApi.updateProjectRegistration(activeItem.id, {
          status: itemStatus,
          staff_notes: staffNote,
        });
        setProjectRegistrations((prev) =>
          prev.map((it) => (it.id === activeItem.id ? { ...it, ...updated } : it))
        );
      } else if (modalType === 'internship') {
        const updated = await staffInquiriesApi.updateInternshipRegistration(activeItem.id, {
          status: itemStatus,
          staff_notes: staffNote,
        });
        setInternshipRegistrations((prev) =>
          prev.map((it) => (it.id === activeItem.id ? { ...it, ...updated } : it))
        );
      } else if (modalType === 'event') {
        const updated = await staffInquiriesApi.updateEventRegistration(activeItem.id, {
          status: itemStatus,
          staff_notes: staffNote,
        });
        setEventRegistrations((prev) =>
          prev.map((it) => (it.id === activeItem.id ? { ...it, ...updated } : it))
        );
      } else if (modalType === 'course') {
        const updated = await staffInquiriesApi.updateRegistrationInquiry(activeItem.id, {
          status: itemStatus,
          staff_notes: staffNote,
        });
        setCourseRegistrations((prev) =>
          prev.map((it) => (it.id === activeItem.id ? { ...it, ...updated } : it))
        );
      } else if (modalType === 'contact') {
        const updated = await staffInquiriesApi.updateContactInquiry(activeItem.id, {
          status: itemStatus,
          staff_notes: staffNote,
        });
        setContactInquiries((prev) =>
          prev.map((it) => (it.id === activeItem.id ? { ...it, ...updated } : it))
        );
      }

      showToast?.('Details updated successfully', 'success');
      setActiveItem(null);
    } catch (err) {
      showToast?.(
        err instanceof ApiError && typeof err.message === 'string'
          ? err.message
          : 'Failed to update record',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusTone = (status) => {
    switch (status) {
      case 'NEW':
      case 'PENDING':
        return 'amber';
      case 'CONTACTED':
      case 'REVIEWING':
      case 'INTERVIEW_SCHEDULED':
      case 'IN_PROGRESS':
        return 'blue';
      case 'CONFIRMED':
      case 'ACCEPTED':
      case 'ONBOARDED':
      case 'COMPLETED':
      case 'ENROLLED':
      case 'ATTENDED':
      case 'RESOLVED':
        return 'green';
      case 'REJECTED':
      case 'CANCELLED':
      case 'CLOSED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const q = search.toLowerCase();

  const filteredProjects = projectRegistrations.filter((it) =>
    (it.full_name || '').toLowerCase().includes(q) ||
    (it.email || '').toLowerCase().includes(q) ||
    (it.phone || '').includes(q) ||
    (it.college || '').toLowerCase().includes(q) ||
    (it.project_domain || '').toLowerCase().includes(q) ||
    (it.project_title || '').toLowerCase().includes(q)
  );

  const filteredInternships = internshipRegistrations.filter((it) =>
    (it.full_name || '').toLowerCase().includes(q) ||
    (it.email || '').toLowerCase().includes(q) ||
    (it.phone || '').includes(q) ||
    (it.college || '').toLowerCase().includes(q) ||
    (it.internship_track || '').toLowerCase().includes(q)
  );

  const filteredEvents = eventRegistrations.filter((it) =>
    (it.full_name || '').toLowerCase().includes(q) ||
    (it.email || '').toLowerCase().includes(q) ||
    (it.phone || '').includes(q) ||
    (it.event_title || '').toLowerCase().includes(q) ||
    (it.college_or_organization || '').toLowerCase().includes(q)
  );

  const filteredCourses = courseRegistrations.filter((it) =>
    (it.full_name || '').toLowerCase().includes(q) ||
    (it.email || '').toLowerCase().includes(q) ||
    (it.phone || '').includes(q) ||
    (it.college || '').toLowerCase().includes(q) ||
    (it.course || '').toLowerCase().includes(q) ||
    (it.program || '').toLowerCase().includes(q)
  );

  const filteredContacts = contactInquiries.filter((it) =>
    (it.name || '').toLowerCase().includes(q) ||
    (it.email || '').toLowerCase().includes(q) ||
    (it.phone || '').includes(q) ||
    (it.subject || '').toLowerCase().includes(q) ||
    (it.message || '').toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6">
      {/* Subtab selection & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#17181A] rounded-xl border border-gray-800">
          <button
            type="button"
            onClick={() => setSubTab('projects')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'projects'
                ? 'bg-[#D4A72C] text-[#17181A] shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Projects ({projectRegistrations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('internships')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'internships'
                ? 'bg-[#D4A72C] text-[#17181A] shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Internships ({internshipRegistrations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('events')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'events'
                ? 'bg-[#D4A72C] text-[#17181A] shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events ({eventRegistrations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('courses')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'courses'
                ? 'bg-[#D4A72C] text-[#17181A] shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Courses ({courseRegistrations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('contacts')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'contacts'
                ? 'bg-[#D4A72C] text-[#17181A] shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Enquiries ({contactInquiries.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, phone, college..."
              className={`${INPUT_CLASS} pl-9`}
            />
          </div>
          <button
            type="button"
            onClick={loadAllData}
            title="Refresh list"
            className="p-2 rounded-xl border border-gray-700 bg-[#17181A] text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. Academic Projects Registrations */}
      {subTab === 'projects' && (
        <SectionCard
          title={`Academic & Final Year Project Registrations (${filteredProjects.length})`}
          description="BCA, MCA, BE/BTech project guidance applications submitted from the /register-project form."
        >
          <AsyncState
            loading={loading}
            error={error}
            isEmpty={filteredProjects.length === 0}
            onRetry={loadAllData}
            emptyMessage={search ? 'No project registrations match your search.' : 'No project registrations yet.'}
          >
            <TableWrap headers={['Student / Team Lead', 'College & Degree', 'Domain & Tech', 'Team Size', 'Date', 'Status', 'Actions']}>
              {filteredProjects.map((item) => (
                <tr key={item.id} className="text-gray-300 hover:bg-[#17181A]/60">
                  <td className="py-3 pr-4">
                    <span className="font-bold text-white block">{item.full_name}</span>
                    <a
                      href={`mailto:${item.email}`}
                      className="text-[11px] text-[#D4A72C] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span>{item.email}</span>
                    </a>
                    {item.phone && (
                      <a
                        href={`tel:${item.phone}`}
                        className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{item.phone}</span>
                      </a>
                    )}
                  </td>
                  <td className="py-3 pr-4 max-w-[200px]">
                    <span className="font-semibold text-white block truncate">{item.college}</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      {item.degree} {item.year_or_semester ? `• ${item.year_or_semester}` : ''}
                    </span>
                  </td>
                  <td className="py-3 pr-4 max-w-[220px]">
                    <span className="font-semibold text-white block truncate">{item.project_domain}</span>
                    <span className="text-[11px] text-[#D4A72C] block mt-0.5 truncate">
                      {item.project_title || item.preferred_technology || 'Custom topic'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-gray-300 whitespace-nowrap">
                    {item.team_size}
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-gray-400 whitespace-nowrap">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short'
                    }) : '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={getStatusTone(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(item, 'project')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </TableWrap>
          </AsyncState>
        </SectionCard>
      )}

      {/* 2. IT / Software Internship Applications */}
      {subTab === 'internships' && (
        <SectionCard
          title={`Internship Applications (${filteredInternships.length})`}
          description="Applications for corporate and technical internships submitted from the /register-internship form."
        >
          <AsyncState
            loading={loading}
            error={error}
            isEmpty={filteredInternships.length === 0}
            onRetry={loadAllData}
            emptyMessage={search ? 'No internship applications match your search.' : 'No internship applications yet.'}
          >
            <TableWrap headers={['Candidate', 'College & Semester', 'Track & Duration', 'Work Mode', 'Start Date', 'Status', 'Actions']}>
              {filteredInternships.map((item) => (
                <tr key={item.id} className="text-gray-300 hover:bg-[#17181A]/60">
                  <td className="py-3 pr-4">
                    <span className="font-bold text-white block">{item.full_name}</span>
                    <a
                      href={`mailto:${item.email}`}
                      className="text-[11px] text-[#D4A72C] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span>{item.email}</span>
                    </a>
                    {item.phone && (
                      <a
                        href={`tel:${item.phone}`}
                        className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{item.phone}</span>
                      </a>
                    )}
                  </td>
                  <td className="py-3 pr-4 max-w-[200px]">
                    <span className="font-semibold text-white block truncate">{item.college}</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      {item.degree} {item.semester ? `• ${item.semester}` : ''}
                    </span>
                  </td>
                  <td className="py-3 pr-4 max-w-[220px]">
                    <span className="font-semibold text-white block truncate">{item.internship_track}</span>
                    <span className="text-[11px] text-[#D4A72C] block mt-0.5">
                      {item.duration}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-gray-300 whitespace-nowrap">
                    {item.mode}
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-gray-400 whitespace-nowrap">
                    {item.start_date || 'Flexible'}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={getStatusTone(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(item, 'internship')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </TableWrap>
          </AsyncState>
        </SectionCard>
      )}

      {/* 3. Event & Workshop Registrations */}
      {subTab === 'events' && (
        <SectionCard
          title={`Event & Workshop Registrations (${filteredEvents.length})`}
          description="Passes and seat reservations submitted from the /register-event form and Event Details."
        >
          <AsyncState
            loading={loading}
            error={error}
            isEmpty={filteredEvents.length === 0}
            onRetry={loadAllData}
            emptyMessage={search ? 'No event registrations match your search.' : 'No event registrations yet.'}
          >
            <TableWrap headers={['Attendee', 'Event / Workshop', 'Institution / Org', 'Passes', 'Mode', 'Status', 'Actions']}>
              {filteredEvents.map((item) => (
                <tr key={item.id} className="text-gray-300 hover:bg-[#17181A]/60">
                  <td className="py-3 pr-4">
                    <span className="font-bold text-white block">{item.full_name}</span>
                    <a
                      href={`mailto:${item.email}`}
                      className="text-[11px] text-[#D4A72C] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span>{item.email}</span>
                    </a>
                    {item.phone && (
                      <a
                        href={`tel:${item.phone}`}
                        className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{item.phone}</span>
                      </a>
                    )}
                  </td>
                  <td className="py-3 pr-4 max-w-[240px]">
                    <span className="font-semibold text-white block truncate">{item.event_title}</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      Type: {item.attendee_type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-gray-300 max-w-[180px] truncate">
                    {item.college_or_organization}
                  </td>
                  <td className="py-3 pr-4 text-xs font-bold text-[#D4A72C] whitespace-nowrap">
                    {item.ticket_count} Pass(es)
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-gray-300 whitespace-nowrap">
                    {item.participation_mode}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={getStatusTone(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(item, 'event')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </TableWrap>
          </AsyncState>
        </SectionCard>
      )}

      {/* 4. Course Registrations */}
      {subTab === 'courses' && (
        <SectionCard
          title={`Course Admissions & Pre-Registrations (${filteredCourses.length})`}
          description="Direct candidate applications submitted from the /register course admission form."
        >
          <AsyncState
            loading={loading}
            error={error}
            isEmpty={filteredCourses.length === 0}
            onRetry={loadAllData}
            emptyMessage={search ? 'No registrations match your search.' : 'No course registrations yet.'}
          >
            <TableWrap headers={['Candidate', 'Program / Course', 'College', 'Batch Date', 'Status', 'Actions']}>
              {filteredCourses.map((reg) => (
                <tr key={reg.id} className="text-gray-300 hover:bg-[#17181A]/60">
                  <td className="py-3 pr-4">
                    <span className="font-bold text-white block">{reg.full_name}</span>
                    <a
                      href={`mailto:${reg.email}`}
                      className="text-[11px] text-[#D4A72C] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span>{reg.email}</span>
                    </a>
                    {reg.phone && (
                      <a
                        href={`tel:${reg.phone}`}
                        className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{reg.phone}</span>
                      </a>
                    )}
                  </td>
                  <td className="py-3 pr-4 max-w-[200px]">
                    <span className="font-semibold text-white block truncate">
                      {reg.course || reg.program || 'Course Application'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-gray-300 max-w-[180px] truncate">
                    {reg.college || '—'}
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-gray-400 whitespace-nowrap">
                    {reg.preferred_date || 'Flexible'}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={getStatusTone(reg.status)}>{reg.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(reg, 'course')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </TableWrap>
          </AsyncState>
        </SectionCard>
      )}

      {/* 5. Contact & General Enquiries */}
      {subTab === 'contacts' && (
        <SectionCard
          title={`Enquiries & Contact Messages (${filteredContacts.length})`}
          description="Inquiries received from the /enquire and /contact pages."
        >
          <AsyncState
            loading={loading}
            error={error}
            isEmpty={filteredContacts.length === 0}
            onRetry={loadAllData}
            emptyMessage={search ? 'No inquiries match your search filter.' : 'No enquiries received yet.'}
          >
            <TableWrap headers={['Submitter', 'Subject / Topic', 'Message', 'Date', 'Status', 'Actions']}>
              {filteredContacts.map((inq) => (
                <tr key={inq.id} className="text-gray-300 hover:bg-[#17181A]/60">
                  <td className="py-3 pr-4">
                    <span className="font-bold text-white block">{inq.name}</span>
                    <a
                      href={`mailto:${inq.email}`}
                      className="text-[11px] text-[#D4A72C] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span>{inq.email}</span>
                    </a>
                    {inq.phone && (
                      <a
                        href={`tel:${inq.phone}`}
                        className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{inq.phone}</span>
                      </a>
                    )}
                  </td>
                  <td className="py-3 pr-4 max-w-[180px]">
                    <span className="font-semibold text-white block truncate">{inq.subject}</span>
                    {inq.staff_notes && (
                      <span className="text-[10px] text-amber-400 italic block mt-0.5 truncate">
                        Note: {inq.staff_notes}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 max-w-[240px]">
                    <p className="text-[11px] text-gray-300 line-clamp-2 whitespace-pre-line">
                      {inq.message}
                    </p>
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-gray-400 whitespace-nowrap">
                    {inq.created_at ? new Date(inq.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short'
                    }) : '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={getStatusTone(inq.status)}>{inq.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(inq, 'contact')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </TableWrap>
          </AsyncState>
        </SectionCard>
      )}

      {/* Detail / Update Status Modal */}
      {activeItem && (
        <ModalShell
          title={
            modalType === 'project' ? 'Project Registration Details' :
            modalType === 'internship' ? 'Internship Application Details' :
            modalType === 'event' ? 'Event Registration Details' :
            modalType === 'course' ? 'Course Registration Details' :
            'Contact Enquiry Details'
          }
          description="Review candidate details, update status, and manage private coordinator notes."
          onClose={() => setActiveItem(null)}
          onSave={handleSaveModal}
          saveLabel={saving ? 'Saving...' : 'Save Updates'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#17181A] border border-gray-800">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500">Full Name</label>
                <p className="text-sm font-bold text-white mt-0.5">
                  {activeItem.full_name || activeItem.name}
                </p>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500">Contact Number</label>
                <div className="flex items-center gap-2 mt-0.5">
                  <a
                    href={`tel:${activeItem.phone}`}
                    className="text-xs font-semibold text-[#D4A72C] hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{activeItem.phone}</span>
                  </a>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500">Email Address</label>
                <div className="flex items-center gap-2 mt-0.5">
                  <a
                    href={`mailto:${activeItem.email}`}
                    className="text-xs font-semibold text-[#D4A72C] hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{activeItem.email}</span>
                  </a>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500">Submitted On</label>
                <p className="text-xs text-gray-300 mt-0.5">
                  {activeItem.created_at ? new Date(activeItem.created_at).toLocaleString('en-IN') : '—'}
                </p>
              </div>
            </div>

            {/* Custom fields per type */}
            {modalType === 'project' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">College & Degree</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800 font-medium">
                      {activeItem.college} • {activeItem.degree} {activeItem.year_or_semester ? `(${activeItem.year_or_semester})` : ''}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">Team Size</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800">
                      {activeItem.team_size}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">Project Domain</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800">
                      {activeItem.project_domain}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">Preferred Technology</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800">
                      {activeItem.preferred_technology || 'Not specified'}
                    </p>
                  </div>
                </div>

                {activeItem.project_title && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">Project Title Idea</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800 font-semibold text-[#D4A72C]">
                      {activeItem.project_title}
                    </p>
                  </div>
                )}
              </div>
            )}

            {modalType === 'internship' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">Internship Track</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800 font-semibold text-[#D4A72C]">
                      {activeItem.internship_track}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">Duration & Mode</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800">
                      {activeItem.duration} • {activeItem.mode}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">College & Semester</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800">
                      {activeItem.college} ({activeItem.semester})
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">Start Date</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800">
                      {activeItem.start_date || 'Flexible'}
                    </p>
                  </div>
                </div>

                {activeItem.skills_or_portfolio && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">Skills & Portfolio</label>
                    <p className="text-xs text-gray-300 p-2.5 rounded-lg bg-[#17181A] border border-gray-800">
                      {activeItem.skills_or_portfolio}
                    </p>
                  </div>
                )}
              </div>
            )}

            {modalType === 'event' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">Event / Workshop</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800 font-semibold text-[#D4A72C]">
                      {activeItem.event_title}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">Organization / College</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800">
                      {activeItem.college_or_organization}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">Passes Reserved</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800">
                      {activeItem.ticket_count} Attendee(s) • Type: {activeItem.attendee_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">Participation Mode</label>
                    <p className="text-xs text-white p-2.5 rounded-lg bg-[#17181A] border border-gray-800">
                      {activeItem.participation_mode}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message / Additional notes for all types */}
            {activeItem.message && (
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Submitted Notes / Message</label>
                <div className="text-xs text-gray-300 p-3 rounded-lg bg-[#17181A] border border-gray-800 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                  {activeItem.message}
                </div>
              </div>
            )}

            {/* Status & Staff internal notes */}
            <div className="pt-2 border-t border-gray-800 space-y-3">
              <Field label="Status">
                <select
                  value={itemStatus}
                  onChange={(e) => setItemStatus(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {modalType === 'project' ? (
                    <>
                      <option value="NEW">NEW - Newly Registered</option>
                      <option value="CONTACTED">CONTACTED - Counseling in Progress</option>
                      <option value="CONFIRMED">CONFIRMED - Topic & Guide Confirmed</option>
                      <option value="IN_PROGRESS">IN_PROGRESS - Development Ongoing</option>
                      <option value="COMPLETED">COMPLETED - Delivered & Viva Prepared</option>
                      <option value="REJECTED">REJECTED - Cancelled</option>
                    </>
                  ) : modalType === 'internship' ? (
                    <>
                      <option value="NEW">NEW - Newly Applied</option>
                      <option value="REVIEWING">REVIEWING - Profile Under Review</option>
                      <option value="INTERVIEW_SCHEDULED">INTERVIEW_SCHEDULED - Technical Round</option>
                      <option value="ACCEPTED">ACCEPTED - Offer Letter Sent</option>
                      <option value="ONBOARDED">ONBOARDED - Joined Track</option>
                      <option value="REJECTED">REJECTED - Ineligible</option>
                    </>
                  ) : modalType === 'event' ? (
                    <>
                      <option value="CONFIRMED">CONFIRMED - Pass Reserved</option>
                      <option value="PENDING">PENDING - Verification Pending</option>
                      <option value="ATTENDED">ATTENDED - Session Attended</option>
                      <option value="CANCELLED">CANCELLED - Registration Cancelled</option>
                    </>
                  ) : (
                    <>
                      <option value="NEW">NEW - Newly Received</option>
                      <option value="CONTACTED">CONTACTED - Reached Out</option>
                      <option value="CONVERTED">CONVERTED / RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </>
                  )}
                </select>
              </Field>

              <Field label="Staff Internal Notes" hint="Private notes visible only to ERP staff">
                <textarea
                  rows={3}
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  placeholder="e.g. Spoke with team lead, scheduled synopsis guidance on Saturday 11 AM..."
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};
export default InquiriesManager;
