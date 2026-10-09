import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';
import {
  EmergencyCategory,
  EmergencySeverity,
  RequiredResourceSpec,
  ResourceType,
} from '../../types';
import { SYNTHETIC_SCENARIOS } from '../../data/syntheticData';
import { X, Compass, AlertCircle, ArrowRight, Check } from 'lucide-react';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (emergencyId: string) => void;
}

export const SosModal: React.FC<SosModalProps> = ({ isOpen, onClose, onSubmitted }) => {
  const [category, setCategory] = useState<EmergencyCategory>('cardiac');
  const [severity, setSeverity] = useState<EmergencySeverity>('critical');
  const [patientName, setPatientName] = useState<string>('John Doe');
  const [patientPhone, setPatientPhone] = useState<string>('+91 98200 12345');
  const [symptoms, setSymptoms] = useState<string>(
    'Acute retrosternal chest pressure radiating to left arm, diaphoretic, severe distress.'
  );
  const [locationAddress, setLocationAddress] = useState<string>(
    '72 Market Square, Old Commercial District'
  );
  const [latitude, setLatitude] = useState<number | null>(19.066);
  const [longitude, setLongitude] = useState<number | null>(72.8677);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: { id: EmergencyCategory; label: string }[] = [
    { id: 'cardiac', label: 'Cardiac' },
    { id: 'trauma', label: 'Trauma' },
    { id: 'stroke', label: 'Stroke' },
    { id: 'respiratory', label: 'Respiratory' },
    { id: 'pediatric', label: 'Pediatric' },
    { id: 'burn', label: 'Burn' },
    { id: 'general', label: 'General' },
  ];

  const severities: EmergencySeverity[] = ['critical', 'high', 'moderate', 'low'];

  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Math.round(pos.coords.latitude * 10000) / 10000);
        setLongitude(Math.round(pos.coords.longitude * 10000) / 10000);
        setLocationAddress(`Device GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError('Location access was denied or timed out. Please enter manually.');
      },
      { timeout: 7000 }
    );
  };

  const handleLoadScenario = (scId: string) => {
    const sc = SYNTHETIC_SCENARIOS.find((s) => s.id === scId);
    if (!sc) return;
    setCategory(sc.emergency.category as EmergencyCategory);
    setSeverity(sc.emergency.severity as EmergencySeverity);
    setSymptoms(sc.emergency.symptoms || '');
    setLocationAddress(sc.emergency.location_address || '');
    setLatitude(sc.emergency.patient_latitude ?? null);
    setLongitude(sc.emergency.patient_longitude ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setErrorMessage('Please describe the urgent symptoms or injury.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Map category to default capabilities & resources
    const defaultCaps: Record<string, string[]> = {
      cardiac: ['cath_lab'],
      trauma: ['trauma_center_l1', 'emergency_ot'],
      stroke: ['stroke_unit'],
      pediatric: ['pediatric_icu'],
      burn: ['burn_unit'],
    };

    const caps = defaultCaps[category] || [];
    const resources: RequiredResourceSpec[] = [{ resource_type: 'bed', minimum_quantity: 1 }];

    try {
      const emergency = await apiClient.createEmergency({
        category,
        severity,
        symptoms,
        patient_age: 50,
        patient_latitude: latitude,
        patient_longitude: longitude,
        location_address: locationAddress,
        required_capabilities: caps,
        required_resources: resources,
      });

      onClose();
      onSubmitted(emergency.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit emergency request.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111111]/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1B1B1B] border border-[#383838] w-full max-w-2xl text-[#F5F5F5] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#383838] flex items-center justify-between bg-[#111111]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#F5F5F5] inline-block"></span>
            <span className="text-sm font-semibold tracking-wider uppercase text-[#F5F5F5]">
              EMERGENCY INTAKE DISPATCH
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#A0A0A0] hover:text-[#F5F5F5] p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Scenario Fill Bar */}
        <div className="px-6 py-2.5 bg-[#242424] border-b border-[#383838] flex items-center justify-between text-xs text-[#A0A0A0]">
          <span className="uppercase text-[11px] font-medium tracking-wide">
            EVALUATOR QUICK PRESETS:
          </span>
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {SYNTHETIC_SCENARIOS.slice(0, 3).map((sc, i) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleLoadScenario(sc.id)}
                className="px-2 py-0.5 bg-[#1B1B1B] hover:bg-[#2D2D2D] border border-[#383838] text-[11px] uppercase text-[#F5F5F5] transition-colors"
              >
                0{i + 1}. {sc.emergency.category}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="bg-[#242424] border border-[#707070] p-3 text-[#F5F5F5] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Emergency Category */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-[#A0A0A0] font-medium block">
              Emergency Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`py-2 px-3 border text-xs uppercase font-medium transition-colors text-center ${
                    category === c.id
                      ? 'bg-[#F5F5F5] text-[#111111] border-[#F5F5F5]'
                      : 'bg-[#242424] text-[#A0A0A0] border-[#383838] hover:border-[#707070]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-[#A0A0A0] font-medium block">
              Severity Level *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {severities.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`py-2 px-3 border text-xs uppercase font-semibold transition-colors text-center ${
                    severity === s
                      ? 'bg-[#F5F5F5] text-[#111111] border-[#F5F5F5]'
                      : 'bg-[#242424] text-[#A0A0A0] border-[#383838] hover:border-[#707070]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-[#A0A0A0] font-medium block">
              Symptoms / Injury Description *
            </label>
            <textarea
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe presentation, symptom onset time, and key distress signs..."
              className="w-full bg-[#242424] border border-[#383838] p-3 text-xs text-[#F5F5F5] placeholder-[#707070] focus:outline-none focus:border-[#F5F5F5]"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wider text-[#A0A0A0] font-medium block">
                Current Location & Anchor *
              </label>
              <button
                type="button"
                onClick={handleRequestGeolocation}
                disabled={gpsLoading}
                className="flex items-center space-x-1 text-[11px] uppercase text-[#F5F5F5] hover:underline"
              >
                <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'Acquiring GPS...' : 'Use Device GPS'}</span>
              </button>
            </div>

            {gpsError && <p className="text-[11px] text-[#A0A0A0]">{gpsError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8">
                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="Street address or nearest landmark..."
                  className="w-full bg-[#242424] border border-[#383838] p-2.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="number"
                  step="0.0001"
                  value={latitude ?? ''}
                  onChange={(e) => setLatitude(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Latitude"
                  className="w-full bg-[#242424] border border-[#383838] p-2.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="number"
                  step="0.0001"
                  value={longitude ?? ''}
                  onChange={(e) => setLongitude(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Longitude"
                  className="w-full bg-[#242424] border border-[#383838] p-2.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#A0A0A0] font-medium block mb-1">
                Patient Contact Name (Optional)
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-[#242424] border border-[#383838] p-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#A0A0A0] font-medium block mb-1">
                Emergency Callback Phone (Optional)
              </label>
              <input
                type="text"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full bg-[#242424] border border-[#383838] p-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-[#383838] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#242424] hover:bg-[#2D2D2D] border border-[#383838] text-xs uppercase font-medium tracking-wider text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] text-xs uppercase font-bold tracking-wider flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <span>{isSubmitting ? 'DISPATCHING...' : 'SUBMIT EMERGENCY REQUEST'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
