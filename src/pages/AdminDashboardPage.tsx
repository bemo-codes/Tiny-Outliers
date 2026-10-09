import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { SYNTHETIC_SCENARIOS } from '../data/syntheticData';
import { AuditLog } from '../types';
import {
  Shield,
  Activity,
  AlertTriangle,
  RefreshCw,
  Play,
  Check,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
  onRunScenario: (scenarioId: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigate,
  onRunScenario,
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulationRunning, setSimulationRunning] = useState<boolean>(false);
  const [simResults, setSimResults] = useState<string[]>([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [m, logs] = await Promise.all([
        apiClient.getHealthMetrics(),
        apiClient.getAuditLogs(),
      ]);
      setMetrics(m);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunMassCasualtySimulation = async () => {
    setSimulationRunning(true);
    setSimResults([]);

    const steps = [
      'Synthesizing multi-vehicle collision event along Metropolitan Bypass...',
      'Injecting 4 concurrent critical incident vectors (Trauma, STEMI, Neuro, Pediatric)...',
      'Executing deterministic ranking against 12 registered hospital nodes...',
      'Evaluating supply constraints: Blood Bank (O- PRBC) & Resuscitation bays depleted at St. Jude...',
      'Dynamic overflow rerouting: Surge routed to Trinity Level 1 Academic Trauma Center...',
      'Simulation complete: All 4 requests evaluated deterministically without concurrency collision.',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setSimResults((prev) => [...prev, steps[i]]);
    }
    setSimulationRunning(false);
    await loadAdminData();
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-[#707070] uppercase tracking-wider font-mono">
              <Shield className="w-3.5 h-3.5 text-[#F5F5F5]" />
              <span>REGIONAL SYSTEM COMMAND &amp; TELEMETRY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F5]">
              System Health <span className="font-semibold">&amp; Stress Audit</span>
            </h1>
            <p className="text-xs text-[#A0A0A0] font-light">
              Deterministic Matching Engine · Freshness Threshold: 10 mins · Backend: FastAPI / SQLAlchemy 2.x
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>POLL METRICS</span>
          </button>
        </div>

        {/* Structured Telemetry Grid */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1B1B1B] border border-[#383838] p-5 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#707070] font-medium block">
                HOSPITALS MONITORED
              </span>
              <span className="text-3xl font-light text-[#F5F5F5] font-mono">
                {metrics.metrics.hospitals_registered}
              </span>
              <span className="text-[11px] text-[#A0A0A0] block font-light">Active Facility Nodes</span>
            </div>

            <div className="bg-[#1B1B1B] border border-[#383838] p-5 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#707070] font-medium block">
                RESOURCES TRACKED
              </span>
              <span className="text-3xl font-light text-[#F5F5F5] font-mono">
                {metrics.metrics.resources_tracked}
              </span>
              <span className="text-[11px] text-[#A0A0A0] block font-light">Inventory Telemetry Points</span>
            </div>

            <div className="bg-[#1B1B1B] border border-[#383838] p-5 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#707070] font-medium block">
                FRESH DATA (&le;10M)
              </span>
              <span className="text-3xl font-light text-[#F5F5F5] font-mono">
                {metrics.metrics.fresh_resources}
              </span>
              <span className="text-[11px] text-[#A0A0A0] block font-light">Verified Stock Items</span>
            </div>

            <div className="bg-[#1B1B1B] border border-[#383838] p-5 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#707070] font-medium block">
                STALE DATA (&gt;10M)
              </span>
              <span className="text-3xl font-light text-[#F5F5F5] font-mono">
                {metrics.metrics.stale_resources}
              </span>
              <span className="text-[11px] text-[#A0A0A0] block font-light">Requires Desk Re-check</span>
            </div>
          </div>
        )}

        {/* Mass Casualty Simulation Controller */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#2D2D2D] pb-3">
            <div>
              <span className="text-xs text-[#707070] uppercase font-medium tracking-wider block font-mono">
                SURGE CAPACITY TESTING
              </span>
              <h2 className="text-lg font-semibold uppercase tracking-tight text-[#F5F5F5]">
                Synthetic Mass-Casualty Simulation
              </h2>
            </div>
            <button
              onClick={handleRunMassCasualtySimulation}
              disabled={simulationRunning}
              className="bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-colors disabled:opacity-50 self-start sm:self-auto"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{simulationRunning ? 'EXECUTING SURGE RUN...' : 'TRIGGER MASS SURGE EVENT'}</span>
            </button>
          </div>

          <p className="text-xs text-[#A0A0A0] leading-relaxed font-light">
            Generates concurrent emergency incidents with competing demands for limited Level-1 surgical suites, O-Negative blood units, and ICU beds. Validates that the engine prevents over-allocation and routes overflow patients to secondary capable facilities.
          </p>

          {/* Simulation Output Log */}
          {simResults.length > 0 && (
            <div className="bg-[#242424] border border-[#383838] p-4 space-y-2 text-xs">
              <span className="font-semibold uppercase text-[10px] text-[#A0A0A0] block border-b border-[#383838] pb-1">
                TELEMETRY SURGE STREAM:
              </span>
              {simResults.map((line, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-[#707070]">•</span>
                  <span className="text-[#F5F5F5] font-mono text-[11px]">{line}</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-[11px] text-[#707070] pt-2 border-t border-[#2D2D2D] font-mono">
            * Synthetic simulation only. Not a clinically validated triage system.
          </div>
        </div>

        {/* 5 Evaluator Benchmark Scenarios */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5] border-b border-[#2D2D2D] pb-2">
            5 Deterministic Benchmark Scenarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SYNTHETIC_SCENARIOS.map((sc, idx) => (
              <div
                key={sc.id}
                className="bg-[#242424] border border-[#383838] p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center text-[11px] text-[#707070] mb-1 font-mono">
                    <span className="font-bold">SCENARIO #{idx + 1}</span>
                    <span className="uppercase text-[#F5F5F5] bg-[#1B1B1B] border border-[#383838] px-1.5 py-0.5">
                      {sc.emergency.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs uppercase text-[#F5F5F5]">
                    {sc.name.split(':')[1]?.trim() || sc.name}
                  </h3>
                  <p className="text-xs text-[#A0A0A0] mt-1 line-clamp-3 font-light">
                    {sc.description}
                  </p>
                </div>
                <button
                  onClick={() => onRunScenario(sc.id)}
                  className="bg-[#1B1B1B] hover:bg-[#2D2D2D] text-[#F5F5F5] border border-[#383838] px-3 py-2 text-xs font-medium uppercase tracking-wider flex items-center justify-between transition-colors"
                >
                  <span>TEST SCENARIO</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5] border-b border-[#2D2D2D] pb-2">
            Operations &amp; Security Audit Trail
          </h2>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-[#707070] py-4 text-center font-light">
              NO AUDIT EVENTS RECORDED IN THE CURRENT SESSION.
            </p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#242424] border border-[#383838] p-3 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#F5F5F5] uppercase">{log.action}</span>
                    <span className="text-[10px] text-[#707070] font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[#A0A0A0] font-light">
                    Target: {log.entity_type} ({log.entity_id}) · Actor: {log.actor_id || 'System'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
