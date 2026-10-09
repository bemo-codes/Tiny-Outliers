import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { EmergencyRequest, Hospital, AmbulanceAssignment } from '../types';
import { EmergencyTimeline } from '../components/common/EmergencyTimeline';
import {
  Activity,
  ArrowLeft,
  Check,
  Clock,
  PhoneCall,
  Shield,
  Truck,
  Building2,
  AlertTriangle,
} from 'lucide-react';

interface EmergencyDetailsPageProps {
  emergencyId: string;
  onNavigate: (path: string) => void;
}

export const EmergencyDetailsPage: React.FC<EmergencyDetailsPageProps> = ({
  emergencyId,
  onNavigate,
}) => {
  const [emergency, setEmergency] = useState<EmergencyRequest | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [assignments, setAssignments] = useState<AmbulanceAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const emg = await apiClient.getEmergency(emergencyId);
        setEmergency(emg);

        if (emg.accepted_hospital_id) {
          const hosp = await apiClient.getHospital(emg.accepted_hospital_id);
          setHospital(hosp);
        }

        const allAsg = await apiClient.getAssignments();
        setAssignments(allAsg.filter((a) => a.emergency_id === emergencyId));
      } catch (err: any) {
        setError(err.message || 'Incident not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [emergencyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
        <div className="bg-[#1B1B1B] text-[#F5F5F5] p-8 border border-[#383838] text-center space-y-2">
          <Activity className="w-6 h-6 animate-spin mx-auto text-[#F5F5F5]" />
          <p className="text-xs uppercase font-medium tracking-widest text-[#A0A0A0]">
            LOADING INCIDENT TELEMETRY...
          </p>
        </div>
      </div>
    );
  }

  if (error || !emergency) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
        <div className="bg-[#1B1B1B] border border-[#383838] p-8 max-w-md w-full space-y-4">
          <h2 className="font-semibold text-sm uppercase text-[#F5F5F5]">Incident Record Not Found</h2>
          <button
            onClick={() => onNavigate('/')}
            className="w-full bg-[#F5F5F5] text-[#111111] py-2 text-xs uppercase font-bold"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <button
          onClick={() => onNavigate(`/emergency/${emergencyId}/matches`)}
          className="flex items-center space-x-2 text-xs text-[#A0A0A0] hover:text-[#F5F5F5] uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ranked Matches</span>
        </button>

        {/* Title Card */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D2D2D] pb-4">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-[#707070] font-mono">
                INCIDENT FILE #{emergency.id}
              </span>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F5]">
                Emergency Status <span className="font-semibold">&amp; Timeline</span>
              </h1>
            </div>
            <div className="bg-[#F5F5F5] text-[#111111] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider self-start sm:self-auto">
              {emergency.status.replace(/_/g, ' ')}
            </div>
          </div>

          <div className="pt-2">
            <EmergencyTimeline status={emergency.status} />
          </div>
        </div>

        {/* Clinical Presentation Dossier */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4 text-xs">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5] border-b border-[#2D2D2D] pb-2">
            Clinical Incident Profile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[#707070] uppercase block text-[11px]">CATEGORY &amp; SEVERITY</span>
              <span className="font-medium text-sm text-[#F5F5F5] uppercase">
                {emergency.category} ({emergency.severity})
              </span>
            </div>
            <div>
              <span className="text-[#707070] uppercase block text-[11px]">LOCATION</span>
              <span className="font-medium text-sm text-[#F5F5F5]">
                {emergency.location_address || 'Manual Entry Coordinates'}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[#707070] uppercase block text-[11px]">SYMPTOMS / INJURIES</span>
              <p className="text-sm text-[#F5F5F5] font-light mt-0.5">{emergency.symptoms}</p>
            </div>
          </div>
        </div>

        {/* Accepted Facility Notice */}
        {hospital && (
          <div className="bg-[#1B1B1B] border border-[#F5F5F5] p-6 space-y-3">
            <div className="flex items-center space-x-2 text-[#F5F5F5]">
              <Check className="w-4 h-4 text-[#F5F5F5]" />
              <h3 className="font-semibold uppercase text-sm">
                Accepted Facility: {hospital.name}
              </h3>
            </div>
            <p className="text-xs text-[#A0A0A0] font-light">
              Address: {hospital.address} · Emergency Desk: {hospital.contact_phone}
            </p>
            <div className="pt-2">
              <a
                href={`tel:${hospital.contact_phone}`}
                className="inline-flex items-center space-x-2 bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Emergency Desk</span>
              </a>
            </div>
          </div>
        )}

        {/* Ambulance Assignments */}
        {assignments.length > 0 && (
          <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4">
            <div className="flex items-center space-x-2 text-[#F5F5F5] border-b border-[#2D2D2D] pb-2">
              <Truck className="w-4 h-4 text-[#A0A0A0]" />
              <h3 className="font-semibold uppercase text-sm">Paramedic Ambulance Transport</h3>
            </div>
            {assignments.map((asg) => (
              <div key={asg.id} className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#A0A0A0]">Officer / Paramedic: {asg.driver_name}</span>
                  <span className="font-semibold uppercase bg-[#242424] text-[#F5F5F5] border border-[#383838] px-2.5 py-0.5">
                    {asg.assignment_status.replace(/_/g, ' ')}
                  </span>
                </div>
                {/* Timeline */}
                <div className="border-l border-[#383838] pl-4 space-y-2 mt-2">
                  {asg.timeline.map((item, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="font-semibold uppercase text-[#F5F5F5]">{item.status}:</span>{' '}
                      <span className="text-[#A0A0A0] font-light">{item.note}</span>
                      <span className="text-[10px] text-[#707070] block font-mono">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
