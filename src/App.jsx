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

// Portals
import { ErpDashboard } from './portals/erp/ErpDashboard';
import { StudentDashboard } from './portals/student/StudentDashboard';
import { InstitutionDashboard } from './portals/institution/InstitutionDashboard';

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
  const isPortal = pathname.startsWith('/erp') || pathname.startsWith('/student') || pathname.startsWith('/institution');

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

          {/* ERP Portal UI */}
          <Route path="/erp" element={<ErpDashboard />} />
          <Route path="/erp/dashboard" element={<ErpDashboard />} />

          {/* Student Portal UI */}
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />

          {/* Institution Portal UI */}
          <Route path="/institution" element={<InstitutionDashboard />} />
          <Route path="/institution/dashboard" element={<InstitutionDashboard />} />

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
