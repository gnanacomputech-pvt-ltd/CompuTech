import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, UserCheck, Users, BookOpen, Briefcase, Info, Calendar,
  Quote, Wrench, Newspaper, Image as ImageIcon, Mail, Phone, ExternalLink,
} from 'lucide-react';
import { DashboardShell } from '../shared/DashboardShell';
import { SignupQueue, ApprovalNote } from '../shared/SignupQueue';
import {
  SectionCard, StatTile, Badge, AsyncState, TableWrap,
} from '../shared/ui';
import { ContentSectionManager } from './ContentSectionManager';
import { ProgramManager } from './ProgramManager';
import { useAuth } from '../../lib/auth/AuthContext';
import { canWriteDomain } from '../../lib/auth/permissions';
import { isAdminUser } from '../../lib/auth/roles';
import { students as studentsApi, institutions as institutionsApi } from '../../lib/api/core';
import { signupRequests } from '../../lib/api/signup';
import { GALLERY_CATEGORIES, BLOG_CATEGORIES } from '../../lib/api/content';
import { useCrudResource } from '../../lib/hooks/useCrudResource';

// Staff dashboard.
//
// The menu is deliberately ordered in two blocks: student work first (who is
// waiting to be let in, and who is already on the register), then everything
// that edits the public website. Each website screen writes the same records
// the public pages read, so a change here shows up on the site immediately —
// which is the whole point of moving gallery and blog off hardcoded data.
const MENU = [
  {
    label: 'Overview',
    items: [{
      name: 'Dashboard', icon: LayoutDashboard,
      heading: 'Staff Overview',
      description: 'What needs your attention, and what the public site is currently showing.',
    }],
  },
  {
    label: '1. Students',
    items: [
      {
        name: 'Student Sign-ups', icon: UserCheck,
        heading: 'Student Sign-ups',
        description: 'Accept or reject new student registrations. Nobody can sign in until you approve them.',
      },
      {
        name: 'Student Register', icon: Users,
        heading: 'Student Register',
        description: 'Every approved student, their college and their enrolments.',
      },
    ],
  },
  {
    label: '2. Website Content',
    items: [
      {
        name: 'Courses', icon: BookOpen,
        heading: 'Courses',
        description: 'The training catalog on the public Courses page — add, edit, hide or delete.',
      },
      {
        name: 'Internships', icon: Briefcase,
        heading: 'Internships',
        description: 'Internship tracks shown on the public Internships page.',
      },
      {
        name: 'Services', icon: Wrench,
        heading: 'Technology Services',
        description: 'The service offerings on the public Services page.',
      },
      {
        name: 'Events & Workshops', icon: Calendar,
        heading: 'Events & Workshops',
        description: 'Upcoming and past events. Anything dated in the past shows under “previous”.',
      },
      {
        name: 'Blog', icon: Newspaper,
        heading: 'Blog Articles',
        description: 'Articles on the public Blogs page, including the full article body.',
      },
      {
        name: 'Gallery', icon: ImageIcon,
        heading: 'Photo Gallery',
        description: 'Upload photos straight to the public Gallery page.',
      },
      {
        name: 'Testimonials', icon: Quote,
        heading: 'Testimonials',
        description: 'Student and partner stories shown across the site.',
      },
      {
        name: 'About GCT', icon: Info,
        heading: 'About Gnana Computech',
        description: 'The About page’s own content blocks.',
      },
    ],
  },
];

const PUBLIC_LINKS = {
  Courses: '/courses',
  Internships: '/internships',
  Services: '/services',
  'Events & Workshops': '/events',
  Blog: '/blogs',
  Gallery: '/gallery',
  Testimonials: '/testimonials',
  'About GCT': '/about',
};

