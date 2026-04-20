import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  TrendingUp,
  BarChart2,
  Dumbbell,
  Menu,
  X,
  Target,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/log',       label: 'Log Workout', icon: PlusCircle },
  { to: '/progress',  label: 'Progress',    icon: TrendingUp },
  { to: '/goals',     label: 'Goals',       icon: Target },
  { to: '/analytics', label: 'Analytics',   icon: BarChart2 },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface border-b border-border flex items-center px-4 md:px-6">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2 mr-8 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Dumbbell size={16} className="text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight hidden sm:block">
          Iron<span className="text-gradient">Log</span>
        </span>
      </NavLink>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'text-white bg-blue-600/20 border border-blue-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <button
        className="md:hidden ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute top-16 left-0 right-0 bg-surface border-b border-border md:hidden shadow-xl animate-fade-in">
          <nav className="flex flex-col p-3 gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white bg-blue-600/20 border border-blue-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
