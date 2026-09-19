import React from 'react';
import { Incident, UserLocation, Alert } from '../types';
import { calculateDistanceKm, getAlertZoneLevel } from '../utils/geo';
import { AlertTriangle, ShieldAlert, Phone, MapPin, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';

interface MyAlertsPageProps {
  userLocation: UserLocation;
  incidents: Incident[];
  onNavigateToMap: (incidentId?: string) => void;
  onOpenIncidentDetail: (incident: Incident) => void;
}

export const MyAlertsPage: React.FC<MyAlertsPageProps> = ({
  userLocation,
  incidents,
  onNavigateToMap,
  onOpenIncidentDetail,
}) => {
  // Get confirmed incidents within 15 km perimeter
  const alerts = incidents
    .filter((inc) => inc.status === 'CONFIRMED')
    .map((inc) => {
      const distanceKm = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        inc.latitude,
        inc.longitude
      );
      const zone = getAlertZoneLevel(distanceKm);
      return {
        ...inc,
        distanceKm,
        zone,
      };
    })
    .filter((a) => a.distanceKm <= 15)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-neutral-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Emergency Alerts for Your Perimeter
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Confirmed hazards within 15 km of your device coordinates ({userLocation.address || 'Civil Sector'}).
        </p>
      </div>

      {/* Emergency Helpline Banner */}
      <div className="bg-neutral-900 text-white p-4 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-red-400 uppercase tracking-wider">
            Urgent Threat to Life
          </div>
          <div className="text-sm font-bold text-neutral-100">
            Dial 112 for Police/Medical or 1077 for Disaster Control Room
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="tel:112"
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase rounded-xs transition-colors"
          >
            Call 112
          </a>
          <a
            href="tel:1077"
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase rounded-xs border border-neutral-700 transition-colors"
          >
            Call 1077
          </a>
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="bg-white border border-neutral-300 rounded-xs p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-neutral-100 text-neutral-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">
            No High-Priority Confirmed Alerts in Your Perimeter
          </h2>
          <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
            There are currently no confirmed emergency alerts within 15 km of your current location. Continue to stay observant and report hazards when safe.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {alerts.map((alert) => {
            const isHighAlert = alert.zone.level === 'HIGH';

            return (
              <div
                key={alert.id}
                className={`border rounded-xs p-6 shadow-2xs space-y-4 ${
                  isHighAlert
                    ? 'bg-red-50/60 border-red-300'
                    : alert.zone.level === 'ALERT'
                    ? 'bg-amber-50/40 border-amber-300'
                    : 'bg-white border-neutral-300'
                }`}
              >
                {/* Alert Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-xs uppercase tracking-wider ${
                        isHighAlert
                          ? 'bg-red-700 text-white'
                          : alert.zone.level === 'ALERT'
                          ? 'bg-amber-600 text-white'
                          : 'bg-neutral-800 text-white'
                      }`}
                    >
                      {alert.zone.label}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">
                      Severity: <strong>{alert.severity}</strong>
                    </span>
                  </div>

                  <span className="text-xs text-neutral-500 font-mono">
                    ID: {alert.id} • Issued {new Date(alert.updatedAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Primary Alert Headline per prompt example */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                    CONFIRMED {alert.type.toUpperCase()} ALERT
                  </h2>
                  <p className="text-sm font-semibold text-neutral-800 mt-1">
                    "{alert.type} has been confirmed approximately <strong>{alert.distanceKm} km</strong> from your location."
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Location: {alert.address}
                  </p>
                </div>

                {/* Description */}
                <div className="text-xs text-neutral-700 leading-relaxed bg-white/70 p-3 rounded-xs border border-neutral-200">
                  {alert.description}
                </div>

                {/* Immediate Safety Directives */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                    Mandatory Safety Guidance:
                  </div>
                  <ul className="text-xs text-neutral-700 space-y-1 list-disc list-inside">
                    {alert.type === 'Flood' && (
                      <>
                        <li>Avoid causeways, river culverts, and underpasses completely.</li>
                        <li>Do not touch submerged electrical poles or junction boxes.</li>
                        <li>Prepare emergency grab bags with dry food, water, and identity proofs.</li>
                      </>
                    )}
                    {alert.type === 'Fire' && (
                      <>
                        <li>Close windows and doors facing the windward smoke plume.</li>
                        <li>Keep access routes clear for civil defence fire engines.</li>
                        <li>Follow designated evacuation routes toward open muster grounds.</li>
                      </>
                    )}
                    {alert.type === 'Road blockage' && (
                      <>
                        <li>Do not attempt to navigate through debris or unstable shoulders.</li>
                        <li>Use designated bypass diversion corridors.</li>
                      </>
                    )}
                    {alert.type === 'Electrical hazard' && (
                      <>
                        <li>Maintain at least 30 feet of clearance from downed cables.</li>
                        <li>Treat all wet metal railings and standing puddles as potentially electrified.</li>
                      </>
                    )}
                    {alert.type !== 'Flood' && alert.type !== 'Fire' && alert.type !== 'Road blockage' && alert.type !== 'Electrical hazard' && (
                      <>
                        <li>Monitor civil protection radio/mobile alerts for perimeter changes.</li>
                        <li>Ensure phone batteries and emergency flashlights are charged.</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Card Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToMap(alert.id)}
                    className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wide rounded-xs transition-colors"
                  >
                    View on Satellite Map
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenIncidentDetail(alert)}
                    className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-wide rounded-xs border border-neutral-300 transition-colors"
                  >
                    View Full Evidence &amp; Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
