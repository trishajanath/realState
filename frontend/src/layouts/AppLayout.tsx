import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useCompareStore } from '../store/useCompareStore';
import { LayoutDashboard, ArrowLeftRight, Map, Sparkles, ChevronRight, LogOut } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { selectedIds, clear } = useCompareStore();

  const navItems = [
    { name: 'Analytics Board', path: '/analytics', icon: LayoutDashboard },
    { name: 'Geospatial Grid', path: '/map', icon: Map },
    { name: 'Compare', path: '/compare', icon: ArrowLeftRight }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Brand Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display font-extrabold text-slate-900 tracking-tight text-base">
              Coimbatore<span className="text-blue-600">REI</span>
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Header badge */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 text-[10px] font-mono tracking-wider uppercase font-bold flex items-center gap-1.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Coimbatore Market Stable</span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user_name');
              localStorage.removeItem('user_email');
              window.location.href = '/login';
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Routing Render Frame */}
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>

      {/* Persistent Compare Properties Drawer HUD */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-2xl flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 h-8 w-8 rounded-lg flex items-center justify-center text-white">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-display">Compare Properties</h4>
                <p className="text-[10px] text-slate-400 font-mono">{selectedIds.length} of 4 items selected</p>
              </div>
            </div>

            {/* Micro items row */}
            <div className="flex items-center gap-2">
              <button 
                onClick={clear}
                className="text-[10px] font-semibold text-slate-400 hover:text-white px-2 py-1 transition-all"
              >
                Clear
              </button>
              <Link 
                to="/compare"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all shadow-md shadow-blue-500/10"
              >
                <span>Compare Side-by-Side</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Footer */}
      <footer className="border-t border-slate-200/60 bg-white px-6 py-6 text-center text-xs text-slate-400 font-mono">
        <p>&copy; 2026 Coimbatore Real Estate Intelligence Platform. Direct metric indexes compiled daily.</p>
      </footer>
    </div>
  );
};
