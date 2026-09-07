import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, ChevronDown, ShieldCheck, GraduationCap, Building2
} from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './Button';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPortalsOpen, setIsPortalsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsPortalsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Close mobile drawer and dropdown on route change
  useEffect(() => {
    setIsOpen(false);
    setIsPortalsOpen(false);
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
    <header className={`sticky top-0 z-50 transition-all duration-300 shadow-xl ${
      scrolled 
        ? 'bg-[#17181A]/95 backdrop-blur-md border-b border-[#D4A72C]/30 py-2.5 shadow-2xl' 
        : 'bg-[#17181A] border-b border-[#222326] py-3.5 shadow-lg'
    }`}>
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between gap-4 lg:gap-6 xl:gap-8">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo variant="dark" />
          </div>

          {/* Desktop Navigation Center */}
          <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 flex-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-1.5 xl:px-3.5 xl:py-2 text-[13px] xl:text-[14px] font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'text-[#ffcc00] bg-blue-600 font-bold shadow-md'
                      : 'text-[#ffcc00]/80 hover:text-[#ffcc00] hover:bg-white/5'
                  }`
                }
                end={link.path === '/'}
              >
                <span>{link.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right CTA: Portals & Enquire Button */}
          <div className="hidden lg:flex items-center gap-2.5 xl:gap-3.5 flex-shrink-0">
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsPortalsOpen(!isPortalsOpen)}
                className={`text-xs xl:text-sm font-semibold px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-lg border transition-all flex items-center gap-1.5 bg-[#222326] shadow-sm cursor-pointer select-none ${
                  isPortalsOpen
                    ? 'text-[#ffcc00] border-[#ffcc00] bg-white/10'
                    : 'text-[#ffcc00]/90 border-[#D4A72C]/30 hover:text-[#ffcc00] hover:border-[#ffcc00]'
                }`}
                aria-expanded={isPortalsOpen}
              >
                <span>Portals</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${
                  isPortalsOpen ? 'rotate-180 text-[#ffcc00]' : 'text-[#ffcc00]'
                }`} />
              </button>

              {isPortalsOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#17181A] border border-[#D4A72C]/30 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {portalLinks.map((portal) => (
                    <Link
                      key={portal.path}
                      to={portal.path}
                      onClick={() => setIsPortalsOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs xl:text-sm font-medium text-gray-200 hover:text-[#ffcc00] hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <portal.icon className="w-4 h-4 text-[#ffcc00] flex-shrink-0" />
                      <span>{portal.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs xl:text-sm px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>Enquire</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <Link 
              to="/register" 
              className="bg-blue-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg"
            >
              Enquire
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-[#ffcc00] hover:bg-white/10 focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6 text-[#ffcc00]" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="lg:hidden bg-[#17181A] border-b border-[#D4A72C]/30 px-4 sm:px-6 pt-4 pb-6 space-y-4 shadow-2xl">
          <div className="grid grid-cols-2 gap-2 border-b border-gray-800 pb-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'text-[#ffcc00] bg-blue-600 font-bold shadow-sm'
                      : 'text-[#ffcc00]/85 hover:text-[#ffcc00] hover:bg-white/10'
                  }`
                }
                end={link.path === '/'}
              >
                <span>{link.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Portal quick access on mobile */}
          <div>
            <p className="text-xs uppercase font-bold text-gray-300 tracking-wider mb-2.5 px-1">Access Portals</p>
            <div className="grid grid-cols-3 gap-2.5">
              {portalLinks.map((portal) => (
                <Link
                  key={portal.path}
                  to={portal.path}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-center hover:border-[#ffcc00] transition-all hover:scale-[1.02]"
                >
                  <portal.icon className="w-5 h-5 text-[#ffcc00] mb-1.5" />
                  <span className="text-[11px] font-medium text-gray-200 leading-tight">{portal.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Auth buttons on mobile */}
          <div className="pt-1 flex items-center gap-3">
            <Button to="/login" variant="charcoal" size="sm" className="w-full py-2.5">
              Log In
            </Button>
            <Button to="/register" variant="primary" size="sm" className="w-full py-2.5">
              Apply / Register
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

