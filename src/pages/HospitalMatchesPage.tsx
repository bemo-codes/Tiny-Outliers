import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import {
  EmergencyRequest,
  Hospital,
  HospitalMatchResult,
  EligibilityStatus,
  HospitalResource,
} from '../types';
import { EmergencyMap } from '../components/map/EmergencyMap';
import { EmergencyTimeline } from '../components/common/EmergencyTimeline';
import {
  PhoneCall,
  Navigation,
  Check,
  AlertTriangle,
  X,
  MapPin,
  Clock,
  Building2,
  Filter,
  ArrowRight,
  Activity,
  Layers,
} from 'lucide-react';

interface HospitalMatchesPageProps {
  emergencyId: string;
  onNavigate: (path: string) => void;
}

export const HospitalMatchesPage: React.FC<HospitalMatchesPageProps> = ({
  emergencyId,
  onNavigate,
}) => {
  const [emergency, setEmergency] = useState<EmergencyRequest | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [matches, setMatches] = useState<HospitalMatchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | EligibilityStatus>('all');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  // Request Confirmation State
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [emg, hospList, matchResults] = await Promise.all([
          apiClient.getEmergency(emergencyId),
          apiClient.getHospitals(),
          apiClient.getMatches(emergencyId),
        ]);
        setEmergency(emg);
        setHospitals(hospList);
        setMatches(matchResults);
        if (matchResults.length > 0) {
          setSelectedHospitalId(matchResults[0].hospital_id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve match results.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [emergencyId]);

  const handleRequestConfirmation = async (hospitalId: string) => {
    setRequestingId(hospitalId);
    setConfirmationNotice(null);
    try {
      await apiClient.requestConfirmation(emergencyId, hospitalId);
      setConfirmedId(hospitalId);
      setConfirmationNotice(
        'Admission request dispatched to hospital staff queue. Contact the facility directly below to accelerate triage intake.'
      );
      // Reload emergency status
      const updatedEmg = await apiClient.getEmergency(emergencyId);
      setEmergency(updatedEmg);
    } catch (err: any) {
      setConfirmationNotice(`Failed to transmit request: ${err.message}`);
    } finally {
      setRequestingId(null);
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (statusFilter === 'all') return true;
    return m.eligibility_status === statusFilter;
  });

  const patientCoords =
    emergency?.patient_latitude && emergency?.patient_longitude
      ? { lat: emergency.patient_latitude, lng: emergency.patient_longitude }
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
        <div className="bg-[#1B1B1B] text-[#F5F5F5] p-8 border border-[#383838] text-center space-y-3 max-w-sm">
          <Activity className="w-6 h-6 mx-auto animate-pulse text-[#F5F5F5]" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#F5F5F5]">
            Evaluating Match Suitability...
          </h2>
          <p className="text-xs text-[#A0A0A0] font-light">
            Verifying mandatory hospital facilities, ICU beds, and resource freshness.
          </p>
        </div>
      </div>
    );
  }

  if (error || !emergency) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
        <div className="bg-[#1B1B1B] border border-[#383838] p-8 max-w-md w-full space-y-4">
          <div className="flex items-center space-x-2 text-[#F5F5F5]">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-semibold text-sm uppercase">Incident Match Record Not Found</h2>
          </div>
          <p className="text-xs text-[#A0A0A0] font-light">
            {error || 'Unable to locate matching results for this incident token.'}
          </p>
          <button
            onClick={() => onNavigate('/emergency/new')}
            className="w-full bg-[#F5F5F5] text-[#111111] py-2.5 text-xs uppercase font-bold tracking-wider"
          >
            Start New Emergency Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Incident Summary Bar */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2D2D2D] pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-3 text-xs text-[#707070] uppercase tracking-wider font-mono">
                <span>INCIDENT #{emergency.id}</span>
                <span>/</span>
                <span className="text-[#F5F5F5] font-semibold">
                  {emergency.category.toUpperCase()} ({emergency.severity.toUpperCase()})
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F5]">
                Hospital Discovery <span className="font-semibold">&amp; Matching</span>
              </h1>
              <p className="text-xs text-[#A0A0A0] font-light">
                Symptoms: &ldquo;{emergency.symptoms}&rdquo;
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => onNavigate(`/emergency/${emergency.id}`)}
                className="bg-[#242424] hover:bg-[#2D2D2D] border border-[#383838] text-[#F5F5F5] px-3.5 py-2 text-xs uppercase font-medium tracking-wider transition-colors"
              >
                View Incident File
              </button>
              <button
                onClick={() => onNavigate('/emergency/new')}
                className="bg-[#F5F5F5] text-[#111111] hover:bg-[#FFFFFF] px-3.5 py-2 text-xs uppercase font-bold tracking-wider transition-colors"
              >
                Modify Criteria
              </button>
            </div>
          </div>

          {/* Lifecycle Status Timeline */}
          <div className="pt-1">
            <EmergencyTimeline status={emergency.status} />
          </div>
        </div>

        {/* Confirmation Notification Banner */}
        {confirmationNotice && (
          <div className="bg-[#1B1B1B] border border-[#F5F5F5] p-4 text-xs flex items-start gap-3">
            <Check className="w-4 h-4 text-[#F5F5F5] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold uppercase tracking-wider text-[#F5F5F5] block">
                ADMISSION REQUEST DISPATCHED
              </span>
              <p className="text-[#A0A0A0] font-light">{confirmationNotice}</p>
            </div>
          </div>
        )}

        {/* Main Discovery Workspace: Map on Left / Cards on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Tactical Radar Map Container */}
          <div className="lg:col-span-5 sticky top-24 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#A0A0A0] px-1 font-mono">
              <span className="uppercase tracking-wider">TACTICAL MAP OVERLAY</span>
              <span className="text-[11px] text-[#707070]">
                {patientCoords ? 'GPS LOCATED' : 'MANUAL ANCHOR'}
              </span>
            </div>

            <EmergencyMap
              patientCoords={patientCoords}
              hospitals={hospitals}
              matches={matches}
              selectedHospitalId={selectedHospitalId}
              onSelectHospital={(id) => {
                setSelectedHospitalId(id);
                const card = document.getElementById(`card-${id}`);
                if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }}
              className="h-80 lg:h-[600px] w-full border border-[#383838] bg-[#111111] shadow-xl"
            />

            <div className="text-[11px] text-[#707070] font-mono leading-tight px-1">
              * Grayscale tiles. Markers highlight eligibility: solid white = eligible, gray = verification needed, dark = ineligible.
            </div>
          </div>

          {/* Ranked Hospital Cards List */}
          <div className="lg:col-span-7 space-y-4">
            {/* Filter and Count Header */}
            <div className="bg-[#1B1B1B] border border-[#383838] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <Filter className="w-3.5 h-3.5 text-[#707070]" />
                <span className="text-[11px] uppercase tracking-wider text-[#A0A0A0] font-medium">
                  FILTER:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      { id: 'all', label: `ALL (${matches.length})` },
                      {
                        id: 'eligible',
                        label: `ELIGIBLE (${matches.filter((m) => m.eligibility_status === 'eligible').length})`,
                      },
                      {
                        id: 'requires_verification',
                        label: `VERIFICATION (${matches.filter((m) => m.eligibility_status === 'requires_verification').length})`,
                      },
                      {
                        id: 'ineligible',
                        label: `INELIGIBLE (${matches.filter((m) => m.eligibility_status === 'ineligible').length})`,
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors border ${
                        statusFilter === f.id
                          ? 'bg-[#F5F5F5] text-[#111111] border-[#F5F5F5] font-semibold'
                          : 'bg-[#242424] text-[#A0A0A0] border-[#383838] hover:border-[#707070]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-[11px] text-[#707070] font-mono self-end sm:self-auto">
                CRITERIA: SUITABILITY &gt; DISTANCE
              </span>
            </div>

            {/* List */}
            {filteredMatches.length === 0 ? (
              <div className="bg-[#1B1B1B] border border-[#383838] p-12 text-center text-xs text-[#A0A0A0] space-y-2">
                <Building2 className="w-8 h-8 mx-auto text-[#707070]" />
                <h3 className="font-semibold uppercase text-[#F5F5F5]">No matching hospitals found</h3>
                <p className="font-light">No registered facilities meet the active filter state.</p>
              </div>
            ) : (
              filteredMatches.map((m) => {
                const hosp = hospitals.find((h) => h.id === m.hospital_id);
                const isSelected = selectedHospitalId === m.hospital_id;
                const hasPhone = Boolean(m.hospital_phone && m.hospital_phone.trim().length > 4);
                const hasCoords = Boolean(hosp && hosp.latitude && hosp.longitude);
                const isRequested = confirmedId === m.hospital_id;

                const mapsUrl = hasCoords
                  ? `https://www.google.com/maps/dir/?api=1&destination=${hosp!.latitude},${hosp!.longitude}`
                  : null;

                // Status styling
                let statusBadge = (
                  <span className="px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-semibold bg-[#F5F5F5] text-[#111111]">
                    ELIGIBLE
                  </span>
                );

                if (m.eligibility_status === 'requires_verification') {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-medium bg-[#2D2D2D] text-[#F5F5F5] border border-[#383838]">
                      REQUIRES VERIFICATION
                    </span>
                  );
                } else if (m.eligibility_status === 'ineligible') {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-medium bg-[#1B1B1B] text-[#707070] border border-[#383838]">
                      INELIGIBLE
                    </span>
                  );
                }

                // Relevant resources
                const hospResources = hosp?.resources || [];

                return (
                  <div
                    key={m.hospital_id}
                    id={`card-${m.hospital_id}`}
                    onClick={() => setSelectedHospitalId(m.hospital_id)}
                    className={`bg-[#1B1B1B] border transition-all duration-150 p-6 space-y-5 cursor-pointer ${
                      isSelected
                        ? 'border-[#F5F5F5] ring-1 ring-[#F5F5F5]'
                        : 'border-[#383838] hover:border-[#707070]'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 border-b border-[#2D2D2D] pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-xs font-mono text-[#707070]">
                          <span className="font-bold text-[#F5F5F5]">RANK #{m.rank}</span>
                          <span>·</span>
                          <span className="uppercase">{hosp?.code}</span>
                          <span>·</span>
                          <span className="uppercase">{hosp?.tier}</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#F5F5F5]">
                          {m.hospital_name || hosp?.name}
                        </h2>
                        <p className="text-xs text-[#A0A0A0] flex items-center space-x-1 font-light">
                          <MapPin className="w-3.5 h-3.5 text-[#707070]" />
                          <span>{m.hospital_address || hosp?.address}</span>
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                        {statusBadge}
                        <div className="text-right font-mono">
                          <span className="text-[10px] text-[#707070] uppercase block">MATCH SCORE</span>
                          <span className="text-2xl font-bold text-[#F5F5F5]">{m.match_score}</span>
                          <span className="text-xs text-[#707070]">/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#242424] border border-[#383838] p-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-[#707070] font-medium block">
                          TRANSIT ESTIMATE
                        </span>
                        <span className="font-semibold text-[#F5F5F5]">
                          {m.eta_minutes !== null ? `~${m.eta_minutes} mins` : 'N/A (No GPS)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#707070] font-medium block">
                          DISTANCE
                        </span>
                        <span className="font-semibold text-[#F5F5F5]">
                          {m.distance_km !== null ? `${m.distance_km} km` : 'Manual'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#707070] font-medium block">
                          DATA FRESHNESS
                        </span>
                        <span className="font-semibold uppercase text-[#F5F5F5]">
                          {m.resource_freshness}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#707070] font-medium block">
                          TELEMETRY TS
                        </span>
                        <span className="text-[#A0A0A0] text-[11px]">
                          {new Date(m.resource_snapshot_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Compact Resource Availability Indicators */}
                    {hospResources.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] uppercase tracking-wider text-[#707070] font-medium block">
                          HOSPITAL RESOURCE TELEMETRY
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {hospResources.slice(0, 4).map((r) => {
                            let statusText = 'AVAILABLE';
                            let statusStyle = 'text-[#F5F5F5] font-semibold';
                            if (r.availability_status === 'limited') {
                              statusText = 'LIMITED';
                              statusStyle = 'text-[#A0A0A0]';
                            } else if (r.availability_status === 'unavailable') {
                              statusText = 'UNAVAILABLE';
                              statusStyle = 'text-[#707070] line-through';
                            } else if (r.availability_status === 'unknown') {
                              statusText = 'UNKNOWN';
                              statusStyle = 'text-[#707070] italic';
                            }

                            return (
                              <div
                                key={r.id}
                                className="bg-[#242424] border border-[#383838] p-2 text-[11px]"
                              >
                                <span className="text-[#A0A0A0] block truncate">
                                  {r.resource_name}
                                </span>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="font-mono text-[#F5F5F5]">
                                    {r.available_quantity} {r.unit}
                                  </span>
                                  <span className={`text-[10px] uppercase ${statusStyle}`}>
                                    {statusText}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Explainability Reasons */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] uppercase tracking-wider text-[#707070] font-medium block">
                        EXPLAINABLE RANKING FACTORS
                      </span>
                      <ul className="space-y-1 text-[#A0A0A0] font-light">
                        {m.reasons.map((r, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5">
                            <span className="text-[#707070]">·</span>
                            <span className={r.startsWith('INELIGIBLE:') ? 'text-[#F5F5F5] font-medium' : ''}>
                              {r}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Missing requirements warning */}
                    {m.missing_requirements.length > 0 && (
                      <div className="bg-[#242424] border border-[#383838] p-3 text-xs space-y-1">
                        <span className="text-[11px] font-semibold uppercase text-[#F5F5F5] flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#F5F5F5]" />
                          <span>MANDATORY CRITERIA DEFICIT</span>
                        </span>
                        <ul className="list-disc list-inside text-[#A0A0A0] text-[11px] font-light">
                          {m.missing_requirements.map((req, rIdx) => (
                            <li key={rIdx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-[#2D2D2D] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        {hasPhone ? (
                          <a
                            href={`tel:${m.hospital_phone}`}
                            className="bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-colors"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>CALL: {m.hospital_phone}</span>
                          </a>
                        ) : (
                          <span className="bg-[#242424] text-[#707070] border border-[#383838] px-3.5 py-2 text-xs uppercase font-medium cursor-not-allowed">
                            PHONE NUMBER UNAVAILABLE
                          </span>
                        )}

                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#242424] hover:bg-[#2D2D2D] text-[#F5F5F5] border border-[#383838] px-3 py-2 text-xs uppercase font-medium tracking-wider flex items-center space-x-1.5 transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5 text-[#A0A0A0]" />
                            <span>DIRECTIONS</span>
                          </a>
                        )}

                        <button
                          onClick={() => onNavigate(`/hospitals/${m.hospital_id}`)}
                          className="text-xs uppercase font-medium text-[#A0A0A0] hover:text-[#F5F5F5] px-2 py-1"
                        >
                          VIEW DOSSIER
                        </button>
                      </div>

                      {/* Request Admission / Confirmation */}
                      <div>
                        {isRequested ? (
                          <span className="bg-[#2D2D2D] border border-[#383838] text-[#F5F5F5] px-3.5 py-2 text-xs uppercase font-semibold tracking-wider flex items-center space-x-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>REQUEST SENT</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRequestConfirmation(m.hospital_id)}
                            disabled={requestingId === m.hospital_id || m.eligibility_status === 'ineligible'}
                            className={`w-full sm:w-auto px-4 py-2 text-xs uppercase font-medium tracking-wider border transition-colors flex items-center justify-center space-x-2 ${
                              m.eligibility_status === 'ineligible'
                                ? 'bg-[#1B1B1B] text-[#707070] border-[#383838] cursor-not-allowed opacity-50'
                                : 'bg-[#242424] text-[#F5F5F5] border-[#383838] hover:bg-[#2D2D2D]'
                            }`}
                          >
                            <span>
                              {requestingId === m.hospital_id ? 'TRANSMITTING...' : 'REQUEST ACCEPTANCE'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
