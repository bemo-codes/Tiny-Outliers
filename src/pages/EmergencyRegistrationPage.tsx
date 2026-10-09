import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';
import {
  EmergencyCategory,
  EmergencySeverity,
  RequiredResourceSpec,
  ResourceType,
} from '../types';
import { SYNTHETIC_SCENARIOS } from '../data/syntheticData';
import {
  Activity,
  Compass,
  AlertCircle,
  ArrowRight,
  PhoneCall,
  Sliders,
  Check,
} from 'lucide-react';

interface EmergencyRegistrationPageProps {
  onSubmitted: (emergencyId: string) => void;
  preselectedScenarioId?: string | null;
}

export const EmergencyRegistrationPage: React.FC<EmergencyRegistrationPageProps> = ({
  onSubmitted,
  preselectedScenarioId,
}) => {
  const initialScenario = SYNTHETIC_SCENARIOS.find((s) => s.id === preselectedScenarioId);

  const [category, setCategory] = useState<EmergencyCategory>(
    (initialScenario?.emergency.category as EmergencyCategory) || 'cardiac'
  );
  const [severity, setSeverity] = useState<EmergencySeverity>(
    (initialScenario?.emergency.severity as EmergencySeverity) || 'critical'
  );
  const [patientAge, setPatientAge] = useState<number | ''>(
    initialScenario?.emergency.patient_age || 58
  );
  const [symptoms, setSymptoms] = useState<string>(
    initialScenario?.emergency.symptoms ||
      'Crushing chest pain radiating to left arm, diaphoretic, severe distress.'
  );
  const [bp, setBp] = useState<string>(initialScenario?.emergency.vitals?.bp || '145/95');
  const [pulse, setPulse] = useState<number | ''>(initialScenario?.emergency.vitals?.pulse || 96);
  const [spo2, setSpo2] = useState<number | ''>(initialScenario?.emergency.vitals?.spo2 || 94);
  const [gcs, setGcs] = useState<number | ''>(initialScenario?.emergency.vitals?.gcs || 15);
  const [allergies, setAllergies] = useState<string>('None reported');
  const [medicalHistory, setMedicalHistory] = useState<string>('Hypertension, Smoker');

  // Location
  const [locationAddress, setLocationAddress] = useState<string>(
    initialScenario?.emergency.location_address || '72 Market Square, Old Commercial District'
  );
  const [latitude, setLatitude] = useState<number | null>(
    initialScenario?.emergency.patient_latitude ?? 19.066
  );
  const [longitude, setLongitude] = useState<number | null>(
    initialScenario?.emergency.patient_longitude ?? 72.8677
  );
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Mandatory requirements
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(
    initialScenario?.emergency.required_capabilities || ['cath_lab']
  );
  const [requiredResources, setRequiredResources] = useState<RequiredResourceSpec[]>(
    initialScenario?.emergency.required_resources || [
      { resource_type: 'bed', minimum_quantity: 1 },
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const categories: { id: EmergencyCategory; label: string }[] = [
    { id: 'cardiac', label: 'Cardiac' },
    { id: 'trauma', label: 'Trauma' },
    { id: 'stroke', label: 'Stroke' },
    { id: 'respiratory', label: 'Respiratory' },
    { id: 'pediatric', label: 'Pediatric' },
    { id: 'burn', label: 'Severe Burns' },
    { id: 'general', label: 'General Acute' },
  ];

  const severities: EmergencySeverity[] = ['critical', 'high', 'moderate', 'low'];

  const capabilityOptions = [
    { id: 'cath_lab', label: '24/7 Primary PCI Cath Lab' },
    { id: 'trauma_center_l1', label: 'Level 1 Trauma Center' },
    { id: 'stroke_unit', label: 'Comprehensive Stroke Unit' },
    { id: 'emergency_ot', label: 'Emergency Operating Theatre' },
    { id: 'pediatric_icu', label: 'Pediatric Intensive Care Unit' },
    { id: 'burn_unit', label: 'Specialized Burn Resuscitation Unit' },
    { id: 'respiratory_icu', label: 'Respiratory Intensive Care Unit' },
  ];

  const handleLoadScenario = (scenarioId: string) => {
    const sc = SYNTHETIC_SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;
    setCategory(sc.emergency.category as EmergencyCategory);
    setSeverity(sc.emergency.severity as EmergencySeverity);
    setPatientAge(sc.emergency.patient_age || '');
    setSymptoms(sc.emergency.symptoms || '');
    setBp(sc.emergency.vitals?.bp || '');
    setPulse(sc.emergency.vitals?.pulse || '');
    setSpo2(sc.emergency.vitals?.spo2 || '');
    setGcs(sc.emergency.vitals?.gcs || 15);
    setLocationAddress(sc.emergency.location_address || '');
    setLatitude(sc.emergency.patient_latitude ?? null);
    setLongitude(sc.emergency.patient_longitude ?? null);
    setSelectedCapabilities(sc.emergency.required_capabilities || []);
    setRequiredResources(
      sc.emergency.required_resources || [{ resource_type: 'bed', minimum_quantity: 1 }]
    );
    setErrorNotice(null);
  };

  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser geolocation is not supported on this device.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Math.round(pos.coords.latitude * 10000) / 10000);
        setLongitude(Math.round(pos.coords.longitude * 10000) / 10000);
        setLocationAddress(
          `Device GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        );
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(`Location access was denied or timed out (${err.message}). Enter manually.`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const toggleCapability = (capId: string) => {
    if (selectedCapabilities.includes(capId)) {
      setSelectedCapabilities(selectedCapabilities.filter((c) => c !== capId));
    } else {
      setSelectedCapabilities([...selectedCapabilities, capId]);
    }
  };

  const handleResourceQuantity = (type: ResourceType, qty: number) => {
    if (qty <= 0) {
      setRequiredResources(requiredResources.filter((r) => r.resource_type !== type));
    } else {
      const existing = requiredResources.find((r) => r.resource_type === type);
      if (existing) {
        setRequiredResources(
          requiredResources.map((r) =>
            r.resource_type === type ? { ...r, minimum_quantity: qty } : r
          )
        );
      } else {
        setRequiredResources([...requiredResources, { resource_type: type, minimum_quantity: qty }]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setErrorNotice('Please provide a symptom or injury description.');
      return;
    }

    setIsSubmitting(true);
    setErrorNotice(null);

    try {
      const emergency = await apiClient.createEmergency({
        category,
        severity,
        patient_age: typeof patientAge === 'number' ? patientAge : undefined,
        symptoms,
        vitals: {
          bp: bp || undefined,
          pulse: typeof pulse === 'number' ? pulse : undefined,
          spo2: typeof spo2 === 'number' ? spo2 : undefined,
          gcs: typeof gcs === 'number' ? gcs : undefined,
        },
        allergies,
        medical_history: medicalHistory,
        patient_latitude: latitude,
        patient_longitude: longitude,
        location_address: locationAddress,
        required_capabilities: selectedCapabilities,
        required_resources: requiredResources,
      });

      onSubmitted(emergency.id);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to register emergency.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-[#383838] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#707070] mb-2">
              <span className="w-2 h-2 bg-[#F5F5F5] inline-block" />
              <span>INCIDENT REGISTRATION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[#F5F5F5]">
              Emergency Intake <span className="font-semibold">&amp; Routing</span>
            </h1>
          </div>
          <a
            href="tel:112"
            className="flex items-center space-x-2 bg-[#1B1B1B] hover:bg-[#242424] text-[#F5F5F5] border border-[#383838] px-3.5 py-2 text-xs uppercase font-medium tracking-wider transition-colors self-start md:self-auto"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>DIAL 112 DIRECT</span>
          </a>
        </div>

        {/* Quick Benchmark Preset Loader */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
            <span className="uppercase font-medium tracking-wider flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>PRE-FILL DETERMINISTIC BENCHMARK SCENARIO</span>
            </span>
            <span className="text-[11px] text-[#707070]">SEED #42</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SYNTHETIC_SCENARIOS.map((sc, i) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleLoadScenario(sc.id)}
                className="bg-[#242424] hover:bg-[#2D2D2D] border border-[#383838] px-3 py-1.5 text-xs text-[#F5F5F5] uppercase tracking-wide transition-colors"
              >
                0{i + 1}. {sc.name.split(':')[1]?.trim() || sc.name}
              </button>
            ))}
          </div>
        </div>

        {errorNotice && (
          <div className="bg-[#242424] border border-[#707070] p-4 text-xs text-[#F5F5F5] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Classification */}
          <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-5">
            <div className="border-b border-[#2D2D2D] pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5]">
                01. Emergency Classification
              </h2>
              <p className="text-xs text-[#A0A0A0] mt-0.5 font-light">
                Categorization enforces mandatory facility, specialist, and medical unit requirements.
              </p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] font-medium mb-2">
                Emergency Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`text-center py-2.5 px-3 border text-xs uppercase font-medium transition-colors ${
                      category === c.id
                        ? 'bg-[#F5F5F5] text-[#111111] border-[#F5F5F5] font-semibold'
                        : 'bg-[#242424] text-[#A0A0A0] border-[#383838] hover:border-[#707070]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] font-medium mb-2">
                Severity Level *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {severities.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`py-2 px-3 border text-xs uppercase font-semibold text-center transition-colors ${
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
          </div>

          {/* Section 2: Clinical Details */}
          <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-5">
            <div className="border-b border-[#2D2D2D] pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5]">
                02. Clinical Presentation &amp; Vitals
              </h2>
              <p className="text-xs text-[#A0A0A0] mt-0.5 font-light">
                Provide concise symptoms to guide hospital readiness.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] font-medium mb-1">
                    Symptoms or Injury Description *
                  </label>
                  <textarea
                    rows={3}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g. Acute severe substernal pressure, diaphoresis, radiating pain..."
                    className="w-full bg-[#242424] border border-[#383838] p-3 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] font-medium mb-1">
                      Patient Age (Optional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={125}
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 58"
                      className="w-full bg-[#242424] border border-[#383838] p-2.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] font-medium mb-1">
                      Known Allergies
                    </label>
                    <input
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g. Penicillin, NSAIDs"
                      className="w-full bg-[#242424] border border-[#383838] p-2.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                    />
                  </div>
                </div>
              </div>

              {/* Vitals Sidebar */}
              <div className="lg:col-span-4 bg-[#242424] border border-[#383838] p-4 space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A0A0A0] block border-b border-[#383838] pb-1">
                  VITAL SIGNS (OPTIONAL)
                </span>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase text-[#707070] block">BP (mmHg)</label>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      placeholder="120/80"
                      className="w-full bg-[#1B1B1B] border border-[#383838] px-2.5 py-1 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase text-[#707070] block">Pulse (BPM)</label>
                      <input
                        type="number"
                        value={pulse}
                        onChange={(e) => setPulse(e.target.value ? Number(e.target.value) : '')}
                        placeholder="85"
                        className="w-full bg-[#1B1B1B] border border-[#383838] px-2.5 py-1 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[#707070] block">SpO2 (%)</label>
                      <input
                        type="number"
                        value={spo2}
                        onChange={(e) => setSpo2(e.target.value ? Number(e.target.value) : '')}
                        placeholder="98"
                        className="w-full bg-[#1B1B1B] border border-[#383838] px-2.5 py-1 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-[#707070] block">GCS Scale (3–15)</label>
                    <input
                      type="number"
                      min={3}
                      max={15}
                      value={gcs}
                      onChange={(e) => setGcs(e.target.value ? Number(e.target.value) : '')}
                      placeholder="15"
                      className="w-full bg-[#1B1B1B] border border-[#383838] px-2.5 py-1 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Location */}
          <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4">
            <div className="border-b border-[#2D2D2D] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5]">
                  03. Incident Location &amp; Coordinates
                </h2>
                <p className="text-xs text-[#A0A0A0] mt-0.5 font-light">
                  Coordinates provide estimated distance and demo ETA without inventing values.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRequestGeolocation}
                disabled={gpsLoading}
                className="bg-[#242424] hover:bg-[#2D2D2D] border border-[#383838] text-[#F5F5F5] px-3 py-1.5 text-xs uppercase font-medium tracking-wider flex items-center space-x-1.5 self-start sm:self-auto transition-colors"
              >
                <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'Acquiring...' : 'Use Device GPS'}</span>
              </button>
            </div>

            {gpsError && (
              <p className="text-xs text-[#A0A0A0] bg-[#242424] border border-[#383838] p-2">
                {gpsError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label className="block text-[11px] uppercase tracking-wider text-[#A0A0A0] font-medium mb-1">
                  Street Address or Landmark
                </label>
                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="e.g. 72 Market Square, Old Commercial District"
                  className="w-full bg-[#242424] border border-[#383838] p-2.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-wider text-[#A0A0A0] font-medium mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude ?? ''}
                  onChange={(e) => setLatitude(e.target.value ? Number(e.target.value) : null)}
                  placeholder="19.076"
                  className="w-full bg-[#242424] border border-[#383838] p-2.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-wider text-[#A0A0A0] font-medium mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude ?? ''}
                  onChange={(e) => setLongitude(e.target.value ? Number(e.target.value) : null)}
                  placeholder="72.877"
                  className="w-full bg-[#242424] border border-[#383838] p-2.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Mandatory Requirements */}
          <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4">
            <div className="border-b border-[#2D2D2D] pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5]">
                04. Mandatory Hospital Capabilities &amp; Units
              </h2>
              <p className="text-xs text-[#A0A0A0] mt-0.5 font-light">
                Hospitals lacking selected criteria will be classified as INELIGIBLE.
              </p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] font-medium mb-2">
                Required Facilities
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {capabilityOptions.map((cap) => {
                  const isChecked = selectedCapabilities.includes(cap.id);
                  return (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => toggleCapability(cap.id)}
                      className={`text-left px-3 py-2 border text-xs uppercase font-medium flex items-center justify-between transition-colors ${
                        isChecked
                          ? 'bg-[#F5F5F5] text-[#111111] border-[#F5F5F5]'
                          : 'bg-[#242424] text-[#A0A0A0] border-[#383838] hover:border-[#707070]'
                      }`}
                    >
                      <span className="truncate">{cap.label}</span>
                      <span className="text-[10px] ml-2 shrink-0">
                        {isChecked ? '[REQUIRED]' : '[OPTIONAL]'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A0A0A0] font-medium mb-2">
                Required Bed &amp; Critical Equipment Units
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { type: 'bed' as ResourceType, label: 'ICU / ED Bay' },
                  { type: 'ventilator' as ResourceType, label: 'Ventilator' },
                  { type: 'blood' as ResourceType, label: 'PRBC Blood Unit' },
                  { type: 'medicine' as ResourceType, label: 'Specialized Drug' },
                ].map((item) => {
                  const currentQty =
                    requiredResources.find((r) => r.resource_type === item.type)?.minimum_quantity || 0;
                  return (
                    <div key={item.type} className="border border-[#383838] p-3 bg-[#242424]">
                      <span className="text-[10px] uppercase text-[#707070] font-medium block mb-1">
                        {item.label}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleResourceQuantity(item.type, Math.max(0, currentQty - 1))}
                          className="w-7 h-7 bg-[#1B1B1B] border border-[#383838] hover:bg-[#F5F5F5] hover:text-[#111111] font-bold transition-colors"
                        >
                          -
                        </button>
                        <span className="font-bold text-sm w-6 text-center text-[#F5F5F5]">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleResourceQuantity(item.type, currentQty + 1)}
                          className="w-7 h-7 bg-[#1B1B1B] border border-[#383838] hover:bg-[#F5F5F5] hover:text-[#111111] font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="bg-[#1B1B1B] border border-[#383838] p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs uppercase tracking-wider text-[#A0A0A0] font-medium block">
                EXECUTION CONFIRMATION
              </span>
              <p className="text-xs text-[#707070] font-light">
                Initiates deterministic ranking against all 12 registered facilities.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] px-8 py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 shrink-0"
            >
              <span>{isSubmitting ? 'Evaluating Hospitals...' : 'Submit Emergency Request'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
