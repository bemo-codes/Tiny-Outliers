import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { UserRole } from '../../types';
import {
  Menu,
  X,
  User,
  ChevronDown,
  PhoneCall,
  Activity,
  Building2,
  Sliders,
  Truck,
  Shield,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onRoleChanged?: () => void;
  onOpenSos?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  onRoleChanged,
  onOpenSos,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = apiClient.getCurrentUser();

  const handleRoleSelect = (role: UserRole) => {
    apiClient.switchRole(role);
    setRoleMenuOpen(false);
    if (onRoleChanged) onRoleChanged();
  };

  const navLinks = [
    { label: 'Find Hospital', path: '/emergency/new' },
    { label: 'Hospitals', path: '/hospitals' },
    { label: 'Staff Portal', path: '/hospital/dashboard' },
    { label: 'Ambulance Fleet', path: '/ambulance/dashboard' },
    { label: 'Regional Command', path: '/admin' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#111111] text-[#F5F5F5] border-b border-[#383838]">
      {/* Restrained One-Row Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Minimal Brand Wordmark */}
        <div
          onClick={() => onNavigate('/')}
          className="cursor-pointer flex items-baseline space-x-2 select-none shrink-0 group"
        >
          <span className="text-base sm:text-lg font-bold tracking-tight uppercase text-[#F5F5F5] group-hover:text-[#FFFFFF] transition-colors">
            SOS / RESPONSE
          </span>
          <span className="text-[10px] text-[#707070] tracking-widest uppercase hidden sm:inline">
            COORDINATION
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-xs tracking-wider uppercase font-medium">
          {navLinks.map((link) => {
            const isActive =
              currentPath === link.path ||
              (link.path !== '/' && currentPath.startsWith(link.path));
            return (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-[#F5F5F5] border-b border-[#F5F5F5]'
                    : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Persona */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Quick SOS Trigger Button */}
          {onOpenSos && (
            <button
              onClick={onOpenSos}
              className="px-3.5 py-1.5 bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
            >
              REQUEST HELP
            </button>
          )}

          {/* Persona Menu */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center space-x-1.5 bg-[#1B1B1B] hover:bg-[#242424] text-[#F5F5F5] border border-[#383838] px-2.5 py-1.5 text-xs tracking-wide transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#A0A0A0]" />
              <span className="hidden sm:inline text-[#A0A0A0] uppercase text-[11px]">ROLE:</span>
              <span className="font-medium uppercase text-[11px]">
                {currentUser.role.replace('_', ' ')}
              </span>
              <ChevronDown className="w-3 h-3 text-[#707070]" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#1B1B1B] border border-[#383838] shadow-2xl p-1 z-50 text-xs">
                <div className="px-3 py-2 text-[10px] text-[#707070] uppercase border-b border-[#242424] tracking-wider">
                  Select User Persona
                </div>
                {(['patient', 'hospital_staff', 'ambulance', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleSelect(r)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#242424] transition-colors ${
                      currentUser.role === r
                        ? 'bg-[#242424] text-[#F5F5F5] font-semibold'
                        : 'text-[#A0A0A0]'
                    }`}
                  >
                    <span className="uppercase">{r.replace('_', ' ')}</span>
                    {currentUser.role === r && (
                      <span className="text-[10px] text-[#F5F5F5]">ACTIVE</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1B1B1B] border-t border-[#383838] px-4 py-3 space-y-2 text-xs">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => {
                onNavigate(link.path);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 border border-[#242424] text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#242424] uppercase tracking-wider block"
            >
              {link.label}
            </button>
          ))}
          {onOpenSos && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onOpenSos();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#F5F5F5] text-[#111111] py-2.5 font-bold uppercase tracking-wider text-center"
              >
                REQUEST EMERGENCY HELP NOW
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
