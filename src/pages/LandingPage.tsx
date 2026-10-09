import React from 'react';
import { SYNTHETIC_SCENARIOS } from '../data/syntheticData';
import {
  Activity,
  ArrowRight,
  Shield,
  Clock,
  PhoneCall,
  CheckCircle2,
  Building2,
  Sliders,
  AlertTriangle,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onSelectScenario: (scenarioId: string) => void;
  onOpenSos: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onSelectScenario,
  onOpenSos,
}) => {
  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5]">
      {/* Editorial Hero Section */}
      <section className="relative px-4 sm:px-6 pt-20 pb-28 border-b border-[#383838] overflow-hidden">
        {/* Subtle geometric grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#F5F5F5 1px, transparent 1px), linear-gradient(90deg, #F5F5F5 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Editorial Headline & Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#A0A0A0]">
                <span className="w-2 h-2 bg-[#F5F5F5] inline-block" />
                <span>INTELLIGENT EMERGENCY CARE COORDINATION</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-[#F5F5F5] leading-[1.05]">
                Help is closer <br />
                <span className="font-semibold text-[#FFFFFF]">than you think.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#A0A0A0] max-w-xl font-light leading-relaxed">
                Request emergency assistance and find the most suitable nearby hospital using verified capabilities, live ICU availability, and fresh resource telemetry.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-[#707070]">
                <span>10-MIN FRESHNESS THRESHOLD</span>
                <span>·</span>
                <span>ZERO AI HALLUCINATION</span>
                <span>·</span>
                <span>ONE-TAP DIRECT DIAL</span>
              </div>
            </div>

            {/* Right Column: Prominent SOS Button Panel */}
            <div className="lg:col-span-5 flex flex-col items-center sm:items-end justify-center">
              <div className="w-full max-w-md bg-[#1B1B1B] border border-[#383838] p-8 sm:p-10 text-center space-y-6 shadow-2xl relative">
                {/* Visual Anchor: Prominent SOS Button */}
                <div className="flex justify-center py-2">
                  <button
                    onClick={onOpenSos}
                    aria-label="Request Emergency Help"
                    className="group relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-[#F5F5F5] bg-[#111111] hover:bg-[#F5F5F5] flex flex-col items-center justify-center p-4 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#707070] cursor-pointer"
                  >
                    {/* Subtle pulse ring */}
                    <span className="absolute inset-0 rounded-full border border-[#F5F5F5]/30 animate-ping pointer-events-none duration-1000" />

                    <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-[#F5F5F5] group-hover:text-[#111111] transition-colors mb-2" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F5F5F5] group-hover:text-[#111111] transition-colors leading-tight">
                      REQUEST
                      <br />
                      EMERGENCY
                      <br />
                      HELP
                    </span>
                  </button>
                </div>

                {/* Instruction Copy */}
                <div className="space-y-2">
                  <p className="text-xs text-[#A0A0A0] font-light leading-relaxed">
                    Pressing the button initiates immediate emergency triage, matches available hospital resources, and locates direct contact lines.
                  </p>
                  <p className="text-[11px] text-[#707070]">
                    In life-threatening situations, also call{' '}
                    <a href="tel:112" className="text-[#F5F5F5] underline hover:text-[#FFFFFF]">
                      112
                    </a>{' '}
                    directly.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#2D2D2D]">
                  <button
                    onClick={() => onNavigate('/emergency/new')}
                    className="w-full py-2.5 bg-[#242424] hover:bg-[#2D2D2D] border border-[#383838] text-xs uppercase tracking-wider text-[#F5F5F5] transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>OPEN FULL REGISTRATION FORM</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Reproducible Scenarios Carousel / Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 border-b border-[#383838]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-[#383838] gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#707070]">
              VERIFICATION SUITE
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-[#F5F5F5] mt-1">
              Deterministic Benchmark Scenarios
            </h2>
          </div>
          <span className="text-xs font-mono text-[#A0A0A0] bg-[#1B1B1B] border border-[#383838] px-3 py-1 self-start sm:self-auto">
            SEED: #42 · PREDICTABLE ALLOCATIONS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SYNTHETIC_SCENARIOS.map((sc, idx) => (
            <div
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className="bg-[#1B1B1B] hover:bg-[#242424] border border-[#383838] hover:border-[#707070] p-6 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#707070]">
                  <span className="font-mono">SCENARIO 0{idx + 1}</span>
                  <span className="text-[#F5F5F5] uppercase text-[11px] font-medium tracking-wide">
                    {sc.emergency.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold uppercase text-[#F5F5F5] group-hover:underline tracking-wide">
                  {sc.name.split(':')[1] || sc.name}
                </h3>
                <p className="text-xs text-[#A0A0A0] leading-relaxed line-clamp-3 font-light">
                  {sc.description}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#2D2D2D] flex items-center justify-between text-xs uppercase font-medium text-[#F5F5F5]">
                <span>Simulate Scenario</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}

          {/* Mass Casualty Controller Card */}
          <div
            onClick={() => onNavigate('/admin')}
            className="bg-[#242424] hover:bg-[#2D2D2D] border border-[#383838] hover:border-[#707070] p-6 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#707070]">
                <span className="font-mono">SURGE REGIONAL</span>
                <span className="text-[#F5F5F5] uppercase text-[11px] font-medium">STRESS TEST</span>
              </div>
              <h3 className="text-sm font-semibold uppercase text-[#F5F5F5] group-hover:underline tracking-wide">
                Mass Casualty Surge Simulation
              </h3>
              <p className="text-xs text-[#A0A0A0] leading-relaxed font-light">
                Inspect multiple concurrent emergency allocations, hospital diversions, and system freshness telemetry.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#383838] flex items-center justify-between text-xs uppercase font-medium text-[#F5F5F5]">
              <span>Command Center</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="mb-12">
          <span className="text-xs uppercase tracking-widest text-[#707070]">
            OPERATIONAL STANDARDS
          </span>
          <h2 className="text-3xl font-light text-[#F5F5F5] mt-1">
            Engineered for <span className="font-semibold">Clarity and Speed</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-3">
            <span className="text-xs font-mono text-[#707070] block">01 / CAPABILITY GATE</span>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5]">
              Mandatory Eligibility
            </h3>
            <p className="text-xs text-[#A0A0A0] font-light leading-relaxed">
              A nearby clinic without an active catheterization lab or trauma surgeon is disqualified for STEMI and polytrauma emergencies. Distance never overrides capability.
            </p>
          </div>

          <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-3">
            <span className="text-xs font-mono text-[#707070] block">02 / DATA FRESHNESS</span>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5]">
              10-Minute Threshold
            </h3>
            <p className="text-xs text-[#A0A0A0] font-light leading-relaxed">
              Resource telemetry older than 10 minutes or with missing timestamps is flagged as unverified. The engine demands confirmation before routing.
            </p>
          </div>

          <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-3">
            <span className="text-xs font-mono text-[#707070] block">03 / TRUSTED CONTACT</span>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5]">
              Direct Desk Dial
            </h3>
            <p className="text-xs text-[#A0A0A0] font-light leading-relaxed">
              Instant telephone access to verified emergency desks using authenticated telephone records. Clear disclaimers prevent false expectations.
            </p>
          </div>

          <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-3">
            <span className="text-xs font-mono text-[#707070] block">04 / CLOSED-LOOP</span>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5]">
              Explicit Acceptance
            </h3>
            <p className="text-xs text-[#A0A0A0] font-light leading-relaxed">
              Hospital staff actively review, accept, or decline admission requests with recorded justification along an auditable timeline.
            </p>
          </div>
        </div>
      </section>

      {/* Role Navigation Quick Bar */}
      <section className="bg-[#1B1B1B] border-t border-[#383838] py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#F5F5F5]">
              First Responder & Medical Staff Portals
            </h3>
            <p className="text-xs text-[#A0A0A0] mt-1 font-light">
              Authorized clinical teams manage live bed telemetry and process incoming acceptance requests.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('/hospital/dashboard')}
              className="bg-[#242424] hover:bg-[#2D2D2D] text-[#F5F5F5] border border-[#383838] px-4 py-2 text-xs uppercase font-medium tracking-wider transition-colors"
            >
              Hospital Staff Portal
            </button>
            <button
              onClick={() => onNavigate('/ambulance/dashboard')}
              className="bg-[#242424] hover:bg-[#2D2D2D] text-[#F5F5F5] border border-[#383838] px-4 py-2 text-xs uppercase font-medium tracking-wider transition-colors"
            >
              Ambulance Telemetry
            </button>
            <button
              onClick={() => onNavigate('/admin')}
              className="bg-[#F5F5F5] text-[#111111] hover:bg-[#FFFFFF] px-4 py-2 text-xs uppercase font-bold tracking-wider transition-colors"
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
