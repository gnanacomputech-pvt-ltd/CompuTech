import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Per-test control over what each endpoint returns, so a screen can be
// rendered both with data and with none.
const responses = new Map();
const posted = [];

function setResponse(match, payload) {
  responses.set(match, payload);
}

function page(results) {
  return { results, count: results.length, total_pages: 1, current_page: 1 };
}

vi.mock('../lib/api/client', () => {
  class ApiError extends Error {
    constructor(code, message) {
      super(typeof message === 'string' ? message : 'Request failed');
      this.code = code;
    }
  }
  const resolve = (url) => {
    for (const [match, payload] of responses) {
      if (String(url).includes(match)) return payload;
    }
    return { results: [], count: 0, total_pages: 1, current_page: 1 };
  };
  return {
    ApiError,
    apiClient: {
      get: vi.fn(async (url) => resolve(url)),
      post: vi.fn(async (url, body) => { posted.push([url, body]); return resolve(url); }),
      patch: vi.fn(async (url, body) => { posted.push([url, body]); return resolve(url); }),
      put: vi.fn(async () => ({})),
      delete: vi.fn(async () => ({})),
    },
  };
});

let currentUser = null;
vi.mock('../lib/auth/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: currentUser,
    isAuthenticated: !!currentUser,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

const { App } = await import('../App');

const STUDENT = { full_name: 'Prajwal Gowda', email: 'p@gcs.test', phone: '9845012345', roles: ['STUDENT'] };
const CONTENT_STAFF = { full_name: 'Sanjay', email: 's@gcs.test', is_staff: true, roles: ['CONTENT_MANAGER'] };

function renderAt(route, user = null) {
  currentUser = user;
  return render(
    <MemoryRouter initialEntries={[route]}><App /></MemoryRouter>,
  );
}

beforeEach(() => {
  responses.clear();
  posted.length = 0;
  currentUser = null;
});

describe('student portal with no records yet', () => {
  // Regression: the dashboard and profile panels dereferenced the very data
  // their empty-state guard was protecting, so a freshly approved student
  // with no enrollment crashed the page instead of seeing "no enrollments".
  it('shows empty states instead of crashing', async () => {
    renderAt('/student/dashboard', STUDENT);
    expect(await screen.findByText(/You have no enrollments yet/i)).toBeTruthy();
  });

  it('shows an empty profile state instead of crashing', async () => {
    renderAt('/student/profile', STUDENT);
    expect(
      await screen.findByText(/student profile has not been created yet/i),
    ).toBeTruthy();
  });

  it.each([
    ['/student/courses', /not enrolled in any course/i],
    ['/student/enrollments', /No enrollments on record/i],
    ['/student/attendance', /No attendance has been recorded/i],
    ['/student/assignments', /No assignments have been set/i],
    ['/student/assessments', /No assessments have been scheduled/i],
    ['/student/projects', /no academic project enrollment/i],
    ['/student/fees', /No invoices have been raised/i],
    ['/student/certificates', /No certificates have been issued/i],
  ])('renders %s with an empty state', async (route, message) => {
    renderAt(route, STUDENT);
    expect(await screen.findByText(message)).toBeTruthy();
  });
});

describe('student portal with real records', () => {
  beforeEach(() => {
    setResponse('students/', page([{
      id: 's1', business_id: 'GCS-STU-2026-000001', usn: 'SI21BCA001',
      degree: 'BCA', branch: 'Computer Applications', semester: 5,
      institution_name: 'Soundarya Institute',
      user_details: { full_name: 'Prajwal Gowda', email: 'p@gcs.test', phone: '9845012345', is_active: true },
      enrollments: [],
    }]));
    setResponse('enrollments/', page([{
      id: 'e1', business_id: 'GCS-ENR-2026-000001', program: 'p1',
      program_title: 'BCA Final Year Project', batch_name: 'BCA-2026-B1',
      status: 'ACTIVE', coordinator_approval: true, attendance_percentage: 92.5,
      institution_name: 'Soundarya Institute',
    }]));
    setResponse('programs/', page([{
      id: 'p1', title: 'BCA Final Year Project', program_type: 'ACADEMIC_PROJECT',
      description: 'Guided final year project.', duration_weeks: 16,
      extra: { topics: ['SRS documentation', 'UML design'], highlights: ['IEEE format'] },
    }]));
  });

  it('shows the active track, batch and real attendance', async () => {
    renderAt('/student/dashboard', STUDENT);
    await waitFor(() => expect(screen.getAllByText('BCA Final Year Project').length).toBeGreaterThan(0));
    expect(screen.getByText('BCA-2026-B1')).toBeTruthy();
    expect(screen.getAllByText(/92\.5%/).length).toBeGreaterThan(0);
  });

  it('shows the real profile record, not placeholder data', async () => {
    renderAt('/student/profile', STUDENT);
    await waitFor(() => expect(screen.getAllByText('Soundarya Institute').length).toBeGreaterThan(0));
    expect(screen.getByText('SI21BCA001')).toBeTruthy();
    expect(screen.getAllByText('GCS-STU-2026-000001').length).toBeGreaterThan(0);
    expect(screen.getByText('Semester 5')).toBeTruthy();
  });

  it('lists the enrolled course with its syllabus from the program record', async () => {
    renderAt('/student/courses', STUDENT);
    expect(await screen.findByText('SRS documentation')).toBeTruthy();
    expect(screen.getByText('UML design')).toBeTruthy();
  });

  it('treats an academic-project enrollment as the project screen', async () => {
    renderAt('/student/projects', STUDENT);
    expect(await screen.findByText('Academic Project')).toBeTruthy();
    expect(screen.getAllByText('BCA Final Year Project').length).toBeGreaterThan(0);
  });
});

describe('public gallery reads live content', () => {
  it('renders uploaded photos and builds filters from their categories', async () => {
    setResponse('content/', page([
      {
        id: 'g1', title: 'Bootcamp Day One', description: 'Live coding.',
        image_src: 'http://server/media/site_content/a.png', image_url: '',
        event_start: '2026-02-01T10:00:00Z', extra: { category: 'Workshops' },
      },
      {
        id: 'g2', title: 'Hackathon Expo', description: 'Project demos.',
        image_src: 'http://server/media/site_content/b.png', image_url: '',
        event_start: '2025-11-01T10:00:00Z', extra: { category: 'Events' },
      },
    ]));

    renderAt('/gallery');
    expect(await screen.findByText('Bootcamp Day One')).toBeTruthy();
    expect(screen.getByText('Hackathon Expo')).toBeTruthy();

    // Filters come from what was actually uploaded.
    expect(screen.getByRole('button', { name: 'Workshops' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Events' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'All' })).toBeTruthy();

    // The uploaded file's URL is what gets rendered.
    const img = screen.getByAltText('Bootcamp Day One');
    expect(img.getAttribute('src')).toBe('http://server/media/site_content/a.png');
  });

  it('filters by category when a filter is clicked', async () => {
    setResponse('content/', page([
      { id: 'g1', title: 'Only Workshop', description: '', image_src: 'http://s/a.png', extra: { category: 'Workshops' } },
      { id: 'g2', title: 'Only Event', description: '', image_src: 'http://s/b.png', extra: { category: 'Events' } },
    ]));

    renderAt('/gallery');
    await screen.findByText('Only Workshop');

    fireEvent.click(screen.getByRole('button', { name: 'Events' }));
    await waitFor(() => expect(screen.queryByText('Only Workshop')).toBeNull());
    expect(screen.getByText('Only Event')).toBeTruthy();
  });

  it('says so plainly when nothing is published', async () => {
    renderAt('/gallery');
    expect(await screen.findByText(/No photos have been published yet/i)).toBeTruthy();
  });
});

describe('public blog reads live content', () => {
  it('renders published articles', async () => {
    setResponse('content/', page([{
      id: 'b1', title: 'Choosing a Final Year Project', subtitle: 'GCS Academic Team',
      description: 'A step-by-step guide.', image_src: 'http://s/cover.png',
      event_start: '2026-02-20T00:00:00Z',
      extra: { category: 'Academic Advice', readTime: '5 min read', content: 'Body text.' },
    }]));

    renderAt('/blogs');
    expect(await screen.findByText('Choosing a Final Year Project')).toBeTruthy();
    expect(screen.getByText(/A step-by-step guide/i)).toBeTruthy();
  });

  it('says so plainly when nothing is published', async () => {
    renderAt('/blogs');
    expect(await screen.findByText(/No articles have been published yet/i)).toBeTruthy();
  });
});

describe('student signup goes to the approval queue', () => {
  it('reports pending approval and never signs the applicant in', async () => {
    setResponse('auth/register/', {
      request_id: 'r1',
      approval_status: 'PENDING',
      _message: 'Account created. A staff member will review and approve it.',
    });

    renderAt('/signup');

    fireEvent.change(await screen.findByPlaceholderText('e.g. Prajwal Gowda'), { target: { value: 'New Student' } });
    fireEvent.change(screen.getByPlaceholderText('student@gmail.com'), { target: { value: 'new@student.test' } });
    fireEvent.change(screen.getByPlaceholderText('9876543210'), { target: { value: '9845000000' } });
    fireEvent.change(screen.getByPlaceholderText('Type your college name'), { target: { value: 'Probe College' } });
    const passwords = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwords[0], { target: { value: 'StrongPass123!' } });
    fireEvent.change(passwords[1], { target: { value: 'StrongPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /Request Student Account/i }));

    expect(await screen.findByText(/Awaiting approval/i)).toBeTruthy();
    expect(screen.getByText(/will review and approve it/i)).toBeTruthy();
    // No session was created for an account that cannot sign in.
    expect(window.localStorage.getItem('gcs_erp_access_token')).toBeNull();

    const [url, body] = posted.find(([u]) => String(u).includes('auth/register/'));
    expect(url).toContain('auth/register/');
    expect(body.college_name).toBe('Probe College');
  });

  it('refuses to submit without a college', async () => {
    renderAt('/signup');

    fireEvent.change(await screen.findByPlaceholderText('e.g. Prajwal Gowda'), { target: { value: 'No College' } });
    fireEvent.change(screen.getByPlaceholderText('student@gmail.com'), { target: { value: 'nc@student.test' } });
    fireEvent.change(screen.getByPlaceholderText('9876543210'), { target: { value: '9845000000' } });
    const passwords = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwords[0], { target: { value: 'StrongPass123!' } });
    fireEvent.change(passwords[1], { target: { value: 'StrongPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /Request Student Account/i }));

    await waitFor(() => expect(
      screen.getAllByText(/Enter your college name|Select your college/i).length,
    ).toBeGreaterThan(0));
    expect(posted.some(([u]) => String(u).includes('auth/register/'))).toBe(false);
  });
});

describe('staff signup', () => {
  it('submits a request and reports that an admin must approve it', async () => {
    setResponse('auth/register-staff/', {
      request_id: 'r2',
      approval_status: 'PENDING',
      _message: 'Staff account request submitted. An administrator will review it.',
    });

    renderAt('/staff-signup');

    fireEvent.change(await screen.findByPlaceholderText('e.g. Naveen Kumar'), { target: { value: 'New Trainer' } });
    fireEvent.change(screen.getByPlaceholderText('name@gnanacomputech.com'), { target: { value: 'trainer@gcs.test' } });
    fireEvent.change(screen.getByPlaceholderText('9876543210'), { target: { value: '9845000001' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Senior Trainer'), { target: { value: 'Senior Trainer' } });
    const passwords = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwords[0], { target: { value: 'StrongPass123!' } });
    fireEvent.change(passwords[1], { target: { value: 'StrongPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /Request Staff Access/i }));

    await waitFor(() => expect(screen.getAllByText(/Request submitted/i).length).toBeGreaterThan(0));
    expect(screen.getByText(/administrator will review it/i)).toBeTruthy();
    expect(window.localStorage.getItem('gcs_erp_access_token')).toBeNull();
  });

  it('offers the roles an applicant may request', async () => {
    renderAt('/staff-signup');
    const select = await screen.findByDisplayValue('Content Manager');
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('CONTENT_MANAGER');
    expect(options).toContain('TRAINER');
    // SUPER_ADMIN must never be self-requestable.
    expect(options).not.toContain('SUPER_ADMIN');
  });
});

describe('staff website-editing screens render', () => {
  it.each([
    ['/staff/gallery', /Upload photo/i],
    ['/staff/blog', /Write article/i],
    ['/staff/courses', /Add course/i],
    ['/staff/internships', /Add internship/i],
    ['/staff/services', /Add service/i],
    ['/staff/events-and-workshops', /Add event/i],
    ['/staff/testimonials', /Add testimonial/i],
    ['/staff/about-gct', /Add block/i],
  ])('renders %s with its create action', async (route, action) => {
    renderAt(route, CONTENT_STAFF);
    expect(await screen.findByRole('button', { name: action })).toBeTruthy();
  });

  it('links each editing screen to the public page it changes', async () => {
    renderAt('/staff/gallery', CONTENT_STAFF);
    const link = await screen.findByRole('link', { name: /View this page on the public website/i });
    expect(link.getAttribute('href')).toBe('/gallery');
  });

  it('shows the sign-up queue on the student screen', async () => {
    renderAt('/staff/student-sign-ups', CONTENT_STAFF);
    expect(await screen.findByText(/Student sign-up requests/i)).toBeTruthy();
  });
});

describe('a role without content rights sees no edit buttons', () => {
  const TRAINER = { full_name: 'Priya', email: 'pr@gcs.test', is_staff: true, roles: ['TRAINER'] };

  it('tells a trainer they can view but not change the website', async () => {
    renderAt('/staff/gallery', TRAINER);
    expect(await screen.findByText(/can view this content but not change it/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Upload photo/i })).toBeNull();
  });

  it('still lets a trainer review student sign-ups', async () => {
    renderAt('/staff/student-sign-ups', TRAINER);
    expect(await screen.findByText(/Student sign-up requests/i)).toBeTruthy();
  });
});

describe('the signup queue shows what a reviewer needs', () => {
  it('lists a pending student with their college and course details', async () => {
    setResponse('signup-requests/', page([{
      id: 'sr1', kind: 'STUDENT', status: 'PENDING',
      full_name: 'Ananya Sharma', email: 'ananya@student.test', phone: '9845012222',
      college: 'Acharya Institute', college_name: 'Acharya Institute',
      degree: 'MCA', semester: 3, usn: 'AC21MCA009',
      created_at: '2026-10-01T09:00:00Z',
    }]));

    renderAt('/staff/student-sign-ups', CONTENT_STAFF);

    expect(await screen.findByText('Ananya Sharma')).toBeTruthy();
    expect(screen.getByText('Acharya Institute')).toBeTruthy();
    expect(screen.getByText(/MCA.*Sem 3.*AC21MCA009/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Approve Ananya Sharma/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Reject Ananya Sharma/i })).toBeTruthy();
  });

  it('asks for confirmation before approving, and says what approval does', async () => {
    setResponse('signup-requests/', page([{
      id: 'sr1', kind: 'STUDENT', status: 'PENDING',
      full_name: 'Ananya Sharma', email: 'ananya@student.test',
      college: 'Acharya Institute', created_at: '2026-10-01T09:00:00Z',
    }]));

    renderAt('/staff/student-sign-ups', CONTENT_STAFF);
    fireEvent.click(await screen.findByRole('button', { name: /Approve Ananya Sharma/i }));

    const dialog = await screen.findByText(/will be able to sign in/i);
    expect(dialog).toBeTruthy();
    expect(screen.getByRole('button', { name: /Approve & Activate/i })).toBeTruthy();
  });
});
