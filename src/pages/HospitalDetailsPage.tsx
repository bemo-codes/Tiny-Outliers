import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { Hospital, HospitalResource } from '../types';
import {
  ArrowLeft,
  Building2,
  PhoneCall,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface HospitalDetailsPageProps {
  hospitalId: string;
  onNavigate: (path: string) => void;
}

export const HospitalDetailsPage: React.FC<HospitalDetailsPageProps> = ({
  hospitalId,
  onNavigate,
}) => {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [resources, setResources] = useState<HospitalResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [h, res] = await Promise.all([
          apiClient.getHospital(hospitalId),
          apiClient.getHospitalResources(hospitalId),
        ]);
        setHospital(h);
        setResources(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hospitalId]);

  if (loading || !hospital) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
        <div className="text-xs uppercase font-medium tracking-widest text-[#707070]">
          LOADING FACILITY DOSSIER...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => onNavigate('/hospitals')}
          className="flex items-center space-x-2 text-xs text-[#A0A0A0] hover:text-[#F5F5F5] uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </button>

        {/* Hospital Card */}
        <div className="bg-[#1B1B1B] text-[#F5F5F5] p-8 border border-[#383838] space-y-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#2D2D2D] pb-5">
            <div>
              <span className="text-xs text-[#707070] uppercase tracking-widest block mb-1 font-mono">
                FACILITY CODE: {hospital.code} · {hospital.tier.toUpperCase()}
              </span>
              <h1 className="text-3xl font-light tracking-tight text-[#F5F5F5]">
                {hospital.name}
              </h1>
              <p className="text-xs text-[#A0A0A0] mt-1 flex items-center space-x-1 font-light">
                <MapPin className="w-3.5 h-3.5 text-[#707070]" />
                <span>{hospital.address}</span>
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
              <span className="bg-[#242424] text-[#F5F5F5] border border-[#383838] px-3 py-1 text-xs uppercase font-semibold">
                {hospital.operational_status.replace(/_/g, ' ')}
              </span>
              <a
                href={`tel:${hospital.contact_phone}`}
                className="bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] px-4 py-2 text-xs font-bold uppercase flex items-center space-x-2 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{hospital.contact_phone}</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-1">
            <div>
              <span className="text-[#707070] uppercase block text-[10px]">TOTAL CAPACITY</span>
              <span className="font-semibold text-sm text-[#F5F5F5]">{hospital.total_capacity} Beds</span>
            </div>
            <div>
              <span className="text-[#707070] uppercase block text-[10px]">OCCUPANCY</span>
              <span className="font-semibold text-sm text-[#F5F5F5]">{hospital.current_occupancy} Beds</span>
            </div>
            <div>
              <span className="text-[#707070] uppercase block text-[10px]">DIRECT DESK</span>
              <span className="font-semibold text-sm text-[#F5F5F5]">
                {hospital.emergency_direct_line || hospital.contact_phone}
              </span>
            </div>
            <div>
              <span className="text-[#707070] uppercase block text-[10px]">COORDINATES</span>
              <span className="font-semibold text-sm text-[#F5F5F5]">
                {hospital.latitude.toFixed(4)}, {hospital.longitude.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Capabilities & Specialists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-3 text-xs">
            <h2 className="font-semibold uppercase tracking-wider text-sm text-[#F5F5F5] border-b border-[#2D2D2D] pb-2">
              Verified Capabilities
            </h2>
            <div className="space-y-2">
              {(hospital.capabilities || []).map((c) => (
                <div key={c.id} className="flex justify-between items-center py-1.5 border-b border-[#242424]">
                  <span className="text-[#F5F5F5]">{c.capability_name}</span>
                  <span className="bg-[#242424] text-[#A0A0A0] border border-[#383838] px-2 py-0.5 text-[10px] uppercase font-mono">
                    VERIFIED
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-3 text-xs">
            <h2 className="font-semibold uppercase tracking-wider text-sm text-[#F5F5F5] border-b border-[#2D2D2D] pb-2">
              On-Shift Medical Staff
            </h2>
            <div className="space-y-2">
              {(hospital.staff_availability || []).map((s) => (
                <div key={s.id} className="flex justify-between items-center py-1.5 border-b border-[#242424]">
                  <span className="uppercase text-[#F5F5F5]">{s.specialty.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-[#A0A0A0]">
                    {s.on_duty_count} ON DUTY ({s.is_available_now ? 'AVAILABLE' : 'OFF SHIFT'})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource Inventory */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4 text-xs">
          <h2 className="font-semibold uppercase tracking-wider text-sm text-[#F5F5F5] border-b border-[#2D2D2D] pb-2">
            Resource Stock &amp; Verification Telemetry
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#242424] border-b border-[#383838] text-[#707070] uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 font-mono">Available</th>
                  <th className="py-2.5 px-3 font-mono">Total</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Freshness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D2D2D]">
                {resources.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-3 font-medium text-[#F5F5F5]">{r.resource_name}</td>
                    <td className="py-2.5 px-3 text-[#A0A0A0] uppercase text-[11px]">{r.category}</td>
                    <td className="py-2.5 px-3 font-mono text-[#F5F5F5]">{r.available_quantity} {r.unit}</td>
                    <td className="py-2.5 px-3 font-mono text-[#A0A0A0]">{r.total_quantity}</td>
                    <td className="py-2.5 px-3 uppercase text-[11px]">{r.availability_status}</td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={`text-[10px] uppercase font-semibold ${
                        r.is_fresh ? 'text-[#F5F5F5]' : 'text-[#707070]'
                      }`}>
                        {r.is_fresh ? 'FRESH' : 'STALE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