export const StaffDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // UI-only mirror of the backend's role tiers — a Trainer can approve
  // students but has no write access to the site CMS or the course catalog,
  // so showing them edit buttons would just earn them a 403.
  const canEditWebsite = canWriteDomain(user, 'content');

  const [pendingCounts, setPendingCounts] = useState({ student: 0, total: 0 });
  const loadPendingCounts = useCallback(() => {
    signupRequests.pendingCounts()
      .then(setPendingCounts)
      .catch(() => { /* a missing badge count isn't worth an error banner */ });
  }, []);
  useEffect(() => { loadPendingCounts(); }, [loadPendingCounts]);

  const studentsRes = useCrudResource(studentsApi);
  const [institutions, setInstitutions] = useState([]);
  useEffect(() => {
    institutionsApi.list({ page_size: 200, ordering: 'name' })
      .then((data) => setInstitutions(data.results || []))
      .catch(() => setInstitutions([]));
  }, []);

  // ------------------------------------------------------------- routing
  const allItems = useMemo(() => MENU.flatMap((group) => group.items), []);

  const slugFor = (name) => name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const activeTab = useMemo(() => {
    const slug = location.pathname.replace('/staff', '').replace(/^\//, '').toLowerCase();
    const matched = allItems.find((item) => slugFor(item.name) === slug);
    return matched ? matched.name : 'Dashboard';
  }, [location.pathname, allItems]);

  const handleTabChange = (name) => {
    navigate(`/staff/${name === 'Dashboard' ? 'dashboard' : slugFor(name)}`);
    setSearchTerm('');
  };

  const groups = useMemo(() => MENU.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      count: item.name === 'Student Sign-ups' ? pendingCounts.student : undefined,
    })),
  })), [pendingCounts]);

  const term = searchTerm.trim().toLowerCase();
  const filteredStudents = useMemo(() => {
    if (!term) return studentsRes.items;
    return studentsRes.items.filter((s) =>
      (s.user_details?.full_name || '').toLowerCase().includes(term)
      || (s.user_details?.email || '').toLowerCase().includes(term)
      || (s.business_id || '').toLowerCase().includes(term)
      || (s.usn || '').toLowerCase().includes(term)
      || (s.institution_name || '').toLowerCase().includes(term));
  }, [studentsRes.items, term]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const publicLink = PUBLIC_LINKS[activeTab];

  return (
    <DashboardShell
      title="Staff Console"
      subtitle="Gnana Computech Solutions"
      groups={groups}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      user={user}
      onLogout={handleLogout}
      toast={toast}
      switchConsole={isAdminUser(user)
        ? { to: '/admin/dashboard', label: 'Back to admin console' }
        : null}
      search={activeTab === 'Student Register' ? {
        value: searchTerm,
        onChange: setSearchTerm,
        placeholder: 'Search students…',
      } : null}
    >
      {/* A direct link to the page being edited, so staff can check the
          result on the live site without hunting for it. */}
      {publicLink && (
        <a
          href={publicLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#D4A72C] hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" /> View this page on the public website
        </a>
      )}

      {!canEditWebsite && activeTab !== 'Dashboard' && activeTab !== 'Student Sign-ups' && activeTab !== 'Student Register' && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/40 p-4 text-xs text-amber-300">
          Your role can view this content but not change it. Ask an administrator for the
          Content Manager role if you need to edit the website.
        </div>
      )}

      {/* ----------------------------------------------------- DASHBOARD */}
      {activeTab === 'Dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatTile
              label="Student sign-ups waiting" icon={UserCheck} tone="amber"
              value={pendingCounts.student}
              hint="Nobody can sign in until approved"
            />
            <StatTile
              label="Students on register" icon={Users} tone="gold"
              value={studentsRes.total || studentsRes.items.length}
              hint="Approved and active accounts"
            />
            <StatTile
              label="Website sections you manage" icon={Newspaper} tone="blue"
              value={8}
              hint="Courses, internships, services, events, blog, gallery, testimonials, about"
            />
          </div>

          <SectionCard title="Start here" description="The two things this dashboard is for.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleTabChange('Student Sign-ups')}
                className="text-left rounded-2xl border border-gray-800 bg-[#17181A] p-4 hover:border-[#D4A72C] transition-colors"
              >
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">1. Students</span>
                <p className="text-sm font-bold text-white mt-1">Review student sign-ups</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {pendingCounts.student
                    ? `${pendingCounts.student} waiting for a decision`
                    : 'Nothing waiting right now'}
                </p>
              </button>
              <button
                onClick={() => handleTabChange('Gallery')}
                className="text-left rounded-2xl border border-gray-800 bg-[#17181A] p-4 hover:border-[#D4A72C] transition-colors"
              >
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">2. Website</span>
                <p className="text-sm font-bold text-white mt-1">Edit the public website</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Photos, courses, events, articles and more — changes go live immediately
                </p>
              </button>
            </div>
            <div className="mt-4"><ApprovalNote /></div>
          </SectionCard>
        </div>
      )}

      {/* ------------------------------------------- 1. STUDENT SIGN-UPS */}
      {activeTab === 'Student Sign-ups' && (
        <SignupQueue
          kind="STUDENT"
          title="Student sign-up requests"
          description="Approving creates the student's profile and lets them sign in. Rejecting keeps them locked out and emails them why."
          showToast={showToast}
          institutions={institutions}
          allowInstitutionOverride
          onDecided={() => { loadPendingCounts(); studentsRes.load(); }}
        />
      )}

      {/* ----------------------------------------- 1. STUDENT REGISTER */}
      {activeTab === 'Student Register' && (
        <SectionCard
          title={`Approved students (${filteredStudents.length})`}
          description="Everyone who has been approved and can sign in."
        >
          <AsyncState
            loading={studentsRes.loading}
            error={studentsRes.error}
            isEmpty={filteredStudents.length === 0}
            onRetry={studentsRes.load}
            emptyMessage={term ? 'No students match your search.' : 'No approved students yet.'}
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

      {/* ------------------------------------------- 2. WEBSITE CONTENT */}
      {activeTab === 'Courses' && (
        <ProgramManager
          programType="COURSE"
          title="Courses"
          description="These are the records the public Courses page reads, and the same ones students get enrolled into."
          addLabel="Add course"
          showToast={showToast}
          canWrite={canEditWebsite}
          config={{
            highlightColumn: 'Category',
            highlightKey: 'category',
            titlePlaceholder: 'Full Stack Web Development (JAVA/PYTHON)',
            codePlaceholder: 'CRS-FULLSTACK-WEB',
            extras: [
              { key: 'category', label: 'Category', placeholder: 'Software Engineering' },
              { key: 'level', label: 'Level', placeholder: 'Beginner to Advanced' },
              { key: 'mode', label: 'Mode', placeholder: 'Classroom & Online' },
              { key: 'topics', label: 'Syllabus topics', type: 'list', placeholder: 'HTML5, CSS3, JavaScript\nReact.js & Tailwind' },
              { key: 'highlights', label: 'Highlights', type: 'list', placeholder: '4 Live Projects\nPlacement Support' },
            ],
          }}
        />
      )}

      {activeTab === 'Internships' && (
        <ProgramManager
          programType="INTERNSHIP"
          title="Internships"
          description="Internship tracks on the public Internships page."
          addLabel="Add internship"
          showToast={showToast}
          canWrite={canEditWebsite}
          config={{
            highlightColumn: 'Domain',
            highlightKey: 'domain',
            titlePlaceholder: 'Full Stack Software Internship',
            codePlaceholder: 'INT-FULLSTACK',
            extras: [
              { key: 'domain', label: 'Domain', placeholder: 'Web Development' },
              { key: 'mode', label: 'Mode', placeholder: 'On-site, Sunkadakatte' },
              { key: 'stipend', label: 'Stipend', placeholder: 'Performance based' },
              { key: 'eligibility', label: 'Eligibility', placeholder: 'BCA / MCA / BE final year' },
              { key: 'skills', label: 'Skills gained', type: 'list', placeholder: 'React.js\nREST APIs' },
              { key: 'learnings', label: 'What interns learn', type: 'list', placeholder: 'Agile sprint workflow\nCode reviews' },
            ],
          }}
        />
      )}

      {activeTab === 'Services' && (
        <ContentSectionManager
          section="service"
          title="Technology services"
          description="The offerings listed on the public Services page."
          addLabel="Add service"
          showToast={showToast}
          canWrite={canEditWebsite}
          config={{
            titleLabel: 'Service name',
            titlePlaceholder: 'Custom Web Application Development',
            descriptionLabel: 'Description',
            descriptionHint: 'Used on both the services list and the detail page.',
            image: false,
            extras: [
              { key: 'iconName', label: 'Icon name', hint: 'A lucide-react icon name, e.g. Code, Cloud, Smartphone.', placeholder: 'Code' },
              { key: 'features', label: 'Features', type: 'list', placeholder: 'Responsive UI\nREST API integration' },
              { key: 'technologies', label: 'Technologies', type: 'list', placeholder: 'React\nDjango\nPostgreSQL' },
            ],
            columns: [
              { header: 'Features', render: (item) => ((item.extra || {}).features || []).length },
            ],
          }}
        />
      )}

      {activeTab === 'Events & Workshops' && (
        <ContentSectionManager
          section="event"
          title="Events & workshops"
          description="Dated entries on the public Events page. Past dates automatically move to “previous events”."
          addLabel="Add event"
          showToast={showToast}
          canWrite={canEditWebsite}
          config={{
            titleLabel: 'Event name',
            titlePlaceholder: 'Full Stack Development Bootcamp',
            descriptionLabel: 'Description',
            image: 'upload',
            dateLabel: 'Starts',
            showEventEnd: true,
            locationLabel: 'Location',
            extras: [
              { key: 'category', label: 'Category', placeholder: 'Workshop' },
              { key: 'seatsAvailable', label: 'Seats available', placeholder: '40' },
              { key: 'agenda', label: 'Agenda', type: 'list', placeholder: '10:00 — Registration\n10:30 — Session 1' },
            ],
            columns: [
              {
                header: 'When',
                render: (item) => (item.event_start
                  ? new Date(item.event_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Date TBA'),
              },
            ],
          }}
        />
      )}

      {activeTab === 'Blog' && (
        <ContentSectionManager
          section="blog"
          title="Blog articles"
          description="Published to the public Blogs page. The article body supports “### Heading” lines and blank-line paragraphs."
          addLabel="Write article"
          showToast={showToast}
          canWrite={canEditWebsite}
          config={{
            titleLabel: 'Article title',
            titlePlaceholder: 'How to Choose the Best BCA Final Year Project Topic',
            subtitleLabel: 'Author',
            subtitlePlaceholder: 'Gnana Computech Academic Team',
            descriptionLabel: 'Summary',
            descriptionHint: 'The short teaser shown on the article card.',
            image: 'upload',
            dateLabel: 'Publish date',
            extras: [
              { key: 'category', label: 'Category', options: BLOG_CATEGORIES },
              { key: 'readTime', label: 'Read time', hint: 'Leave blank to estimate it from the article length.', placeholder: '5 min read' },
              {
                key: 'content', label: 'Article body', type: 'longtext',
                hint: 'Separate paragraphs with a blank line. Start a line with ### for a heading.',
                placeholder: 'Choosing your final year project is one of the most critical decisions…\n\n### 1. Avoid generic projects\n…',
              },
            ],
            columns: [
              { header: 'Category', render: (item) => (item.extra || {}).category || '—' },
            ],
          }}
        />
      )}

      {activeTab === 'Gallery' && (
        <ContentSectionManager
          section="gallery"
          title="Photo gallery"
          description="Photos uploaded here appear on the public Gallery page straight away."
          addLabel="Upload photo"
          showToast={showToast}
          canWrite={canEditWebsite}
          config={{
            titleLabel: 'Photo title',
            titlePlaceholder: 'Hands-on Full Stack Development Bootcamp',
            descriptionLabel: 'Caption',
            image: 'upload',
            dateLabel: 'Photo date',
            extras: [
              {
                key: 'category', label: 'Category', options: GALLERY_CATEGORIES,
                hint: 'Becomes a filter button on the public gallery.',
              },
            ],
            columns: [
              { header: 'Category', render: (item) => (item.extra || {}).category || '—' },
            ],
          }}
        />
      )}

      {activeTab === 'Testimonials' && (
        <ContentSectionManager
          section="testimonial"
          title="Testimonials"
          description="Student and partner stories. These appear on the home page and the Testimonials page."
          addLabel="Add testimonial"
          showToast={showToast}
          canWrite={canEditWebsite}
          config={{
            titleLabel: 'Person’s name',
            titlePlaceholder: 'Prajwal Gowda',
            subtitleLabel: 'Role',
            subtitlePlaceholder: 'BCA Final Year Student',
            descriptionLabel: 'Testimonial',
            descriptionHint: 'What they said, in their own words.',
            image: 'upload',
            locationLabel: 'College / company',
            extras: [
              { key: 'rating', label: 'Rating (1–5)', type: 'number', placeholder: '5' },
            ],
            columns: [
              { header: 'Rating', render: (item) => `${(item.extra || {}).rating ?? 5} ★` },
            ],
          }}
        />
      )}

      {activeTab === 'About GCT' && (
        <ContentSectionManager
          section="about"
          title="About Gnana Computech"
          description="Content blocks on the public About page."
          addLabel="Add block"
          showToast={showToast}
          canWrite={canEditWebsite}
          config={{
            titleLabel: 'Heading',
            titlePlaceholder: 'Who We Are',
            subtitleLabel: 'Sub-heading',
            descriptionLabel: 'Body text',
            image: 'upload',
            extras: [
              { key: 'highlights', label: 'Highlights', type: 'list', placeholder: 'ISO 9001:2015 certified\n500+ students trained' },
            ],
          }}
        />
      )}
    </DashboardShell>
  );
};
