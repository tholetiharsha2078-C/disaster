import React, { useState } from 'react';
import { Incident, UserLocation, AuditLog, EmergencyResource, IncidentStatus, IncidentSeverity } from '../types';
import { incidentStore } from '../services/incidentStore';
import { SatelliteMap } from '../components/SatelliteMap';
import { calculateDistanceKm } from '../utils/geo';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  FileText,
  Search,
  Filter,
  Eye,
  Hospital,
  Building,
  Flame,
  Radio,
  UserCheck,
} from 'lucide-react';

interface AuthorityDashboardProps {
  userLocation: UserLocation;
  incidents: Incident[];
  activeSubTab?: string;
  onOpenIncidentDetail: (incident: Incident) => void;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  userLocation,
  incidents,
  activeSubTab = 'dashboard',
  onOpenIncidentDetail,
}) => {
  const [subTab, setSubTab] = useState<string>(activeSubTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const auditLogs = incidentStore.getAuditLogs();
  const resources = incidentStore.getResources();

  // Triage counts
  const unverifiedCount = incidents.filter((i) => i.status === 'UNVERIFIED').length;
  const confirmedCount = incidents.filter((i) => i.status === 'CONFIRMED').length;
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;

  // Filtered incidents for search/filter
  const filteredIncidents = incidents.filter((inc) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchType = inc.type.toLowerCase().includes(q);
      const matchDesc = inc.description.toLowerCase().includes(q);
      const matchAddr = (inc.address || '').toLowerCase().includes(q);
      const matchId = inc.id.toLowerCase().includes(q);
      if (!matchType && !matchDesc && !matchAddr && !matchId) return false;
    }
    return true;
  });

  const unverifiedList = filteredIncidents.filter((i) => i.status === 'UNVERIFIED');
  const confirmedList = filteredIncidents.filter((i) => i.status === 'CONFIRMED');
  const historyList = filteredIncidents.filter((i) => i.status === 'RESOLVED' || i.status === 'REJECTED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Authority Command Header */}
      <div className="bg-neutral-900 text-white p-6 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-widest">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Emergency Operations Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Civil Protection Command Dashboard
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Authority Jurisdiction: Sector Metro &amp; Regional Emergency Response Zone 1
          </p>
        </div>

        {/* Triage summary badges (clean, non-neon, readable) */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-neutral-800 border border-neutral-700 px-3.5 py-2 rounded-xs">
            <div className="text-neutral-400 font-medium">Unverified Reports</div>
            <div className="text-lg font-black text-amber-400">{unverifiedCount}</div>
          </div>
          <div className="bg-neutral-800 border border-neutral-700 px-3.5 py-2 rounded-xs">
            <div className="text-neutral-400 font-medium">Active Confirmed</div>
            <div className="text-lg font-black text-red-400">{confirmedCount}</div>
          </div>
          <div className="bg-neutral-800 border border-neutral-700 px-3.5 py-2 rounded-xs">
            <div className="text-neutral-400 font-medium">Critical / High</div>
            <div className="text-lg font-black text-white">{criticalCount}</div>
          </div>
        </div>
      </div>

      {/* Internal Sub-navigation for Authority */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-300 pb-2 text-xs font-bold">
        {[
          { id: 'dashboard', label: 'Overview & Live Map' },
          { id: 'incidents', label: `Live Incidents (${incidents.length})` },
          { id: 'verification', label: `Verification Queue (${unverifiedCount})` },
          { id: 'evidence', label: 'Evidence Review' },
          { id: 'zones', label: 'Alert Zones' },
          { id: 'history', label: 'Incident History' },
          { id: 'resources', label: 'Emergency Resources' },
          { id: 'audit', label: `Audit Log (${auditLogs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={`px-3.5 py-2 rounded-xs transition-colors whitespace-nowrap ${
              subTab === tab.id
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-700 hover:bg-neutral-200 bg-neutral-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW 1: Overview & Live Map */}
      {subTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Main Satellite Map View */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-neutral-900">
                  Command Live Satellite Map
                </h2>
                <p className="text-xs text-neutral-600">
                  Real-time aerial satellite monitoring with active alert boundaries (0–5 km, 5–10 km, 10–15 km).
                </p>
              </div>
              <span className="text-xs text-neutral-500 font-medium">
                Live updates active
              </span>
            </div>

            <SatelliteMap
              incidents={incidents}
              userLocation={userLocation}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => onOpenIncidentDetail(inc)}
              heightClass="h-[520px]"
              showZones={true}
            />
          </div>

          {/* Quick Action Queue: Unverified Priority Reports */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-neutral-900">
                Incoming Reports Awaiting Command Confirmation ({unverifiedCount})
              </h2>
              <button
                type="button"
                onClick={() => setSubTab('verification')}
                className="text-xs font-bold text-red-700 hover:text-red-800"
              >
                Open Verification Queue &rarr;
              </button>
            </div>

            {unverifiedList.length === 0 ? (
              <div className="p-6 bg-white border border-neutral-300 rounded-xs text-center text-xs text-neutral-500">
                All incoming citizen reports have been reviewed.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unverifiedList.map((inc) => (
                  <div
                    key={inc.id}
                    className="bg-white border border-neutral-300 rounded-xs p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-xs border border-amber-300">
                        {inc.status}
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">{inc.id}</span>
                    </div>

                    <h3 className="text-base font-bold text-neutral-900">
                      {inc.type} — {inc.address}
                    </h3>
                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      {inc.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-neutral-600 pt-2 border-t border-neutral-100">
                      <span>
                        Verifications: <strong>{inc.verificationStats.confirmations} confirmed</strong>, {inc.verificationStats.notPresent} negative
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenIncidentDetail(inc)}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase rounded-xs transition-colors"
                      >
                        Review &amp; Action
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Live Incidents */}
      {subTab === 'incidents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-neutral-900">
                Active Incident Registry
              </h2>
              <p className="text-xs text-neutral-600">
                Complete list of open field incidents across all severity classifications.
              </p>
            </div>

            {/* Search */}
            <div className="w-full sm:w-72 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, type, or address..."
                className="w-full text-xs p-2.5 pl-8 border border-neutral-300 rounded-xs bg-white text-neutral-900"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div className="bg-white border border-neutral-300 rounded-xs overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 border-b border-neutral-300 text-neutral-800 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Incident ID</th>
                    <th className="p-3">Hazard Type</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Verifications</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredIncidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-neutral-50/80">
                      <td className="p-3 font-mono font-bold text-neutral-900">{inc.id}</td>
                      <td className="p-3 font-bold text-neutral-900">{inc.type}</td>
                      <td className="p-3 text-neutral-600 max-w-xs truncate">{inc.address}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-xs font-bold ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-red-700 text-white'
                              : inc.severity === 'HIGH'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-xs font-bold uppercase ${
                            inc.status === 'CONFIRMED'
                              ? 'text-red-700 font-black'
                              : inc.status === 'UNVERIFIED'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{inc.confidence}%</td>
                      <td className="p-3">
                        <span className="text-emerald-700 font-bold">
                          +{inc.verificationStats.confirmations}
                        </span>{' '}
                        /{' '}
                        <span className="text-rose-700">
                          -{inc.verificationStats.notPresent}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenIncidentDetail(inc)}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white font-bold rounded-xs uppercase tracking-wider text-[11px]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Verification Queue */}
      {subTab === 'verification' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-neutral-900">
              Community Verification Queue
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Field reports submitted by citizens awaiting authority corroboration or automatic consensus threshold.
            </p>
          </div>

          <div className="space-y-4">
            {unverifiedList.map((inc) => (
              <div
                key={inc.id}
                className="bg-white border border-neutral-300 rounded-xs p-6 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Pending Authority Adjudication • {inc.type}
                    </span>
                    <h3 className="text-lg font-black text-neutral-900 mt-0.5">
                      {inc.address}
                    </h3>
                  </div>
                  <div className="text-xs text-neutral-500 font-mono">
                    Reported: {new Date(inc.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-2">
                    <div className="text-neutral-700 leading-relaxed bg-neutral-50 p-3 rounded-xs border border-neutral-200">
                      {inc.description}
                    </div>
                    {inc.evidence && inc.evidence.length > 0 && (
                      <div className="flex items-center gap-3 pt-2">
                        <img
                          src={inc.evidence[0].fileUrl}
                          alt="Evidence"
                          className="w-24 h-16 object-cover rounded-xs border border-neutral-300"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-neutral-500">Field photo attached by citizen reporter</span>
                      </div>
                    )}
                  </div>

                  {/* Verifications Tally */}
                  <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-xs space-y-3">
                    <div className="font-bold text-neutral-800">Consensus Telemetry</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Positive Confirmations:</span>
                        <strong className="text-emerald-700">{inc.verificationStats.confirmations}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Negative / Not Present:</span>
                        <strong className="text-rose-700">{inc.verificationStats.notPresent}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Unsure responses:</span>
                        <strong>{inc.verificationStats.unsure}</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-neutral-200 font-bold">
                        <span>Algorithm Confidence:</span>
                        <span>{inc.confidence}%</span>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenIncidentDetail(inc)}
                        className="w-full py-2 bg-red-700 hover:bg-red-800 text-white font-bold uppercase tracking-wider rounded-xs text-[11px]"
                      >
                        Confirm Incident
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: Evidence Review */}
      {subTab === 'evidence' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-neutral-900">
              Field Evidence &amp; Media Repository
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Photographic and visual evidence uploaded by on-scene citizens and field responders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {incidents.flatMap((inc) =>
              (inc.evidence || []).map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white border border-neutral-300 rounded-xs overflow-hidden shadow-2xs space-y-3"
                >
                  <img
                    src={ev.fileUrl}
                    alt={inc.type}
                    className="w-full h-48 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-neutral-900">{inc.type}</span>
                      <span className="font-mono text-neutral-500">{inc.id}</span>
                    </div>
                    <div className="text-xs text-neutral-600 line-clamp-2">
                      {ev.caption || inc.description}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Uploaded {new Date(ev.uploadedAt).toLocaleString()}
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenIncidentDetail(inc)}
                      className="w-full mt-2 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs uppercase rounded-xs border border-neutral-300 transition-colors"
                    >
                      View Incident Record
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 5: Alert Zones */}
      {subTab === 'zones' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-neutral-900">
              Active Alert Perimeters &amp; Danger Zones
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Multi-tiered radial broadcast zones managed by civil protection alert engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-red-50 border border-red-300 rounded-xs space-y-2">
              <div className="text-xs font-black text-red-700 uppercase tracking-wider">
                Tier 1 (0–5 km)
              </div>
              <div className="text-xl font-black text-neutral-900">HIGH ALERT ZONE</div>
              <p className="text-xs text-neutral-700 leading-relaxed">
                Mandatory evacuation or immediate structural shelter. Automated siren and SMS broadcast triggered to registered citizens in cell towers.
              </p>
            </div>

            <div className="p-6 bg-amber-50 border border-amber-300 rounded-xs space-y-2">
              <div className="text-xs font-black text-amber-700 uppercase tracking-wider">
                Tier 2 (5–10 km)
              </div>
              <div className="text-xl font-black text-neutral-900">ALERT ZONE</div>
              <p className="text-xs text-neutral-700 leading-relaxed">
                Heightened preparedness. Citizens advised to secure loose property, store drinking water, and avoid primary arterial roads.
              </p>
            </div>

            <div className="p-6 bg-neutral-100 border border-neutral-300 rounded-xs space-y-2">
              <div className="text-xs font-black text-neutral-700 uppercase tracking-wider">
                Tier 3 (10–15 km)
              </div>
              <div className="text-xl font-black text-neutral-900">STAY CAUTIOUS ZONE</div>
              <p className="text-xs text-neutral-700 leading-relaxed">
                Informational perimeter. Routine monitoring recommended; traffic diversions in effect across regional border corridors.
              </p>
            </div>
          </div>

          <div className="bg-white border border-neutral-300 rounded-xs p-5">
            <h3 className="text-sm font-bold text-neutral-900 mb-3 uppercase tracking-wide">
              Satellite Perimeter Mapping
            </h3>
            <SatelliteMap
              incidents={incidents}
              userLocation={userLocation}
              heightClass="h-[450px]"
              showZones={true}
            />
          </div>
        </div>
      )}

      {/* VIEW 6: Incident History */}
      {subTab === 'history' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-neutral-900">
              Resolved &amp; Historical Incident Archive
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Closed incidents, resolved emergencies, and rejected false reports preserved for civil defence auditing.
            </p>
          </div>

          <div className="bg-white border border-neutral-300 rounded-xs overflow-hidden">
            {historyList.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No archived historical incidents in current session.
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {historyList.map((inc) => (
                  <div key={inc.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 text-sm">{inc.type}</span>
                        <span className="text-xs font-mono text-neutral-500">{inc.id}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-xs">
                          {inc.status}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-600 mt-1">{inc.address}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenIncidentDetail(inc)}
                      className="px-3 py-1.5 bg-white border border-neutral-300 rounded-xs text-xs font-bold"
                    >
                      View Record
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 7: Emergency Resources */}
      {subTab === 'resources' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-neutral-900">
              Emergency Services &amp; Relief Infrastructure
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Active dispatch stations, trauma hospitals, and relief shelters in this jurisdiction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((res) => (
              <div
                key={res.id}
                className="bg-white border border-neutral-300 rounded-xs p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-neutral-100 rounded-xs text-neutral-800">
                      {res.type === 'Hospital' ? (
                        <Hospital className="w-4 h-4" />
                      ) : res.type === 'Fire Station' ? (
                        <Flame className="w-4 h-4" />
                      ) : (
                        <Building className="w-4 h-4" />
                      )}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">{res.name}</h3>
                      <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
                        {res.type}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs">
                    Operational
                  </span>
                </div>

                <div className="text-xs text-neutral-600 space-y-1">
                  <div>Address: <strong>{res.address}</strong></div>
                  <div>Contact: <strong>{res.contact}</strong></div>
                  {res.capacity && <div>Capacity: <strong>{res.capacity}</strong></div>}
                  {res.distanceKm !== undefined && (
                    <div className="text-neutral-500 pt-1">
                      Distance from command center: ~{res.distanceKm} km
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 8: Audit Log */}
      {subTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-neutral-900">
                Command Operations Audit Trail
              </h2>
              <p className="text-xs text-neutral-600 mt-1">
                Immutable event record of all officer actions, alerts broadcasted, and community verifications.
              </p>
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              Total Recorded Events: {auditLogs.length}
            </div>
          </div>

          <div className="bg-white border border-neutral-300 rounded-xs overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 border-b border-neutral-300 text-neutral-800 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Actor / Operator</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Incident ID</th>
                    <th className="p-3">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50">
                      <td className="p-3 text-neutral-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-neutral-900 font-sans">
                        {log.actorName}
                      </td>
                      <td className="p-3 font-bold text-red-700">
                        {log.action}
                      </td>
                      <td className="p-3 font-bold text-neutral-800">
                        {log.incidentId}
                      </td>
                      <td className="p-3 font-sans text-neutral-700 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
