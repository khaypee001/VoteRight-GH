import React, { useState } from 'react';
import { Logo } from './Logo';
import { CurrencyCode, UserSession } from '../types';
import {
  Menu,
  X,
  Search,
  Trophy,
  BarChart3,
  Ticket,
  FileText,
  Mail,
  User,
  LogOut,
  Sparkles,
  ShieldCheck,
  Lock,
  ChevronRight,
  Globe,
  Home
} from 'lucide-react';

export type ActiveTabType = 'home' | 'competitions' | 'results' | 'tickets' | 'nominations' | 'contact' | 'login';

interface HeaderProps {
  activeTab: ActiveTabType;
  onSelectTab: (tab: ActiveTabType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  user: UserSession | null;
  onLogout: () => void;
  onOpenQuickVoteModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  currency,
  onCurrencyChange,
  user,
  onLogout,
  onOpenQuickVoteModal,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems: { id: ActiveTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'competitions', label: 'Competitions', icon: <Trophy className="w-4 h-4" /> },
    { id: 'results', label: 'Results', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'tickets', label: 'Event Tickets', icon: <Ticket className="w-4 h-4" /> },
    { id: 'nominations', label: 'Nominations', icon: <FileText className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact Us', icon: <Mail className="w-4 h-4" /> },
  ];

  const handleNavClick = (tabId: ActiveTabType) => {
    onSelectTab(tabId);
    setDrawerOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-blue-600 shadow-md text-white">
      {/* Top Banner Accent */}
      <div className="bg-blue-700/80 border-b border-blue-500/40 text-[11px] py-1.5 px-4 text-center text-blue-100 flex items-center justify-between gap-4 font-medium">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>Ghana’s Leading Awards Voting & Event Ticketing Platform • Web Instant Checkout</span>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <button
            onClick={onOpenQuickVoteModal}
            className="text-amber-300 hover:text-white font-extrabold flex items-center gap-1 cursor-pointer underline"
          >
            <Sparkles className="w-3.5 h-3.5" /> Vote via Candidate Code
          </button>

          <div className="flex items-center gap-1 bg-blue-800/60 px-2 py-0.5 rounded text-[10px] font-mono">
            <Globe className="w-3 h-3 text-blue-200" />
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              className="bg-transparent text-white font-bold cursor-pointer focus:outline-none"
            >
              <option value="GHS" className="bg-slate-900 text-white">GH₵ (GHS)</option>
              <option value="USD" className="bg-slate-900 text-white">$ (USD)</option>
              <option value="NGN" className="bg-slate-900 text-white">₦ (NGN)</option>
              <option value="KES" className="bg-slate-900 text-white">KSh (KES)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="cursor-pointer" onClick={() => onSelectTab('home')}>
          <Logo size="md" variant="light" />
        </div>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-blue-50 hover:bg-blue-500/50 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Search + Auth + Drawer Toggle */}
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative hidden md:block w-48 lg:w-56">
            <Search className="w-3.5 h-3.5 text-blue-300 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search event or nominee..."
              className="w-full bg-blue-700/70 border border-blue-400/40 text-white placeholder:text-blue-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:bg-blue-800 focus:border-amber-300 transition-colors"
            />
          </div>

          {/* User Auth state */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2 bg-blue-700/80 p-1 pl-3 rounded-xl border border-blue-400/40 text-xs">
              <span className="font-bold text-white max-w-[100px] truncate">{user.fullName}</span>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-1.5 hover:bg-blue-800 rounded-lg text-blue-200 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSelectTab('login')}
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Hamburger Drawer Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            className="p-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white transition-colors cursor-pointer border border-blue-400/40"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SLIDING DRAWER MENU */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white text-slate-900 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="bg-blue-600 text-white p-5 flex items-center justify-between border-b border-blue-500">
              <Logo size="md" variant="light" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search Box */}
            <div className="p-4 bg-blue-50/60 border-b border-blue-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search events or nominees..."
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
                Main Menu
              </div>

              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                );
              })}

              {/* Login option inside drawer */}
              {user ? (
                <div className="pt-4 border-t border-slate-200">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{user.fullName}</div>
                      <div className="text-[10px] text-slate-500">{user.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        onLogout();
                        setDrawerOpen(false);
                      }}
                      className="bg-rose-50 text-rose-600 font-bold text-xs px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick('login')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-sm mt-2'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4" />
                    <span>Login / Register</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenQuickVoteModal();
                }}
                className="w-full bg-blue-600 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Vote Via Candidate Code
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
