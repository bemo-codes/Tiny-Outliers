import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { SosModal } from './components/common/SosModal';
import { LandingPage } from './pages/LandingPage';
import { EmergencyRegistrationPage } from './pages/EmergencyRegistrationPage';
import { HospitalMatchesPage } from './pages/HospitalMatchesPage';
import { EmergencyDetailsPage } from './pages/EmergencyDetailsPage';
import { HospitalDirectoryPage } from './pages/HospitalDirectoryPage';
import { HospitalDetailsPage } from './pages/HospitalDetailsPage';
import { HospitalDashboardPage } from './pages/HospitalDashboardPage';
import { AmbulanceDashboardPage } from './pages/AmbulanceDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { apiClient } from './services/apiClient';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname && window.location.pathname !== '/'
      ? window.location.pathname
      : '/';
  });
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    navigate('/emergency/new');
  };

  const handleSosSubmitted = (emergencyId: string) => {
    navigate(`/emergency/${emergencyId}/matches`);
  };

  // Route parsing
  const renderRoute = () => {
    // /emergency/:emergencyId/matches
    const matchesMatch = currentPath.match(/^\/emergency\/([^/]+)\/matches$/);
    if (matchesMatch) {
      const emergencyId = matchesMatch[1];
      return <HospitalMatchesPage emergencyId={emergencyId} onNavigate={navigate} />;
    }

    // /emergency/:emergencyId (details)
    const emergencyDetailsMatch = currentPath.match(/^\/emergency\/([^/]+)$/);
    if (emergencyDetailsMatch) {
      const emergencyId = emergencyDetailsMatch[1];
      if (emergencyId === 'new') {
        return (
          <EmergencyRegistrationPage
            onSubmitted={(id) => navigate(`/emergency/${id}/matches`)}
            preselectedScenarioId={selectedScenarioId}
          />
        );
      }
      return <EmergencyDetailsPage emergencyId={emergencyId} onNavigate={navigate} />;
    }

    // /hospitals/:hospitalId
    const hospitalDetailsMatch = currentPath.match(/^\/hospitals\/([^/]+)$/);
    if (hospitalDetailsMatch) {
      const hospitalId = hospitalDetailsMatch[1];
      return <HospitalDetailsPage hospitalId={hospitalId} onNavigate={navigate} />;
    }

    if (currentPath === '/hospitals') {
      return <HospitalDirectoryPage onNavigate={navigate} />;
    }

    if (currentPath === '/hospital/dashboard') {
      return <HospitalDashboardPage />;
    }

    if (currentPath === '/ambulance/dashboard') {
      return <AmbulanceDashboardPage />;
    }

    if (currentPath === '/admin') {
      return (
        <AdminDashboardPage
          onNavigate={navigate}
          onRunScenario={(id) => handleSelectScenario(id)}
        />
      );
    }

    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} onLoginSuccess={() => navigate('/')} />;
    }

    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigate} onRegisterSuccess={() => navigate('/')} />;
    }

    // Default: Landing Page (/)
    return (
      <LandingPage
        onNavigate={navigate}
        onSelectScenario={handleSelectScenario}
        onOpenSos={() => setIsSosOpen(true)}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111111] text-[#F5F5F5] selection:bg-[#F5F5F5] selection:text-[#111111]">
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        onRoleChanged={() => setCurrentPath(currentPath)}
        onOpenSos={() => setIsSosOpen(true)}
      />
      <DisclaimerBanner />

      <main className="flex-1">{renderRoute()}</main>

      {/* Focused Emergency Intake Modal */}
      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        onSubmitted={handleSosSubmitted}
      />

      {/* Minimalist Editorial Footer */}
      <footer className="bg-[#111111] text-[#F5F5F5] border-t border-[#383838] py-12 px-4 sm:px-6 text-xs font-mono">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-6 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight uppercase text-[#F5F5F5]">
                  SOS / RESPONSE
                </span>
                <span className="text-[10px] text-[#707070] uppercase">
                  CARE/ROUTE v1.0
                </span>
              </div>
              <p className="text-[#A0A0A0] text-xs max-w-md font-light leading-relaxed">
                Emergency Care Coordination &amp; Smart Hospital Routing System. Minimalist, explainable, and deterministic routing based on mandatory facility eligibility and verified resource freshness.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2">
              <span className="text-[#F5F5F5] uppercase font-semibold text-[11px] block border-b border-[#2D2D2D] pb-1">
                PORTALS &amp; VIEWS
              </span>
              <ul className="space-y-1.5 text-[#A0A0A0]">
                <li>
                  <button onClick={() => navigate('/emergency/new')} className="hover:text-[#F5F5F5] transition-colors">
                    Emergency Registration
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/hospitals')} className="hover:text-[#F5F5F5] transition-colors">
                    Hospital Directory
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/hospital/dashboard')} className="hover:text-[#F5F5F5] transition-colors">
                    Staff Resource Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/ambulance/dashboard')} className="hover:text-[#F5F5F5] transition-colors">
                    Paramedic Fleet
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/admin')} className="hover:text-[#F5F5F5] transition-colors">
                    Regional Command
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-2">
              <span className="text-[#F5F5F5] uppercase font-semibold text-[11px] block border-b border-[#2D2D2D] pb-1">
                STANDARDS
              </span>
              <ul className="space-y-1 text-[#707070] text-[11px]">
                <li>· Strict Monochromatic System</li>
                <li>· Deterministic Matching Rules</li>
                <li>· 10-Minute Freshness Gate</li>
                <li>· 12 SQLAlchemy ORM Entities</li>
                <li>· 5 Reproducible Benchmark Scenarios</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#242424] flex flex-col sm:flex-row items-center justify-between text-[#707070] text-[11px] gap-2">
            <div>
              <span>PROTOTYPE ONLY · NOT A SUBSTITUTE FOR NATIONAL EMERGENCY SERVICES.</span>
            </div>
            <div>
              <span>IN LIFE-THREATENING EMERGENCIES, DIAL 112 (INDIA) OR 911 (US).</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
