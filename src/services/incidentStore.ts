import { Incident, Verification, AuditLog, EmergencyResource, User, UserLocation, Alert, IncidentSeverity, IncidentStatus, VerificationResponse, IncidentType } from '../types';
import { INITIAL_USER, INITIAL_RESOURCES, INITIAL_AUDIT_LOGS, getSeedIncidents } from './mockData';
import { calculateDistanceKm, getAlertZoneLevel } from '../utils/geo';

const STORAGE_KEY_INCIDENTS = 'disaster_response_incidents_v2';
const STORAGE_KEY_VERIFICATIONS = 'disaster_response_verifications_v2';
const STORAGE_KEY_AUDIT = 'disaster_response_audit_v2';
const STORAGE_KEY_USER = 'disaster_response_user_v2';
const STORAGE_KEY_VOTED = 'disaster_response_voted_ids_v2';

class IncidentStore {
  private incidents: Incident[] = [];
  private verifications: Verification[] = [];
  private auditLogs: AuditLog[] = [];
  private user: User = INITIAL_USER;
  private votedIncidentIds: Set<string> = new Set();
  private resources: EmergencyResource[] = INITIAL_RESOURCES;
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) {
        this.user = JSON.parse(savedUser);
      } else {
        this.user = INITIAL_USER;
      }

      const savedVoted = localStorage.getItem(STORAGE_KEY_VOTED);
      if (savedVoted) {
        this.votedIncidentIds = new Set(JSON.parse(savedVoted));
      }

      const savedAudit = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (savedAudit) {
        this.auditLogs = JSON.parse(savedAudit);
      } else {
        this.auditLogs = INITIAL_AUDIT_LOGS;
      }

      const savedVerifications = localStorage.getItem(STORAGE_KEY_VERIFICATIONS);
      if (savedVerifications) {
        this.verifications = JSON.parse(savedVerifications);
      }

      const savedIncidents = localStorage.getItem(STORAGE_KEY_INCIDENTS);
      if (savedIncidents) {
        this.incidents = JSON.parse(savedIncidents);
      } else {
        // Seed incidents around current user location
        this.incidents = getSeedIncidents(this.user.location.latitude, this.user.location.longitude);
      }
    } catch {
      this.user = INITIAL_USER;
      this.incidents = getSeedIncidents(INITIAL_USER.location.latitude, INITIAL_USER.location.longitude);
      this.auditLogs = INITIAL_AUDIT_LOGS;
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(this.incidents));
      localStorage.setItem(STORAGE_KEY_VERIFICATIONS, JSON.stringify(this.verifications));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
      localStorage.setItem(STORAGE_KEY_VOTED, JSON.stringify(Array.from(this.votedIncidentIds)));
    } catch (e) {
      console.error('Storage persist error:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- User & Location ---
  public getUser(): User {
    return this.user;
  }

  public getUserLocation(): UserLocation {
    return this.user.location;
  }

  public setUserLocation(location: UserLocation, reanchorDemo = false) {
    this.user = {
      ...this.user,
      location,
    };
    if (reanchorDemo) {
      // Re-anchor seed incidents around user's newly detected actual location
      this.incidents = getSeedIncidents(location.latitude, location.longitude);
    }
    this.persist();
  }

  public updateUserLocation(location: UserLocation, reanchorDemo = false) {
    this.setUserLocation(location, reanchorDemo);
  }

  public setUserRole(role: 'citizen' | 'authority') {
    this.user = {
      ...this.user,
      role,
    };
    this.persist();
  }

  // --- Incidents ---
  public getIncidents(): Incident[] {
    return [...this.incidents];
  }

  public getIncidentById(id: string): Incident | undefined {
    return this.incidents.find((inc) => inc.id === id);
  }

  public reportIncident(data: {
    type: IncidentType;
    latitude: number;
    longitude: number;
    address?: string;
    description: string;
    severity?: IncidentSeverity;
    evidencePhotos?: string[];
  }): Incident {
    const newId = `INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const evidenceItems = (data.evidencePhotos || []).map((url, index) => ({
      id: `ev_${newId}_${index}`,
      incidentId: newId,
      fileUrl: url,
      fileType: 'image' as const,
      uploadedAt: now,
      caption: 'Citizen field upload',
    }));

    const newIncident: Incident = {
      id: newId,
      type: data.type,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || `Near ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`,
      description: data.description,
      status: 'UNVERIFIED',
      severity: data.severity || 'HIGH',
      confidence: 30, // Starts initial unverified confidence
      createdAt: now,
      updatedAt: now,
      reporterId: this.user.id,
      reporterName: this.user.name,
      evidence: evidenceItems,
      alertRadiusKm: 5,
      verificationStats: {
        confirmations: 1, // Reporter confirms by default
        notPresent: 0,
        unsure: 0,
        totalVerifiers: 1,
      },
    };

    this.incidents = [newIncident, ...this.incidents];

    // Reporter cannot vote on their own incident again
    this.votedIncidentIds.add(newId);

    // Audit log
    this.addAuditLog({
      actorId: this.user.id,
      actorName: `${this.user.name} (Citizen)`,
      action: 'SUBMIT_REPORT',
      incidentId: newId,
      details: `New unverified report submitted for ${data.type} with ${evidenceItems.length} evidence attachment(s).`,
    });

    this.persist();
    return newIncident;
  }

  // --- Community Verification ---
  public hasUserVoted(incidentId: string): boolean {
    return this.votedIncidentIds.has(incidentId);
  }

  public submitVerification(
    incidentId: string,
    response: VerificationResponse,
    notes?: string
  ): { success: boolean; message: string } {
    if (this.votedIncidentIds.has(incidentId)) {
      return { success: false, message: 'You have already submitted a verification for this incident.' };
    }

    const incident = this.incidents.find((i) => i.id === incidentId);
    if (!incident) {
      return { success: false, message: 'Incident not found.' };
    }

    const dist = calculateDistanceKm(
      this.user.location.latitude,
      this.user.location.longitude,
      incident.latitude,
      incident.longitude
    );

    const now = new Date().toISOString();

    const verification: Verification = {
      id: `ver_${Date.now()}`,
      incidentId,
      userId: this.user.id,
      userName: this.user.name,
      response,
      distanceFromIncident: dist,
      createdAt: now,
      notes,
    };

    this.verifications.push(verification);
    this.votedIncidentIds.add(incidentId);

    // Update stats
    const stats = { ...incident.verificationStats };
    if (response === 'CONFIRM') stats.confirmations += 1;
    if (response === 'NOT_PRESENT') stats.notPresent += 1;
    if (response === 'UNSURE') stats.unsure += 1;
    stats.totalVerifiers += 1;

    // Calculate updated confidence (simple robust formula)
    const confWeight = stats.confirmations * 15 - stats.notPresent * 20;
    let confidence = Math.min(99, Math.max(10, 30 + confWeight));

    let status = incident.status;
    // Auto-confirm threshold: 5+ confirmations with high positive ratio
    if (stats.confirmations >= 5 && stats.confirmations > stats.notPresent * 2 && status === 'UNVERIFIED') {
      status = 'CONFIRMED';
      this.addAuditLog({
        actorId: 'sys_verification_engine',
        actorName: 'Community Verification Engine',
        action: 'AUTO_CONFIRM',
        incidentId,
        details: `Incident reached verification threshold with ${stats.confirmations} community confirmations. Upgraded to CONFIRMED.`,
      });
    }

    this.incidents = this.incidents.map((inc) => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status,
          confidence,
          verificationStats: stats,
          updatedAt: now,
        };
      }
      return inc;
    });

    this.addAuditLog({
      actorId: this.user.id,
      actorName: `${this.user.name} (Citizen)`,
      action: 'VERIFY_INCIDENT',
      incidentId,
      details: `Citizen responded '${response}' from ${dist} km away.`,
    });

    this.persist();
    return { success: true, message: 'Thank you. Your verification has been registered.' };
  }

  // --- Authority Actions ---
  public authorityUpdateIncident(
    incidentId: string,
    updates: {
      status?: IncidentStatus;
      severity?: IncidentSeverity;
      alertRadiusKm?: number;
      authorityNotes?: string;
    },
    authorityName = 'Authority Officer'
  ) {
    const now = new Date().toISOString();
    let actionName = 'UPDATE_INCIDENT';
    let details = 'Authority updated incident attributes.';

    if (updates.status === 'CONFIRMED') {
      actionName = 'OFFICIAL_CONFIRMATION';
      details = `Incident officially confirmed by ${authorityName}. Alert dispatched.`;
    } else if (updates.status === 'REJECTED') {
      actionName = 'REJECT_INCIDENT';
      details = `Incident marked as rejected/false report by ${authorityName}. Reason: ${updates.authorityNotes || 'Unsubstantiated'}`;
    } else if (updates.status === 'RESOLVED') {
      actionName = 'RESOLVE_INCIDENT';
      details = `Incident marked as resolved/cleared by ${authorityName}.`;
    } else if (updates.severity) {
      actionName = 'SEVERITY_CHANGE';
      details = `Severity adjusted to ${updates.severity} by ${authorityName}.`;
    }

    this.incidents = this.incidents.map((inc) => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          ...(updates.status ? { status: updates.status } : {}),
          ...(updates.severity ? { severity: updates.severity } : {}),
          ...(updates.alertRadiusKm ? { alertRadiusKm: updates.alertRadiusKm } : {}),
          updatedAt: now,
        };
      }
      return inc;
    });

    this.addAuditLog({
      actorId: this.user.id,
      actorName: authorityName,
      action: actionName,
      incidentId,
      details: updates.authorityNotes ? `${details} Notes: ${updates.authorityNotes}` : details,
    });

    this.persist();
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      ...log,
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs = [newLog, ...this.auditLogs];
  }

  // --- Emergency Resources ---
  public getResources(): EmergencyResource[] {
    return this.resources.map((res) => ({
      ...res,
      distanceKm: calculateDistanceKm(
        this.user.location.latitude,
        this.user.location.longitude,
        res.latitude,
        res.longitude
      ),
    }));
  }

  // --- Current User Alerts ---
  public getAlerts(): Alert[] {
    return this.getActiveAlertsForUser();
  }

  public getActiveAlertsForUser(): Alert[] {
    const userLat = this.user.location.latitude;
    const userLon = this.user.location.longitude;

    return this.incidents
      .filter((inc) => inc.status === 'CONFIRMED')
      .map((inc) => {
        const dist = calculateDistanceKm(userLat, userLon, inc.latitude, inc.longitude);
        const zone = getAlertZoneLevel(dist);

        return {
          id: `alt_${inc.id}`,
          incidentId: inc.id,
          incidentType: inc.type,
          headline: `CONFIRMED ${inc.type.toUpperCase()} ALERT`,
          message: `${inc.type} has been confirmed approximately ${dist} km from your location. ${zone.description}`,
          alertLevel: zone.level,
          radiusKm: inc.alertRadiusKm,
          latitude: inc.latitude,
          longitude: inc.longitude,
          createdAt: inc.updatedAt,
          expiresAt: new Date(new Date(inc.updatedAt).getTime() + 6 * 3600 * 1000).toISOString(),
        };
      })
      .filter((alert) => alert.alertLevel !== 'NORMAL');
  }

  // Reset to default seed
  public resetToDemoData() {
    this.resetData();
  }

  public resetData() {
    localStorage.removeItem(STORAGE_KEY_INCIDENTS);
    localStorage.removeItem(STORAGE_KEY_VERIFICATIONS);
    localStorage.removeItem(STORAGE_KEY_AUDIT);
    localStorage.removeItem(STORAGE_KEY_VOTED);
    this.votedIncidentIds.clear();
    this.loadFromStorage();
    this.notify();
  }
}

export const incidentStore = new IncidentStore();
