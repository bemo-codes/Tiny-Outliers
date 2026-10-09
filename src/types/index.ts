export type EmergencyCategory =
  | 'trauma'
  | 'cardiac'
  | 'stroke'
  | 'respiratory'
  | 'pediatric'
  | 'burn'
  | 'general';

export type EmergencySeverity = 'low' | 'moderate' | 'high' | 'critical';

export type EmergencyStatus =
  | 'submitted'
  | 'matching'
  | 'awaiting_confirmation'
  | 'accepted'
  | 'rejected'
  | 'ambulance_assigned'
  | 'en_route'
  | 'arrived'
  | 'admitted'
  | 'cancelled'
  | 'unavailable';

export type EligibilityStatus = 'eligible' | 'ineligible' | 'requires_verification';
export type ResourceFreshness = 'fresh' | 'stale' | 'unknown';
export type AvailabilityStatus = 'available' | 'limited' | 'unavailable' | 'unknown';
export type ResourceType =
  | 'bed'
  | 'ventilator'
  | 'oxygen'
  | 'blood'
  | 'medicine'
  | 'equipment'
  | 'operating_theatre';

export type UserRole = 'patient' | 'hospital_staff' | 'ambulance' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  hospital_id?: string | null;
  created_at: string;
}

export interface HospitalResource {
  id: string;
  hospital_id: string;
  resource_type: ResourceType;
  resource_name: string;
  category: string;
  available_quantity: number;
  total_quantity: number;
  unit: string;
  availability_status: AvailabilityStatus;
  attributes: Record<string, any>;
  updated_by_user_id?: string | null;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
  is_fresh?: boolean;
  freshness_age_minutes?: number;
}

export interface HospitalCapability {
  id: string;
  hospital_id: string;
  capability_code: string;
  capability_name: string;
  is_active: boolean;
  notes?: string;
  last_verified_at: string;
}

export interface HospitalStaffAvailability {
  id: string;
  hospital_id: string;
  specialty: string;
  on_duty_count: number;
  on_call_count: number;
  is_available_now: boolean;
  last_verified_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  tier: string;
  address: string;
  city: string;
  contact_phone: string;
  emergency_direct_line?: string | null;
  latitude: number;
  longitude: number;
  operational_status: 'active' | 'diverted' | 'at_capacity';
  total_capacity: number;
  current_occupancy: number;
  is_synthetic: boolean;
  created_at: string;
  updated_at: string;
  resources?: HospitalResource[];
  capabilities?: HospitalCapability[];
  staff_availability?: HospitalStaffAvailability[];
}

export interface RequiredResourceSpec {
  resource_type: ResourceType;
  minimum_quantity: number;
  attributes?: Record<string, any>;
}

export interface EmergencyRequest {
  id: string;
  category: EmergencyCategory;
  severity: EmergencySeverity;
  patient_age?: number;
  symptoms: string;
  vitals: {
    bp?: string;
    pulse?: number;
    spo2?: number;
    gcs?: number;
    temp?: number;
  };
  allergies?: string;
  medical_history?: string;
  patient_latitude?: number | null;
  patient_longitude?: number | null;
  location_address?: string;
  required_capabilities: string[];
  required_resources: RequiredResourceSpec[];
  status: EmergencyStatus;
  accepted_hospital_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HospitalMatchResult {
  // Required 6 fields
  hospital_id: string;
  match_score: number;
  eta_minutes: number | null;
  eligibility_status: EligibilityStatus;
  missing_requirements: string[];
  resource_snapshot_at: string;
  // Optional fields
  rank?: number;
  distance_km?: number | null;
  reasons: string[];
  resource_freshness: ResourceFreshness;
  hospital_name?: string;
  hospital_address?: string;
  hospital_phone?: string;
  emergency_direct_line?: string | null;
}

export interface HospitalConfirmation {
  id: string;
  emergency_id: string;
  hospital_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  rejection_reason?: string | null;
  decided_by_user_id?: string | null;
  decided_at?: string | null;
  reserved_resources: string[];
  created_at: string;
  updated_at: string;
}

export interface Ambulance {
  id: string;
  call_sign: string;
  vehicle_type: 'BLS' | 'ALS' | 'Mobile ICU';
  current_latitude?: number | null;
  current_longitude?: number | null;
  is_available: boolean;
  assigned_hospital_id?: string | null;
  contact_phone: string;
  created_at: string;
}

export interface AmbulanceAssignment {
  id: string;
  emergency_id: string;
  ambulance_id: string;
  assigned_by_user_id?: string | null;
  driver_name: string;
  assignment_status:
    | 'assigned'
    | 'dispatched'
    | 'en_route'
    | 'arrived_scene'
    | 'transporting'
    | 'completed'
    | 'cancelled';
  estimated_arrival_minutes?: number | null;
  timeline: Array<{
    status: string;
    timestamp: string;
    note?: string;
    actor?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  payload_before?: any;
  payload_after?: any;
  ip_address?: string;
  created_at: string;
}

export interface SyntheticScenario {
  id: string;
  name: string;
  description: string;
  emergency: Partial<EmergencyRequest>;
}
