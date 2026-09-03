import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, UserCheck, ShieldCheck, GraduationCap, Building2 } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './Button';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Courses', path: '/courses' },
    { name: 'Internships', path: '/internships' },
    { name: 'Events', path: '/events' },
    { name: 'Blogs', path: '/blogs' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Contact', path: '/contact' },
  ];

  const portalLinks = [
    { name: 'ERP Admin', path: '/erp/dashboard', icon: ShieldCheck },
    { name: 'Student Portal', path: '/student/dashboard', icon: GraduationCap },
    { name: 'Institution Portal', path: '/institution/dashboard', icon: Building2 },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-[#17181A]/95 backdrop-blur-md border-b border-[#D4A72C]/30 shadow-xl py-3' 
        : 'bg-[#17181A] border-b border-gray-800 py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Logo variant="dark" />

          {/* Desktop Navigation Center */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'text-[#D4A72C] bg-[#D4A72C]/10 font-semibold'
                      : 'text-gray-300 hover:text-[#D4A72C] hover:bg-white/5'
                  }`
                }
                end={link.path === '/'}
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right CTA: Login/Signup & Portals */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="relative group">
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:text-[#D4A72C] hover:border-[#D4A72C] transition-all flex items-center gap-1.5 bg-gray-900/50">
                <span>Portals</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-[#222326] border border-[#E8E1D2]/20 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50">
                {portalLinks.map((portal) => (
                  <Link
                    key={portal.path}
                    to={portal.path}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-200 hover:text-[#D4A72C] hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <portal.icon className="w-4 h-4 text-[#D4A72C]" />
                    <span>{portal.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <Button to="/login" variant="ghost" size="sm" className="text-white hover:text-[#D4A72C]">
              Log In
            </Button>
            <Button to="/signup" variant="primary" size="sm">
              Sign Up
            </Button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <Button to="/register" variant="primary" size="sm" className="text-xs px-2.5 py-1.5">
              Register
            </Button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-300 hover:text-[#D4A72C] hover:bg-gray-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6 text-[#D4A72C]" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="lg:hidden bg-[#17181A] border-b border-[#D4A72C]/30 px-4 pt-3 pb-6 space-y-3 shadow-2xl">
          <div className="grid grid-cols-2 gap-1 border-b border-gray-800 pb-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-[#D4A72C] bg-[#D4A72C]/10 font-bold'
                      : 'text-gray-300 hover:text-[#D4A72C] hover:bg-gray-800'
                  }`
                }
                end={link.path === '/'}
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* Portal quick access on mobile */}
          <div className="pt-2">
            <p className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2 px-1">Access Portals</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {portalLinks.map((portal) => (
                <Link
                  key={portal.path}
                  to={portal.path}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-900 border border-gray-800 text-center hover:border-[#D4A72C] transition-colors"
                >
                  <portal.icon className="w-4 h-4 text-[#D4A72C] mb-1" />
                  <span className="text-[11px] font-medium text-gray-300">{portal.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Auth buttons on mobile */}
          <div className="pt-2 flex items-center gap-3">
            <Button to="/login" variant="charcoal" size="sm" className="w-full">
              Log In
            </Button>
            <Button to="/signup" variant="primary" size="sm" className="w-full">
              Sign Up
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
