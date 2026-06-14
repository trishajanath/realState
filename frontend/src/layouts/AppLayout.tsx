import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useCompareStore } from '../store/useCompareStore';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Map,
  BarChart3,
  LogOut,
  Menu,
  Building2,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Map', path: '/map', icon: Map },
  { name: 'Compare', path: '/compare', icon: ArrowLeftRight },
];

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { selectedIds, clear } = useCompareStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userName = localStorage.getItem('user_name') || 'User';

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    window.location.href = '/login';
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:flex ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: '280px',
          backgroundColor: '#000000',
          borderRight: '1px solid #1F1F1F',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6"
          style={{ height: '64px', borderBottom: '1px solid #1F1F1F', flexShrink: 0 }}
        >
          <div
            className="flex items-center justify-center rounded"
            style={{ width: '28px', height: '28px', backgroundColor: '#FFFFFF' }}
          >
            <Building2 className="w-4 h-4" style={{ color: '#000000' }} />
          </div>
          <div>
            <div className="font-semibold text-sm leading-none" style={{ color: '#FFFFFF' }}>
              CoimbatoreREI
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#71717A' }}>
              Intelligence Platform
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="mb-1">
            <div
              className="px-3 mb-2 text-xs font-medium uppercase tracking-wider"
              style={{ color: '#52525B' }}
            >
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 rounded transition-colors duration-150 mb-0.5"
                  style={{
                    height: '40px',
                    backgroundColor: active ? '#1C1C1C' : 'transparent',
                    color: active ? '#FFFFFF' : '#A1A1AA',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#111111';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid #1F1F1F' }}>
          <div
            className="flex items-center gap-3 px-3 rounded mb-1"
            style={{ height: '40px', color: '#71717A' }}
          >
            <div
              className="flex items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
              style={{ width: '24px', height: '24px', backgroundColor: '#1C1C1C', color: '#A1A1AA' }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm truncate flex-1" style={{ color: '#A1A1AA' }}>
              {userName}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 rounded w-full transition-colors duration-150"
            style={{ height: '40px', color: '#71717A' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#111111';
              (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#71717A';
            }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-6"
          style={{
            height: '64px',
            backgroundColor: '#000000',
            borderBottom: '1px solid #1F1F1F',
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded transition-colors"
              style={{ color: '#A1A1AA' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#111111')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium" style={{ color: '#A1A1AA' }}>
              {navItems.find((n) => isActive(n.path))?.name || 'Overview'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded"
              style={{ backgroundColor: '#111111', color: '#71717A', border: '1px solid #1F1F1F' }}
            >
              <span
                className="inline-block rounded-full"
                style={{ width: '6px', height: '6px', backgroundColor: '#FFFFFF' }}
              />
              Market Active
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 flex flex-col overflow-auto" style={{ backgroundColor: '#000000' }}>
          <Outlet />
        </main>

        {/* Footer */}
        <footer
          className="px-6 py-4 text-xs"
          style={{ borderTop: '1px solid #1F1F1F', color: '#52525B' }}
        >
          © 2026 CoimbatoreREI · Real Estate Intelligence Platform
        </footer>
      </div>

      {/* Compare drawer */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div
            className="flex items-center justify-between gap-6 px-4 py-3 rounded-lg"
            style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}
          >
            <div className="flex items-center gap-3">
              <ArrowLeftRight className="w-4 h-4 flex-shrink-0" style={{ color: '#A1A1AA' }} />
              <div>
                <div className="text-sm font-medium text-white">Compare Properties</div>
                <div className="text-xs" style={{ color: '#71717A' }}>
                  {selectedIds.length} of 4 selected
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clear}
                className="text-xs px-3 py-1.5 rounded transition-colors"
                style={{ color: '#71717A' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FFFFFF')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#71717A')}
              >
                Clear
              </button>
              <Link
                to="/compare"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-medium transition-colors"
                style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
              >
                Compare
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
