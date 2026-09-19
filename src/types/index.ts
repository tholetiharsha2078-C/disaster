export type UserRole = 'citizen' | 'authority';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  address?: string;
  isApproximate?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location: UserLocation;
  createdAt: string;
}

export type IncidentType =
  | 'Flood'
  | 'Fire'
  | 'Earthquake'
  | 'Storm'
  | 'Road blockage'
  | 'Building damage'
  | 'Landslide'
  | 'Electrical hazard'
  | 'Other emergency';

export type IncidentStatus = 'UNVERIFIED' | 'CONFIRMED' | 'REJECTED' | 'RESOLVED';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Evidence {
  id: string;
  incidentId: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  uploadedAt: string;
  caption?: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  latitude: number;
  longitude: number;
  address?: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  confidence: number; // 0 to 100 percentage
  createdAt: string;
  updatedAt: string;
  reporterId: string;
  reporterName?: string;
  evidence: Evidence[];
  alertRadiusKm: number;
  verificationStats: {
    confirmations: number;
    notPresent: number;
    unsure: number;
    totalVerifiers: number;
  };
}

export type VerificationResponse = 'CONFIRM' | 'NOT_PRESENT' | 'UNSURE';

export interface Verification {
  id: string;
  incidentId: string;
  userId: string;
  userName?: string;
  response: VerificationResponse;
  distanceFromIncident: number; // in km
  createdAt: string;
  notes?: string;
}

export type AlertLevel = 'HIGH' | 'ALERT' | 'CAUTION' | 'NORMAL';

export interface Alert {
  id: string;
  incidentId: string;
  incidentType: IncidentType;
  headline: string;
  message: string;
  alertLevel: AlertLevel;
  radiusKm: number;
  latitude: number;
  longitude: number;
  createdAt: string;
  expiresAt: string;
}

export interface Authority {
  id: string;
  organization: string;
  role: string;
  jurisdiction: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  incidentId: string;
  details: string;
  timestamp: string;
}

export interface EmergencyResource {
  id: string;
  name: string;
  type: 'Shelter' | 'Hospital' | 'Fire Station' | 'Police' | 'Food & Water' | 'Helpline';
  address: string;
  contact: string;
  capacity?: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  available: boolean;
}
