import {
  EmergencyRequest,
  Hospital,
  HospitalMatchResult,
  HospitalResource,
  HospitalConfirmation,
  Ambulance,
  AmbulanceAssignment,
  AuditLog,
  User,
  UserRole,
} from '../types';
import {
  INITIAL_HOSPITALS,
  INITIAL_CAPABILITIES,
  INITIAL_STAFF,
  generateInitialResources,
  DEMO_USERS,
  INITIAL_AMBULANCES,
  SYNTHETIC_SCENARIOS,
} from '../data/syntheticData';
import { rankHospitalsClient } from './matchingEngine';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const INITIAL_MODE = (import.meta.env.VITE_HOSPITAL_API_MODE || 'demo') as 'api' | 'demo';

// Local storage keys for persistent demo state
const STORAGE_PREFIX = 'careroute_state_';

class LocalStateManager {
  hospitals: Hospital[];
  resources: HospitalResource[];
  emergencies: EmergencyRequest[];
  matches: Record<string, HospitalMatchResult[]>;
  confirmations: HospitalConfirmation[];
  ambulances: Ambulance[];
  assignments: AmbulanceAssignment[];
  auditLogs: AuditLog[];
  currentUser: User;

  constructor() {
    this.hospitals = INITIAL_HOSPITALS.map((h) => ({
      ...h,
      capabilities: INITIAL_CAPABILITIES.filter((c) => c.hospital_id === h.id),
      staff_availability: INITIAL_STAFF.filter((s) => s.hospital_id === h.id),
    }));
    this.resources = generateInitialResources();
    this.emergencies = [];
    this.matches = {};
    this.confirmations = [];
    this.ambulances = [...INITIAL_AMBULANCES];
    this.assignments = [];
    this.auditLogs = [];
    this.currentUser = DEMO_USERS[0]; // Patient by default

    // Attach resources to hospitals
    this.syncHospitalResources();

    // Initialize the 5 scenarios into emergencies store
    for (const sc of SYNTHETIC_SCENARIOS) {
      const emg = sc.emergency;
      const fullEmg: EmergencyRequest = {
        id: sc.id,
        category: emg.category || 'general',
        severity: emg.severity || 'moderate',
        patient_age: emg.patient_age,
        symptoms: emg.symptoms || '',
        vitals: emg.vitals || {},
        required_capabilities: emg.required_capabilities || [],
        required_resources: emg.required_resources || [],
        patient_latitude: emg.patient_latitude,
        patient_longitude: emg.patient_longitude,
        location_address: emg.location_address,
        status: 'matching',
        accepted_hospital_id: null,
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.emergencies.push(fullEmg);
      this.matches[sc.id] = rankHospitalsClient(fullEmg, this.hospitals);
    }
  }

  syncHospitalResources() {
    for (const h of this.hospitals) {
      h.resources = this.resources.filter((r) => r.hospital_id === h.id);
    }
  }
}

const localState = new LocalStateManager();

export interface ApiClientConfig {
  mode: 'api' | 'demo';
  token: string | null;
}

export class CareRouteApiClient {
  private config: ApiClientConfig = {
    mode: INITIAL_MODE,
    token: null,
  };

  getMode(): 'api' | 'demo' {
    return this.config.mode;
  }

  setMode(mode: 'api' | 'demo') {
    this.config.mode = mode;
  }

  getToken(): string | null {
    return this.config.token;
  }

  setToken(token: string | null) {
    this.config.token = token;
  }

  getCurrentUser(): User {
    return localState.currentUser;
  }

  setCurrentUser(user: User) {
    localState.currentUser = user;
  }

  switchRole(role: UserRole, hospitalId?: string | null) {
    const found = DEMO_USERS.find((u) => u.role === role);
    if (found) {
      localState.currentUser = {
        ...found,
        hospital_id: hospitalId !== undefined ? hospitalId : found.hospital_id,
      };
    } else {
      localState.currentUser = {
        id: `usr-${role}-demo`,
        email: `${role}@careroute.org`,
        full_name: `Demo ${role.toUpperCase()}`,
        role,
        hospital_id: hospitalId || null,
        created_at: new Date().toISOString(),
      };
    }
  }

