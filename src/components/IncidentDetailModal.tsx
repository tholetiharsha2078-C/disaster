import React, { useState } from 'react';
import { Incident, UserRole, IncidentStatus, IncidentSeverity } from '../types';
import { incidentStore } from '../services/incidentStore';
import { X, CheckCircle2, XCircle, AlertTriangle, Clock, MapPin, Shield, FileText } from 'lucide-react';

interface IncidentDetailModalProps {
  incident: Incident;
  userRole: UserRole;
  onClose: () => void;
  onUpdated?: () => void;
  onOpenVerification?: (incident: Incident) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  userRole,
  onClose,
  onUpdated,
  onOpenVerification,
}) => {
  const [authorityNotes, setAuthorityNotes] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity>(incident.severity);
  const [selectedRadius, setSelectedRadius] = useState<number>(incident.alertRadiusKm);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleAuthorityAction = (newStatus?: IncidentStatus) => {
    incidentStore.authorityUpdateIncident(
      incident.id,
      {
        status: newStatus,
        severity: selectedSeverity,
        alertRadiusKm: selectedRadius,
        authorityNotes: authorityNotes.trim(),
      },
      'Duty Incident Commander'
    );

    setActionSuccess(`Incident updated successfully.`);
    if (onUpdated) onUpdated();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Get relevant audit logs for this incident
  const incidentAuditLogs = incidentStore
    .getAuditLogs()
    .filter((log) => log.incidentId === incident.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
      <div className="bg-white border border-neutral-300 rounded-xs max-w-2xl w-full p-6 shadow-xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider ${
                incident.status === 'CONFIRMED'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {incident.status}
            </span>
            <span className="text-xs font-mono text-neutral-500">ID: {incident.id}</span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs text-neutral-500">
              Reported: {new Date(incident.createdAt).toLocaleString()}
            </span>
          </div>

          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            {incident.type}
          </h2>
          <p className="text-xs font-semibold text-neutral-600 mt-1">
            {incident.address}
          </p>
          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
            Coordinates: {incident.latitude.toFixed(6)}° N, {incident.longitude.toFixed(6)}° E
          </div>
        </div>

        {/* Evidence Photos */}
        {incident.evidence && incident.evidence.length > 0 && (
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Field Evidence &amp; Visual Confirmation
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incident.evidence.map((ev) => (
                <div key={ev.id} className="rounded-xs overflow-hidden border border-neutral-300">
                  <img
                    src={ev.fileUrl}
                    alt={incident.type}
                    className="w-full h-44 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {ev.caption && (
                    <div className="p-2 text-[11px] text-neutral-700 bg-neutral-50 border-t border-neutral-200">
                      {ev.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Detailed Incident Description
          </div>
          <p className="text-sm text-neutral-800 leading-relaxed bg-neutral-50 p-3 rounded-xs border border-neutral-200">
            {incident.description}
          </p>
          <div className="mt-2 text-xs text-neutral-500">
            Reported by: <strong>{incident.reporterName || 'Registered Citizen'}</strong>
          </div>
        </div>

        {/* Verification Breakdown */}
        <div className="border border-neutral-200 rounded-xs p-4 bg-white space-y-3">
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Verification Metrics &amp; Consensus
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs">
              <div className="text-lg font-black text-emerald-800">
                {incident.verificationStats.confirmations}
              </div>
              <div className="text-[11px] font-bold text-emerald-700 uppercase">Confirmations</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xs">
              <div className="text-lg font-black text-rose-800">
                {incident.verificationStats.notPresent}
              </div>
              <div className="text-[11px] font-bold text-rose-700 uppercase">Not Present</div>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xs">
              <div className="text-lg font-black text-neutral-800">
                {incident.verificationStats.unsure}
              </div>
              <div className="text-[11px] font-bold text-neutral-600 uppercase">Unsure</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-neutral-600 pt-2 border-t border-neutral-100">
            <span>Algorithm Confidence Score: <strong>{incident.confidence}%</strong></span>
            <span>Alert Radius: <strong>{incident.alertRadiusKm} km</strong></span>
          </div>
        </div>

        {/* Audit Trail for this Incident */}
        <div>
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Audit Trail &amp; Activity Log
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto border border-neutral-200 rounded-xs p-2.5 bg-neutral-50 text-xs">
            {incidentAuditLogs.length === 0 ? (
              <div className="text-neutral-500 py-2 text-center">Initial report logged. No actions yet.</div>
            ) : (
              incidentAuditLogs.map((log) => (
                <div key={log.id} className="pb-2 border-b border-neutral-200 last:border-b-0">
                  <div className="flex items-center justify-between font-semibold text-neutral-800">
                    <span>{log.action}</span>
                    <span className="text-neutral-500 font-normal">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-neutral-600 text-[11px] mt-0.5">{log.details}</div>
                  <div className="text-[10px] text-neutral-400">Actor: {log.actorName}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Authority Action Control Box (When viewed in Authority Portal) */}
        {userRole === 'authority' ? (
          <div className="border-t-2 border-neutral-900 pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-neutral-900" />
              <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Authority Operational Command Controls
              </div>
            </div>

            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xs">
                {actionSuccess}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Adjust Severity:
                </label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value as IncidentSeverity)}
                  className="w-full text-xs p-2 border border-neutral-300 rounded-xs bg-white text-neutral-900 font-semibold"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Broadcast Alert Radius (km):
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={selectedRadius}
                  onChange={(e) => setSelectedRadius(parseInt(e.target.value) || 5)}
                  className="w-full text-xs p-2 border border-neutral-300 rounded-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Authority Action Log Notes:
              </label>
              <input
                type="text"
                placeholder="Reason or instructions for dispatch crew..."
                value={authorityNotes}
                onChange={(e) => setAuthorityNotes(e.target.value)}
                className="w-full text-xs p-2.5 border border-neutral-300 rounded-xs"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {incident.status !== 'CONFIRMED' && (
                <button
                  type="button"
                  id="auth-confirm-incident-btn"
                  onClick={() => handleAuthorityAction('CONFIRMED')}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wide rounded-xs transition-colors"
                >
                  Officially Confirm &amp; Broadcast Alert
                </button>
              )}

              {incident.status !== 'RESOLVED' && (
                <button
                  type="button"
                  id="auth-resolve-incident-btn"
                  onClick={() => handleAuthorityAction('RESOLVED')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wide rounded-xs transition-colors"
                >
                  Mark Resolved / Cleared
                </button>
              )}

              {incident.status !== 'REJECTED' && (
                <button
                  type="button"
                  id="auth-reject-incident-btn"
                  onClick={() => handleAuthorityAction('REJECTED')}
                  className="px-4 py-2 bg-neutral-800 hover:bg-black text-white text-xs font-bold uppercase tracking-wide rounded-xs transition-colors"
                >
                  Mark False Report / Reject
                </button>
              )}

              <button
                type="button"
                id="auth-save-notes-btn"
                onClick={() => handleAuthorityAction()}
                className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-wide rounded-xs border border-neutral-300 transition-colors"
              >
                Save Severity / Notes
              </button>
            </div>
          </div>
        ) : (
          /* Citizen View Action */
          <div className="border-t border-neutral-200 pt-3 flex items-center justify-between">
            {incident.status === 'UNVERIFIED' && onOpenVerification && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVerification(incident);
                }}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wide rounded-xs transition-colors"
              >
                Verify This Incident
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase rounded-xs transition-colors ml-auto"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
