import React, { useState } from 'react';
import { Incident, UserLocation } from '../types';
import { SatelliteMap } from '../components/SatelliteMap';
import { calculateDistanceKm } from '../utils/geo';
import { Filter, Layers, AlertTriangle, ShieldCheck, MapPin, CheckCircle, Info, ExternalLink, X } from 'lucide-react';

interface LiveMapPageProps {
  incidents: Incident[];
  userLocation: UserLocation;
  onOpenVerification: (incident: Incident) => void;
  onOpenIncidentDetail: (incident: Incident) => void;
}

export const LiveMapPage: React.FC<LiveMapPageProps> = ({
  incidents,
  userLocation,
  onOpenVerification,
  onOpenIncidentDetail,
}) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Filter incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (filterType !== 'ALL' && inc.type !== filterType) return false;
    if (filterStatus === 'CONFIRMED' && inc.status !== 'CONFIRMED') return false;
    if (filterStatus === 'UNVERIFIED' && inc.status !== 'UNVERIFIED') return false;
    return true;
  });

  const selectedDistance = selectedIncident
    ? calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        selectedIncident.latitude,
        selectedIncident.longitude
      )
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Live Satellite Emergency Map
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            High-resolution satellite imagery monitoring active incidents and regional alert perimeters.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-xs p-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-xs font-semibold ${
                filterStatus === 'ALL' ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              All Incidents
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('CONFIRMED')}
              className={`px-2.5 py-1 rounded-xs font-semibold ${
                filterStatus === 'CONFIRMED' ? 'bg-red-700 text-white' : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Confirmed
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('UNVERIFIED')}
              className={`px-2.5 py-1 rounded-xs font-semibold ${
                filterStatus === 'UNVERIFIED' ? 'bg-amber-600 text-white' : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Unverified
            </button>
          </div>

          {/* Type dropdown */}
          <select
            aria-label="Filter by Hazard Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs font-medium border border-neutral-300 bg-white rounded-xs px-2.5 py-1.5 text-neutral-800 focus:outline-hidden"
          >
            <option value="ALL">All Hazard Types</option>
            <option value="Flood">Flood</option>
            <option value="Fire">Fire</option>
            <option value="Road blockage">Road blockage</option>
            <option value="Electrical hazard">Electrical hazard</option>
            <option value="Earthquake">Earthquake</option>
            <option value="Storm">Storm</option>
            <option value="Landslide">Landslide</option>
          </select>
        </div>
      </div>

      {/* Main Map + Side Detail Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Satellite Map (Main 8 columns or full width) */}
        <div className={selectedIncident ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <SatelliteMap
            incidents={filteredIncidents}
            userLocation={userLocation}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            heightClass="h-[520px] sm:h-[620px]"
            showZones={true}
          />
          <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between">
            <span>Click any marker on the satellite view to inspect incident information.</span>
            <span>Default satellite layer provided via Esri World Imagery</span>
          </div>
        </div>

        {/* Selected Incident Information Panel (4 columns) */}
        {selectedIncident && (
          <div className="lg:col-span-4 bg-white border border-neutral-300 rounded-xs p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider ${
                    selectedIncident.status === 'CONFIRMED'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {selectedIncident.status}
                </span>
                <span className="ml-2 text-xs font-semibold text-neutral-500">
                  Severity: {selectedIncident.severity}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-neutral-900 leading-tight">
                {selectedIncident.type}
              </h3>
              <p className="text-xs text-neutral-600 mt-1 font-medium">
                {selectedIncident.address}
              </p>
              <div className="text-xs font-semibold text-neutral-900 mt-2 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-xs">
                Approx. <strong>{selectedDistance} km</strong> from your current position
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Field Description
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed">
                {selectedIncident.description}
              </p>
            </div>

            {/* Evidence Image */}
            {selectedIncident.evidence && selectedIncident.evidence.length > 0 && (
              <div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Attached Field Evidence
                </div>
                <div className="rounded-xs overflow-hidden border border-neutral-200">
                  <img
                    src={selectedIncident.evidence[0].fileUrl}
                    alt={selectedIncident.type}
                    className="w-full h-40 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {selectedIncident.evidence[0].caption && (
                    <div className="p-2 text-[11px] text-neutral-600 bg-neutral-50 border-t border-neutral-200">
                      {selectedIncident.evidence[0].caption}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification Stats */}
            <div className="border-t border-neutral-200 pt-3">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                Community Verification Status
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xs">
                  <div className="font-bold text-emerald-800">
                    {selectedIncident.verificationStats.confirmations}
                  </div>
                  <div className="text-[10px] text-emerald-700 uppercase">Confirmed</div>
                </div>
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-xs">
                  <div className="font-bold text-rose-800">
                    {selectedIncident.verificationStats.notPresent}
                  </div>
                  <div className="text-[10px] text-rose-700 uppercase">Not Present</div>
                </div>
                <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-xs">
                  <div className="font-bold text-neutral-800">
                    {selectedIncident.verificationStats.unsure}
                  </div>
                  <div className="text-[10px] text-neutral-600 uppercase">Unsure</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 space-y-2">
              {selectedIncident.status === 'UNVERIFIED' && (
                <button
                  type="button"
                  id="panel-verify-btn"
                  onClick={() => onOpenVerification(selectedIncident)}
                  className="w-full py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wide rounded-xs transition-colors text-center"
                >
                  Verify This Incident
                </button>
              )}
              <button
                type="button"
                id="panel-details-btn"
                onClick={() => onOpenIncidentDetail(selectedIncident)}
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs uppercase tracking-wide rounded-xs border border-neutral-300 transition-colors text-center"
              >
                View Complete Record
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
