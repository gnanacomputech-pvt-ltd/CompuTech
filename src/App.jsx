import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { NoticeTicker } from './components/NoticeTicker';
import { FloatingWidgets } from './components/FloatingWidgets';
import { Footer } from './components/Footer';

// Pages
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Services } from './pages/Services';
import { ServiceDetails } from './pages/ServiceDetails';
import { Courses } from './pages/Courses';
import { CourseDetails } from './pages/CourseDetails';
import { Internships } from './pages/Internships';
import { Events } from './pages/Events';
import { EventDetails } from './pages/EventDetails';
import { Blogs } from './pages/Blogs';
import { BlogDetails } from './pages/BlogDetails';
import { GalleryPage } from './pages/GalleryPage';
import { TestimonialsPage } from './pages/TestimonialsPage';
import { Contact } from './pages/Contact';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { StaffSignup } from './pages/StaffSignup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

// Portals
import { AdminDashboard } from './portals/admin/AdminDashboard';
import { StaffDashboard } from './portals/staff/StaffDashboard';
import { StudentDashboard } from './portals/student/StudentDashboard';
import { InstitutionDashboard } from './portals/institution/InstitutionDashboard';
import { ProtectedRoute } from './lib/auth/ProtectedRoute';
import { PortalRedirect } from './lib/auth/PortalRedirect';

// Helper component to scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App = () => {
  const { pathname } = useLocation();

  // Check if current route is inside a portal dashboard (to hide public header & footer)
  const isPortal = ['/admin', '/staff/', '/erp', '/student', '/institution']
    .some((prefix) => pathname.startsWith(prefix))
    // /staff-signup is a public page, unlike every other /staff route.
    || pathname === '/staff';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAFAF7]">
      <ScrollToTop />
      
      {!isPortal && (
        <>
          <Navbar />
          <NoticeTicker />
        </>
      )}

      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/internships" element={<Internships />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:id" element={<BlogDetails />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/staff-signup" element={<StaffSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin console — SUPER_ADMIN / ADMIN (see lib/auth/roles.js) */}
          <Route path="/admin/*" element={
            <ProtectedRoute portal="admin"><AdminDashboard /></ProtectedRoute>
          } />

          {/* Staff console — every other ERP staff role */}
          <Route path="/staff/*" element={
            <ProtectedRoute portal="staff"><StaffDashboard /></ProtectedRoute>
          } />

          {/* The single ERP dashboard was split into the two above. Old
              links and bookmarks land on whichever one the role grants. */}
          <Route path="/erp/*" element={<PortalRedirect />} />

          {/* Student Portal UI */}
          <Route path="/student/*" element={
            <ProtectedRoute portal="student"><StudentDashboard /></ProtectedRoute>
          } />

          {/* Institution Portal UI */}
          <Route path="/institution/*" element={
            <ProtectedRoute portal="institution"><InstitutionDashboard /></ProtectedRoute>
          } />

          {/* Fallback route */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {!isPortal && (
        <>
          <FloatingWidgets />
          <Footer />
        </>
      )}
    </div>
  );
};
export default App;
