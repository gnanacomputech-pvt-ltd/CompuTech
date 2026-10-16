import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Search, Sparkles, AlertTriangle, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { Logo } from '../../components/Logo';

// Chrome shared by the admin and staff dashboards: sidebar, header, toast.
//
// `groups` is a list of { label, items: [{ name, icon, count }] } so a menu
// can be presented in labelled sections rather than one long list — the
// staff menu is explicitly ordered student work first, website editing
// second, and the labels are what make that visible.
export const DashboardShell = ({
  title,
  subtitle,
  groups,
  activeTab,
  onTabChange,
  user,
  onLogout,
  search,
  toast,
  // { to, label } for the other console, when this user may open both.
  // Without it an admin can see the staff console exists but has no way in.
  switchConsole,
  children,
}) => {
  const allItems = groups.flatMap((group) => group.items);
  const activeItem = allItems.find((item) => item.name === activeTab);

  return (
    <div className="min-h-screen bg-[#17181A] text-white flex flex-col lg:flex-row max-w-full overflow-x-hidden">

      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold max-w-sm ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-[#0f766e] text-white border border-[#ffcc00]/40'
          }`}
        >
          {toast.type === 'error'
            ? <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            : <Sparkles className="w-4 h-4 text-[#ffcc00] flex-shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-[#222326] border-b lg:border-b-0 lg:border-r border-gray-800 flex-shrink-0 flex flex-col justify-between p-4 lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:z-30 lg:overflow-y-auto">
        <div>
          {/* Logo renders its own link to "/", so this is a plain wrapper —
              nesting an <a> inside an <a> is invalid HTML and React warns. */}
          <div className="block pb-6 pt-2 px-2 border-b border-gray-800">
            <Logo variant="dark" size="normal" stacked={true} />
          </div>

          <div className="mt-4 px-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#D4A72C]">{title}</span>
            {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
          </div>

          <nav className="mt-4 space-y-4 max-h-[50vh] lg:max-h-[58vh] overflow-y-auto pr-1">
            {groups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-3 text-[10px] uppercase tracking-widest font-bold text-gray-600">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => onTabChange(item.name)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#D4A72C] text-[#17181A] shadow-md'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </span>
                      {item.count ? (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                          isActive ? 'bg-[#17181A] text-[#D4A72C]' : 'bg-[#D4A72C] text-[#17181A]'
                        }`}>
                          {item.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-800 mt-4 space-y-3">
          {switchConsole && (
            <Link
              to={switchConsole.to}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#D4A72C] border border-[#D4A72C]/40 hover:bg-[#D4A72C] hover:text-[#17181A] transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{switchConsole.label}</span>
            </Link>
          )}
          <div className="px-3">
            <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Signed in'}</p>
            <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
            {(user?.roles || []).length > 0 && (
              <p className="text-[10px] text-[#D4A72C] mt-1 truncate">
                {user.roles.map((r) => r.replace(/_/g, ' ')).join(' · ')}
              </p>
            )}
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-red-600/20 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-semibold">
              <span>{title}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#D4A72C]">{activeTab}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1 truncate">
              {activeItem?.heading || activeTab}
            </h1>
            {activeItem?.description && (
              <p className="text-xs text-gray-400 mt-1">{activeItem.description}</p>
            )}
          </div>

          {search && (
            <div className="relative w-full lg:w-72 flex-shrink-0">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="search"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder || 'Search…'}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#222326] border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4A72C]"
              />
            </div>
          )}
        </header>

        {children}
      </main>
    </div>
  );
};
