import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { Ambulance, AmbulanceAssignment } from '../types';
import {
  Truck,
  RefreshCw,
  X,
  Check,
  Clock,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';

export const AmbulanceDashboardPage: React.FC = () => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [assignments, setAssignments] = useState<AmbulanceAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<AmbulanceAssignment['assignment_status']>('en_route');
  const [statusNote, setStatusNote] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadFleet();
  }, []);

  const loadFleet = async () => {
    setLoading(true);
    try {
      const [ambList, asgList] = await Promise.all([
        apiClient.getAmbulances(),
        apiClient.getAssignments(),
      ]);
      setAmbulances(ambList);
      setAssignments(asgList);
    } catch (err: any) {
      setNotification(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (assignmentId: string) => {
    try {
      await apiClient.updateAmbulanceStatus(assignmentId, newStatus, statusNote);
      setNotification(`Ambulance telemetry updated to ${newStatus.toUpperCase()}`);
      setUpdatingId(null);
      setStatusNote('');
      await loadFleet();
    } catch (err: any) {
      setNotification(`Update failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-[#707070] uppercase tracking-widest font-mono block">
              FIRST RESPONDER FLEET DISPATCH
            </span>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F5]">
              Ambulance Telemetry <span className="font-semibold">&amp; Missions</span>
            </h1>
          </div>
          <button
            onClick={loadFleet}
            className="bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>REFRESH FLEET</span>
          </button>
        </div>

        {notification && (
          <div className="bg-[#1B1B1B] border border-[#383838] p-3 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-[#F5F5F5]" />
              <span className="text-[#F5F5F5]">{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-[#707070] hover:text-[#F5F5F5]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Fleet Registry Overview */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5] border-b border-[#2D2D2D] pb-2">
            Active Ambulance Fleet Registry
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ambulances.map((amb) => (
              <div
                key={amb.id}
                className="bg-[#242424] border border-[#383838] p-4 space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#F5F5F5]">{amb.call_sign}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] uppercase font-medium border ${
                      amb.is_available
                        ? 'bg-[#1B1B1B] text-[#F5F5F5] border-[#707070]'
                        : 'bg-[#111111] text-[#707070] border-[#383838]'
                    }`}
                  >
                    {amb.is_available ? 'AVAILABLE' : 'ON MISSION'}
                  </span>
                </div>
                <div className="text-[11px] text-[#A0A0A0] space-y-0.5 font-light">
                  <div>Type: {amb.vehicle_type}</div>
                  <div>Base: {amb.assigned_hospital_id || 'Sector Central'}</div>
                  <div>Contact: {amb.contact_phone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Transport Missions */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5] border-b border-[#2D2D2D] pb-2">
            Active Transport Missions ({assignments.length})
          </h2>

          {assignments.length === 0 ? (
            <p className="text-xs text-[#707070] py-6 text-center font-light">
              NO ACTIVE EMERGENCY TRANSPORT MISSIONS CURRENTLY ASSIGNED.
            </p>
          ) : (
            <div className="space-y-4">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="bg-[#242424] border border-[#383838] p-5 space-y-4 text-xs"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#2D2D2D] pb-3">
                    <div>
                      <span className="text-[10px] text-[#707070] uppercase block font-mono">
                        ASSIGNMENT ID: {asg.id}
                      </span>
                      <h3 className="font-semibold text-sm uppercase text-[#F5F5F5]">
                        Incident Case #{asg.emergency_id}
                      </h3>
                      <span className="text-[#A0A0A0] text-[11px]">
                        Officer / Paramedic: {asg.driver_name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <span className="bg-[#1B1B1B] border border-[#707070] text-[#F5F5F5] px-3 py-1 text-xs uppercase font-medium">
                        {asg.assignment_status.replace(/_/g, ' ')}
                      </span>
                      <button
                        onClick={() => {
                          setUpdatingId(asg.id);
                          setNewStatus(asg.assignment_status);
                        }}
                        className="bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        UPDATE TELEMETRY
                      </button>
                    </div>
                  </div>

                  {/* Mission Timeline */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#707070] font-medium">
                      TIMELINE
                    </span>
                    <div className="border-l border-[#383838] pl-3 space-y-1.5">
                      {asg.timeline.map((item, idx) => (
                        <div key={idx} className="text-[11px]">
                          <span className="font-semibold uppercase text-[#F5F5F5]">{item.status}:</span>{' '}
                          <span className="text-[#A0A0A0] font-light">{item.note}</span>
                          <span className="text-[9px] text-[#707070] ml-2 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modal / Inline Update Form */}
                  {updatingId === asg.id && (
                    <div className="bg-[#1B1B1B] border border-[#383838] p-4 space-y-3 mt-3">
                      <h4 className="font-semibold uppercase text-xs text-[#F5F5F5]">
                        Update Paramedic Telemetry
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-[#707070] uppercase block mb-1">
                            Operational Stage
                          </label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as any)}
                            className="w-full bg-[#242424] border border-[#383838] p-2 text-xs uppercase text-[#F5F5F5] focus:outline-none"
                          >
                            <option value="dispatched">DISPATCHED</option>
                            <option value="en_route">EN ROUTE TO SCENE</option>
                            <option value="arrived_scene">ARRIVED AT SCENE</option>
                            <option value="transporting">TRANSPORTING PATIENT</option>
                            <option value="completed">ADMITTED / COMPLETED</option>
                            <option value="cancelled">CANCELLED</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-[#707070] uppercase block mb-1">
                            Radio / Telemetry Note
                          </label>
                          <input
                            type="text"
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="e.g. En route to ED, vitals stable, ETA 3 mins..."
                            className="w-full bg-[#242424] border border-[#383838] p-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2 border-t border-[#2D2D2D]">
                        <button
                          onClick={() => setUpdatingId(null)}
                          className="bg-[#242424] hover:bg-[#2D2D2D] text-[#A0A0A0] px-3 py-1.5 text-xs font-medium uppercase"
                        >
                          CANCEL
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(asg.id)}
                          className="bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] px-3.5 py-1.5 text-xs font-bold uppercase"
                        >
                          TRANSMIT UPDATE
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