  private async fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const json = await response.json();
    if (!response.ok) {
      const err = json?.error || {
        code: `HTTP_${response.status}`,
        message: response.statusText || 'Request failed',
      };
      throw new Error(err.message || 'API error');
    }
    return json.data;
  }

  // Hospitals
  async getHospitals(): Promise<Hospital[]> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<Hospital[]>('/hospitals');
      } catch (err) {
        console.warn('Backend API unavailable, displaying demo data:', err);
      }
    }
    return [...localState.hospitals];
  }

  async getHospital(hospitalId: string): Promise<Hospital> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<Hospital>(`/hospitals/${hospitalId}`);
      } catch (err) {
        console.warn('Backend API unavailable, using local hospital:', err);
      }
    }
    const h = localState.hospitals.find((x) => x.id === hospitalId);
    if (!h) throw new Error(`Hospital ${hospitalId} not found`);
    return { ...h };
  }

  async getHospitalResources(hospitalId: string): Promise<HospitalResource[]> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<HospitalResource[]>(`/hospitals/${hospitalId}/resources`);
      } catch (err) {
        console.warn('API mode failed, using local resources:', err);
      }
    }
    const now = Date.now();
    return localState.resources
      .filter((r) => r.hospital_id === hospitalId)
      .map((r) => {
        const ageMin = r.last_verified_at
          ? (now - new Date(r.last_verified_at).getTime()) / 60000
          : 999;
        return {
          ...r,
          is_fresh: ageMin <= 10,
          freshness_age_minutes: Math.round(ageMin * 10) / 10,
        };
      });
  }

  async updateResource(
    hospitalId: string,
    resourceId: string,
    updates: Partial<HospitalResource>
  ): Promise<HospitalResource> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<HospitalResource>(
          `/hospitals/${hospitalId}/resources/${resourceId}`,
          {
            method: 'PUT',
            body: JSON.stringify(updates),
          }
        );
      } catch (err) {
        console.warn('API resource update failed, falling back to local:', err);
      }
    }

    const res = localState.resources.find(
      (r) => r.id === resourceId && r.hospital_id === hospitalId
    );
    if (!res) throw new Error('Resource not found');

    const nowIso = new Date().toISOString();
    const oldBefore = { ...res };

    Object.assign(res, updates, {
      last_verified_at: nowIso,
      updated_at: nowIso,
      updated_by_user_id: localState.currentUser.id,
      is_fresh: true,
      freshness_age_minutes: 0,
    });

    localState.syncHospitalResources();

    // Log audit
    localState.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      actor_id: localState.currentUser.id,
      action: 'UPDATE_RESOURCE',
      entity_type: 'HospitalResource',
      entity_id: resourceId,
      payload_before: oldBefore,
      payload_after: { ...res },
      created_at: nowIso,
    });

    return { ...res };
  }

  // Emergencies & Matches
  async createEmergency(payload: Partial<EmergencyRequest>): Promise<EmergencyRequest> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<EmergencyRequest>('/emergencies', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('API emergency create failed, using local engine:', err);
      }
    }

    const newId = `emg-${Date.now().toString(36)}`;
    const fullEmg: EmergencyRequest = {
      id: newId,
      category: payload.category || 'general',
      severity: payload.severity || 'moderate',
      patient_age: payload.patient_age,
      symptoms: payload.symptoms || '',
      vitals: payload.vitals || {},
      allergies: payload.allergies,
      medical_history: payload.medical_history,
      patient_latitude: payload.patient_latitude,
      patient_longitude: payload.patient_longitude,
      location_address: payload.location_address,
      required_capabilities: payload.required_capabilities || [],
      required_resources: payload.required_resources || [],
      status: 'matching',
      accepted_hospital_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localState.emergencies.unshift(fullEmg);
    localState.matches[newId] = rankHospitalsClient(fullEmg, localState.hospitals);

    return fullEmg;
  }

  async getEmergency(emergencyId: string): Promise<EmergencyRequest> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<EmergencyRequest>(`/emergencies/${emergencyId}`);
      } catch (err) {
        console.warn('API get emergency failed:', err);
      }
    }
    const emg = localState.emergencies.find((e) => e.id === emergencyId);
    if (!emg) throw new Error(`Emergency ${emergencyId} not found`);
    return emg;
  }

  async getMatches(emergencyId: string): Promise<HospitalMatchResult[]> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<HospitalMatchResult[]>(`/emergencies/${emergencyId}/matches`);
      } catch (err) {
        console.warn('API get matches failed, computing client-side matches:', err);
      }
    }
    if (localState.matches[emergencyId]) {
      return localState.matches[emergencyId];
    }
    const emg = localState.emergencies.find((e) => e.id === emergencyId);
    if (!emg) throw new Error(`Emergency ${emergencyId} not found`);
    const computed = rankHospitalsClient(emg, localState.hospitals);
    localState.matches[emergencyId] = computed;
    return computed;
  }

  // Confirmations
  async requestConfirmation(emergencyId: string, hospitalId: string): Promise<HospitalConfirmation> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<HospitalConfirmation>('/confirmations', {
          method: 'POST',
          body: JSON.stringify({ emergency_id: emergencyId, hospital_id: hospitalId }),
        });
      } catch (err) {
        console.warn('API confirmation request failed, using local dispatch:', err);
      }
    }

    const conf: HospitalConfirmation = {
      id: `cnf-${Date.now().toString(36)}`,
      emergency_id: emergencyId,
      hospital_id: hospitalId,
      status: 'pending',
      rejection_reason: null,
      decided_by_user_id: null,
      decided_at: null,
      reserved_resources: ['Emergency Resuscitation Bay', 'Initial Nursing Triage'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localState.confirmations.unshift(conf);

    const emg = localState.emergencies.find((e) => e.id === emergencyId);
    if (emg) {
      emg.status = 'awaiting_confirmation';
      emg.updated_at = new Date().toISOString();
    }

    return conf;
  }

  async decideConfirmation(
    confirmationId: string,
    status: 'accepted' | 'rejected',
    rejectionReason?: string
  ): Promise<HospitalConfirmation> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<HospitalConfirmation>(`/confirmations/${confirmationId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status, rejection_reason: rejectionReason }),
        });
      } catch (err) {
        console.warn('API confirmation decision failed, updating locally:', err);
      }
    }

    const conf = localState.confirmations.find((c) => c.id === confirmationId);
    if (!conf) throw new Error(`Confirmation ${confirmationId} not found`);

    conf.status = status;
    conf.rejection_reason = status === 'rejected' ? rejectionReason || 'Capacity saturated' : null;
    conf.decided_by_user_id = localState.currentUser.id;
    conf.decided_at = new Date().toISOString();
    conf.updated_at = new Date().toISOString();

    const emg = localState.emergencies.find((e) => e.id === conf.emergency_id);
    if (emg) {
      emg.status = status === 'accepted' ? 'accepted' : 'rejected';
      if (status === 'accepted') {
        emg.accepted_hospital_id = conf.hospital_id;
      }
      emg.updated_at = new Date().toISOString();
    }

    localState.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      actor_id: localState.currentUser.id,
      action: `CONFIRMATION_${status.toUpperCase()}`,
      entity_type: 'HospitalConfirmation',
      entity_id: confirmationId,
      payload_after: { ...conf },
      created_at: new Date().toISOString(),
    });

    return conf;
  }

  async getConfirmations(hospitalId?: string): Promise<HospitalConfirmation[]> {
    if (this.config.mode === 'api') {
      try {
        const query = hospitalId ? `?hospital_id=${hospitalId}` : '';
        return await this.fetchApi<HospitalConfirmation[]>(`/confirmations${query}`);
      } catch (err) {
        console.warn('API get confirmations failed:', err);
      }
    }
    if (hospitalId) {
      return localState.confirmations.filter((c) => c.hospital_id === hospitalId);
    }
    return [...localState.confirmations];
  }

  // Ambulances
  async getAmbulances(): Promise<Ambulance[]> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<Ambulance[]>('/ambulances');
      } catch (err) {
        console.warn('API ambulances failed:', err);
      }
    }
    return [...localState.ambulances];
  }

  async assignAmbulance(emergencyId: string, ambulanceId: string): Promise<AmbulanceAssignment> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<AmbulanceAssignment>('/ambulances/assignments', {
          method: 'POST',
          body: JSON.stringify({
            emergency_id: emergencyId,
            ambulance_id: ambulanceId,
            driver_name: 'Officer David Miller, EMT-P',
          }),
        });
      } catch (err) {
        console.warn('API ambulance assignment failed:', err);
      }
    }

    const asg: AmbulanceAssignment = {
      id: `asg-${Date.now().toString(36)}`,
      emergency_id: emergencyId,
      ambulance_id: ambulanceId,
      assigned_by_user_id: localState.currentUser.id,
      driver_name: 'Officer David Miller, EMT-P',
      assignment_status: 'dispatched',
      estimated_arrival_minutes: 8.5,
      timeline: [
        {
          status: 'assigned',
          timestamp: new Date().toISOString(),
          note: 'Unit dispatched by regional command',
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localState.assignments.unshift(asg);

    const amb = localState.ambulances.find((a) => a.id === ambulanceId);
    if (amb) amb.is_available = false;

    const emg = localState.emergencies.find((e) => e.id === emergencyId);
    if (emg) {
      emg.status = 'ambulance_assigned';
      emg.updated_at = new Date().toISOString();
    }

    return asg;
  }

  async updateAmbulanceStatus(
    assignmentId: string,
    status: AmbulanceAssignment['assignment_status'],
    note?: string
  ): Promise<AmbulanceAssignment> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<AmbulanceAssignment>(
          `/ambulances/assignments/${assignmentId}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ assignment_status: status, note }),
          }
        );
      } catch (err) {
        console.warn('API ambulance status failed:', err);
      }
    }

    const asg = localState.assignments.find((a) => a.id === assignmentId);
    if (!asg) throw new Error(`Assignment ${assignmentId} not found`);

    asg.assignment_status = status;
    asg.updated_at = new Date().toISOString();
    asg.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Telemetry transition: ${status}`,
      actor: localState.currentUser.id,
    });

    const emg = localState.emergencies.find((e) => e.id === asg.emergency_id);
    if (emg) {
      if (status === 'en_route') emg.status = 'en_route';
      else if (status === 'arrived_scene') emg.status = 'arrived';
      else if (status === 'completed') emg.status = 'admitted';
      emg.updated_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'cancelled') {
      const amb = localState.ambulances.find((a) => a.id === asg.ambulance_id);
      if (amb) amb.is_available = true;
    }

    return asg;
  }

  async getAssignments(): Promise<AmbulanceAssignment[]> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<AmbulanceAssignment[]>('/ambulances/assignments');
      } catch (err) {
        console.warn('API get assignments failed:', err);
      }
    }
    return [...localState.assignments];
  }

  // Admin & Audit
  async getAuditLogs(): Promise<AuditLog[]> {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<AuditLog[]>('/health/audit-logs');
      } catch (err) {
        console.warn('API audit logs failed:', err);
      }
    }
    return [...localState.auditLogs];
  }

  async getHealthMetrics() {
    if (this.config.mode === 'api') {
      try {
        return await this.fetchApi<any>('/health');
      } catch (err) {
        console.warn('API health failed:', err);
      }
    }

    let fresh = 0;
    let stale = 0;
    let unknown = 0;
    let unavailable = 0;
    const now = Date.now();

    for (const r of localState.resources) {
      if (r.availability_status === 'unavailable') unavailable++;
      else if (r.availability_status === 'unknown') unknown++;

      const ageMin = r.last_verified_at
        ? (now - new Date(r.last_verified_at).getTime()) / 60000
        : 999;
      if (ageMin <= 10) fresh++;
      else stale++;
    }

    return {
      status: 'healthy',
      service: 'CARE/ROUTE Emergency Core Engine',
      version: '1.0.0',
      database_backend: 'Local Verified Store (PostgreSQL Specification Compatible)',
      mode: 'mock_demo_verified',
      stale_threshold_minutes: 10,
      metrics: {
        hospitals_registered: localState.hospitals.length,
        resources_tracked: localState.resources.length,
        fresh_resources: fresh,
        stale_resources: stale,
        unknown_resources: unknown,
        unavailable_resources: unavailable,
        active_emergencies: localState.emergencies.length,
        audit_records: localState.auditLogs.length,
      },
    };
  }
}

export const apiClient = new CareRouteApiClient();
