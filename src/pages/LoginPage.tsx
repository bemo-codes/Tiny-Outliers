import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { DEMO_USERS } from '../data/syntheticData';
import { UserRole } from '../types';
import { Shield, Key, ArrowRight, UserCheck } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('patient@careroute.org');
  const [password, setPassword] = useState<string>('password123');
  const [error, setError] = useState<string | null>(null);

  const handleQuickLogin = (role: UserRole) => {
    apiClient.switchRole(role);
    onLoginSuccess();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      apiClient.setCurrentUser(user);
      onLoginSuccess();
    } else {
      apiClient.switchRole('patient');
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4 text-[#F5F5F5]">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-xs text-[#707070] uppercase tracking-widest block font-mono">
            CARE/ROUTE SECURE ACCESS
          </span>
          <h1 className="text-3xl font-light tracking-tight text-[#F5F5F5]">
            System <span className="font-semibold">Sign In</span>
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-7 space-y-5 shadow-2xl">
          {error && (
            <div className="text-xs text-[#F5F5F5] bg-[#242424] p-2.5 border border-[#707070]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-[#A0A0A0] uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#242424] border border-[#383838] p-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                required
              />
            </div>

            <div>
              <label className="text-[#A0A0A0] uppercase tracking-wider block mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#242424] border border-[#383838] p-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] py-3 uppercase font-bold tracking-wider transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#2D2D2D] text-[11px] text-[#A0A0A0]">
            Need a new account?{' '}
            <button
              onClick={() => onNavigate('/register')}
              className="text-[#F5F5F5] font-semibold underline uppercase ml-1"
            >
              Register here
            </button>
          </div>
        </div>

        {/* Quick Personas */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-5 space-y-3">
          <span className="text-[10px] uppercase font-semibold text-[#707070] block border-b border-[#2D2D2D] pb-1 tracking-wider">
            ONE-CLICK EVALUATOR PERSONAS:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('patient')}
              className="p-2.5 border border-[#383838] bg-[#242424] hover:bg-[#2D2D2D] text-left uppercase transition-colors"
            >
              <span className="font-semibold block text-[#F5F5F5]">Patient</span>
              <span className="text-[10px] text-[#707070]">Citizen Intake</span>
            </button>

            <button
              onClick={() => handleQuickLogin('hospital_staff')}
              className="p-2.5 border border-[#383838] bg-[#242424] hover:bg-[#2D2D2D] text-left uppercase transition-colors"
            >
              <span className="font-semibold block text-[#F5F5F5]">Staff</span>
              <span className="text-[10px] text-[#707070]">St. Jude ED</span>
            </button>

            <button
              onClick={() => handleQuickLogin('ambulance')}
              className="p-2.5 border border-[#383838] bg-[#242424] hover:bg-[#2D2D2D] text-left uppercase transition-colors"
            >
              <span className="font-semibold block text-[#F5F5F5]">Paramedic</span>
              <span className="text-[10px] text-[#707070]">Medic-One Fleet</span>
            </button>

            <button
              onClick={() => handleQuickLogin('admin')}
              className="p-2.5 border border-[#383838] bg-[#242424] hover:bg-[#2D2D2D] text-left uppercase transition-colors"
            >
              <span className="font-semibold block text-[#F5F5F5]">Admin</span>
              <span className="text-[10px] text-[#707070]">Regional Command</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
