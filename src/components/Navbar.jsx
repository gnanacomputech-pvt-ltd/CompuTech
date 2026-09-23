import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, UserCircle2, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../lib/auth/AuthContext';
import { portalHomePath } from '../lib/auth/roles';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // One entry point that adapts to who's signed in, instead of asking the
  // visitor to pick a portal up front — the backend already knows their
  // role (see lib/auth/roles.js), so it just routes them there.
  const dashboardPath = portalHomePath(user);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/login');
  };

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
                      ? 'text-[#17181A] bg-[#ffcc00] font-bold shadow-md'
                      : 'text-[#ffcc00]/80 hover:text-[#ffcc00] hover:bg-white/5'
                  }`
                }
                end={link.path === '/'}
              >
                <span>{link.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right CTA: single role-based entry point + Enquire */}
          <div className="hidden lg:flex items-center gap-2.5 xl:gap-3.5 flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to={dashboardPath}
                  className="text-xs xl:text-sm font-semibold px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-lg border border-[#D4A72C]/30 bg-[#222326] text-[#ffcc00]/90 hover:text-[#ffcc00] hover:border-[#ffcc00] transition-all flex items-center gap-1.5"
                >
                  <UserCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{user?.full_name?.split(' ')[0] || 'Dashboard'}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 rounded-lg border border-[#D4A72C]/30 bg-[#222326] text-[#ffcc00]/70 hover:text-[#ffcc00] hover:border-[#ffcc00] transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs xl:text-sm font-semibold px-4 py-1.5 xl:px-4 xl:py-2 rounded-lg border border-[#D4A72C]/30 bg-[#222326] text-[#ffcc00]/90 hover:text-[#ffcc00] hover:border-[#ffcc00] transition-all flex items-center gap-1.5"
              >
                <UserCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Login</span>
              </Link>
            )}

            <Link
              to="/register"
              className="bg-[#ffcc00] hover:bg-[#e6b800] text-[#17181A] font-extrabold text-xs xl:text-sm px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>Enquire</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <Link
              to="/register"
              className="bg-[#ffcc00] text-[#17181A] font-extrabold text-xs px-3 py-1.5 rounded-lg"
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
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'text-[#17181A] bg-[#ffcc00] font-bold shadow-sm'
                      : 'text-[#ffcc00]/85 hover:text-[#ffcc00] hover:bg-white/10'
                  }`
                }
                end={link.path === '/'}
              >
                <span>{link.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Single role-based entry point on mobile too */}
          <div className="pt-1 flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-xl bg-[#222326] border border-[#D4A72C]/30 text-[#ffcc00] font-bold text-sm flex items-center justify-center gap-2"
                >
                  <UserCircle2 className="w-4 h-4" /> {user?.full_name?.split(' ')[0] || 'Dashboard'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-xl bg-[#222326] border border-[#D4A72C]/30 text-[#ffcc00] font-bold text-sm"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-xl bg-[#ffcc00] text-[#17181A] font-bold text-sm"
                >
                  Apply / Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
