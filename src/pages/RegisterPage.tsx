import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { UserRole } from '../types';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
  onRegisterSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, onRegisterSuccess }) => {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('patient');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    apiClient.setCurrentUser({
      id: `usr-${Date.now().toString(36)}`,
      email,
      full_name: fullName,
      role,
      created_at: new Date().toISOString(),
    });
    onRegisterSuccess();
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4 text-[#F5F5F5]">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-xs text-[#707070] uppercase tracking-widest block font-mono">
            CARE/ROUTE CREDENTIALS
          </span>
          <h1 className="text-3xl font-light tracking-tight text-[#F5F5F5]">
            Create <span className="font-semibold">Account</span>
          </h1>
        </div>

        <div className="bg-[#1B1B1B] border border-[#383838] p-7 space-y-5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-[#A0A0A0] uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Maria Vance"
                className="w-full bg-[#242424] border border-[#383838] p-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                required
              />
            </div>

            <div>
              <label className="text-[#A0A0A0] uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@careroute.org"
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

            <div>
              <label className="text-[#A0A0A0] uppercase tracking-wider block mb-1">
                Assigned Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-[#242424] border border-[#383838] p-2.5 text-xs uppercase text-[#F5F5F5] focus:outline-none"
              >
                <option value="patient">PATIENT / CITIZEN</option>
                <option value="hospital_staff">HOSPITAL MEDICAL STAFF</option>
                <option value="ambulance">PARAMEDIC / FIRST RESPONDER</option>
                <option value="admin">SYSTEM ADMINISTRATOR</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] py-3 uppercase font-bold tracking-wider transition-colors"
            >
              Register Credentials
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#2D2D2D] text-[11px] text-[#A0A0A0]">
            Already registered?{' '}
            <button
              onClick={() => onNavigate('/login')}
              className="text-[#F5F5F5] font-semibold underline uppercase ml-1"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
