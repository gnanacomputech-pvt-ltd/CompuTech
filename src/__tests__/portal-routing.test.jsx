import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// One mock at the HTTP boundary rather than one per api module: every
// api/* module is built on this client, so mocking it lets the real
// resource/serializer-mapping code run while nothing touches the network.
vi.mock('../lib/api/client', () => {
  class ApiError extends Error {
    constructor(code, message) {
      super(typeof message === 'string' ? message : 'Request failed');
      this.code = code;
    }
  }
  const empty = { results: [], count: 0, total_pages: 1, current_page: 1 };
  const stats = {
    students: { total: 4, active: 4 },
    enrollments: { total: 3, active: 2, completed: 1, applied_pending: 1 },
    batches: { total: 2, active: 1, upcoming: 1 },
    finance: { total_invoiced: 0, total_collected: 0, pending_fees: 0 },
    certificates: { issued: 0, draft: 0, revoked: 0 },
    programs: { total: 5 },
    institutions: { total: 2 },
  };
  const route = (url) => {
    if (String(url).includes('dashboard/stats')) return stats;
    if (String(url).includes('pending-counts')) {
      return { student: 2, staff: 1, institution: 1, total: 4 };
    }
    if (String(url).includes('public/institutions')) return [];
    return empty;
  };
  return {
    ApiError,
    apiClient: {
      get: vi.fn(async (url) => route(url)),
      post: vi.fn(async () => ({})),
      patch: vi.fn(async () => ({})),
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

// Imported after the mocks so App picks them up.
const { App } = await import('../App');

const ADMIN = { full_name: 'Owner', email: 'admin@gcs.test', is_superuser: true, is_staff: true, roles: ['SUPER_ADMIN'] };
const CONTENT_STAFF = { full_name: 'Sanjay', email: 'sanjay@gcs.test', is_staff: true, roles: ['CONTENT_MANAGER'] };
const TRAINER = { full_name: 'Priya', email: 'priya@gcs.test', is_staff: true, roles: ['TRAINER'] };
const STUDENT = { full_name: 'Prajwal', email: 'prajwal@gcs.test', roles: ['STUDENT'] };

function renderAt(route, user = null) {
  currentUser = user;
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
}

// Each console prints its name twice by design: once as the sidebar label
// and once in the header breadcrumb. findAllByText keeps that from reading
// as a failure.
async function expectConsole(name) {
  const found = await screen.findAllByText(name);
  expect(found.length).toBeGreaterThan(0);
  return found;
}

function consoleIsAbsent(name) {
  return screen.queryAllByText(name).length === 0;
}

// The sidebar <aside> is the menu. Both dashboards also mention screen
// names in their "start here" cards, so menu assertions have to be scoped
// here rather than to the whole document.
function sidebar() {
  const aside = document.querySelector('aside');
  expect(aside).toBeTruthy();
  return within(aside);
}

// A menu button's accessible name includes its pending-count badge
// ("Institutions 1"), so match on the leading label rather than the whole
// string.
const menuItem = (label) => (name) => name === label || name.startsWith(`${label} `);

beforeEach(() => { currentUser = null; });

describe('the staff console is reachable', () => {
  // The reported bug: "there is no staff dashboard". The owner's account is
  // SUPER_ADMIN, which lands on /admin, and /staff used to bounce it
  // straight to /login — so the console looked like it did not exist.
  it('renders for an admin who navigates to it directly', async () => {
    renderAt('/staff/dashboard', ADMIN);
    await expectConsole('Staff Console');
    expect(screen.queryByText(/Sign In to GCS Portal/i)).toBeNull();
  });

  it('renders for an ordinary staff account', async () => {
    renderAt('/staff/dashboard', CONTENT_STAFF);
    await expectConsole('Staff Console');
  });

  it('offers an admin a link into it from the admin console', async () => {
    renderAt('/admin/dashboard', ADMIN);
    const link = await screen.findByRole('link', { name: /open staff console/i });
    expect(link.getAttribute('href')).toBe('/staff/dashboard');
  });

  it('offers an admin the way back out of it', async () => {
    renderAt('/staff/dashboard', ADMIN);
    const link = await screen.findByRole('link', { name: /back to admin console/i });
    expect(link.getAttribute('href')).toBe('/admin/dashboard');
  });

  it('does not offer non-admin staff a link into the admin console', async () => {
    renderAt('/staff/dashboard', CONTENT_STAFF);
    await expectConsole('Staff Console');
    expect(screen.queryByRole('link', { name: /admin console/i })).toBeNull();
  });
});

describe('console access by role', () => {
  it('lands an admin on the admin console', async () => {
    renderAt('/admin/dashboard', ADMIN);
    await expectConsole('Admin Console');
  });

  it('redirects staff away from the admin console to their own', async () => {
    renderAt('/admin/dashboard', CONTENT_STAFF);
    await expectConsole('Staff Console');
    expect(consoleIsAbsent('Admin Console')).toBe(true);
  });

  it('redirects a student away from both consoles to their portal', async () => {
    renderAt('/admin/dashboard', STUDENT);
    expect(await screen.findByText(/Welcome, Prajwal/i)).toBeTruthy();
  });

  it('sends a signed-out visitor to the login page, not a blank console', async () => {
    renderAt('/staff/dashboard', null);
    expect(await screen.findByText(/Sign In to GCS Portal/i)).toBeTruthy();
  });

  it('redirects the retired /erp route to the right console per role', async () => {
    renderAt('/erp/dashboard', ADMIN);
    await expectConsole('Admin Console');
    cleanup();

    renderAt('/erp/dashboard', TRAINER);
    await expectConsole('Staff Console');
  });
});

describe('staff menu structure', () => {
  it('puts student work before website editing, as two labelled blocks', async () => {
    renderAt('/staff/dashboard', CONTENT_STAFF);
    await expectConsole('Staff Console');

    const menu = sidebar();
    const students = menu.getByText('1. Students');
    const website = menu.getByText('2. Website Content');
    // compareDocumentPosition: 4 means `website` follows `students`.
    expect(students.compareDocumentPosition(website) & 4).toBeTruthy();
  });

  it('offers every screen that was asked for', async () => {
    renderAt('/staff/dashboard', CONTENT_STAFF);
    await expectConsole('Staff Console');

    const menu = sidebar();
    for (const item of [
      'Student Sign-ups', 'Student Register',
      'Courses', 'Internships', 'Services', 'Events & Workshops',
      'Blog', 'Gallery', 'Testimonials', 'About GCT',
    ]) {
      expect(menu.getByRole('button', { name: menuItem(item) })).toBeTruthy();
    }
  });

  it('badges the number of student sign-ups waiting', async () => {
    renderAt('/staff/dashboard', CONTENT_STAFF);
    await expectConsole('Staff Console');
    const signups = sidebar().getByRole('button', { name: menuItem('Student Sign-ups') });
    await waitFor(() => expect(signups.textContent).toMatch(/2/));
  });
});

describe('admin menu structure', () => {
  it('offers exactly the screens that were asked for', async () => {
    renderAt('/admin/dashboard', ADMIN);
    await expectConsole('Admin Console');

    const menu = sidebar();
    for (const item of ['Students', 'Institutions', 'Staff Access', 'Programs', 'Enrollments']) {
      expect(menu.getByRole('button', { name: menuItem(item) })).toBeTruthy();
    }
  });

  it('does not offer the screens that were asked to be removed', async () => {
    renderAt('/admin/dashboard', ADMIN);
    await expectConsole('Admin Console');

    const menu = sidebar();
    for (const removed of ['Fees', 'Batches', 'Attendance', 'Assignments', 'Projects', 'Certificates']) {
      expect(menu.queryByRole('button', { name: menuItem(removed) })).toBeNull();
    }
  });
});

describe('public pages render', () => {
  const PAGES = [
    ['/', /Gnana Computech/i],
    ['/gallery', /Activity Gallery/i],
    ['/blogs', /Technical Articles/i],
    ['/signup', /Create Your GCS Account/i],
    ['/staff-signup', /Staff Account Request/i],
    ['/login', /Sign In to GCS Portal/i],
  ];

  it.each(PAGES)('renders %s', async (route, heading) => {
    renderAt(route, null);
    await waitFor(() => expect(screen.getAllByText(heading).length).toBeGreaterThan(0));
  });
});

describe('staff signup is findable', () => {
  it('is linked from the login page', async () => {
    renderAt('/login', null);
    const link = await screen.findByRole('link', { name: /request staff access/i });
    expect(link.getAttribute('href')).toBe('/staff-signup');
  });

  it('is linked from the student signup page', async () => {
    renderAt('/signup', null);
    const links = await screen.findAllByRole('link', { name: /staff sign up/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((l) => l.getAttribute('href') === '/staff-signup')).toBe(true);
  });

  it('is linked from the site footer', async () => {
    renderAt('/', null);
    const links = await screen.findAllByRole('link', { name: /staff sign up/i });
    expect(links.some((l) => l.getAttribute('href') === '/staff-signup')).toBe(true);
  });
});
