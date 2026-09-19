import React, { useState } from 'react';
import { Incident, UserLocation, Alert } from '../types';
import { calculateDistanceKm, getAlertZoneLevel } from '../utils/geo';
import { requestCurrentLocation, GeolocationStatus } from '../services/locationService';
import { MapPin, AlertCircle, ShieldAlert, ArrowRight, CheckCircle, Navigation, Radio, Info } from 'lucide-react';

interface CitizenHomePageProps {
  userLocation: UserLocation;
  onUpdateLocation: (loc: UserLocation, reanchor?: boolean) => void;
  incidents: Incident[];
  activeAlerts: Alert[];
  onNavigate: (tab: string) => void;
  onOpenIncidentDetail: (incident: Incident) => void;
  onOpenVerification: (incident: Incident) => void;
}

export const CitizenHomePage: React.FC<CitizenHomePageProps> = ({
  userLocation,
  onUpdateLocation,
  incidents,
  activeAlerts,
  onNavigate,
  onOpenIncidentDetail,
  onOpenVerification,
}) => {
  const [geoStatus, setGeoStatus] = useState<GeolocationStatus | null>(null);

  // Compute highest alert level for user
  const nearbyIncidentsWithDistance = incidents
    .map((inc) => {
      const distanceKm = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        inc.latitude,
        inc.longitude
      );
      return { ...inc, distanceKm };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // Find closest active incident
  const closestIncident = nearbyIncidentsWithDistance[0];
  const userZone = closestIncident
    ? getAlertZoneLevel(closestIncident.distanceKm)
    : {
        level: 'NORMAL',
        label: 'NORMAL STATUS (>15 km)',
        badgeClass: 'bg-neutral-100 text-neutral-700',
        description: 'No active major incidents within your immediate perimeter.',
      };

  // Filter only 3 most relevant nearby incidents (no cluttered list)
  const nearbySlice = nearbyIncidentsWithDistance.slice(0, 3);

  // Filter unverified incidents within 10 km that citizen can verify
  const unverifiedNearby = nearbyIncidentsWithDistance.find(
    (inc) => inc.status === 'UNVERIFIED' && inc.distanceKm <= 10
  );

  const handleDetectLocation = () => {
    requestCurrentLocation(
      (loc) => {
        onUpdateLocation(loc, true);
        setGeoStatus({
          status: 'granted',
          message: `Accurate device location obtained (${loc.accuracyMeters ? '~' + loc.accuracyMeters + 'm precision' : 'GPS coordinates'}).`,
        });
      },
      (err) => {
        setGeoStatus(err);
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Top Section */}
      <section className="border-b border-neutral-200 pb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
          Stay Alert. Stay Safe.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
          Real-time disaster reporting, verified field alerts, and safety assistance for your immediate area.
        </p>
      </section>

      {/* Current Location & Current Alert Level */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location Block */}
        <div className="bg-white border border-neutral-300 rounded-xs p-6 shadow-2xs">
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Your Current Location
          </div>
          <div className="text-xl font-extrabold text-neutral-900 mb-1">
            {userLocation.address || 'Civil Defense Sector Coordinates'}
          </div>
          <div className="text-xs text-neutral-500 font-mono mb-4">
            Lat: {userLocation.latitude.toFixed(4)}° N, Lon: {userLocation.longitude.toFixed(4)}° E
            {userLocation.accuracyMeters ? ` • Precision: ±${userLocation.accuracyMeters}m` : ''}
          </div>

          <button
            type="button"
            id="detect-gps-location-btn"
            onClick={handleDetectLocation}
            className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 text-xs font-semibold rounded-xs border border-neutral-300 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-neutral-700" />
            <span>Update from Device GPS</span>
          </button>

          {geoStatus && (
            <div
              className={`mt-3 text-xs p-2.5 rounded-xs ${
                geoStatus.status === 'granted'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : geoStatus.status === 'loading'
                  ? 'bg-neutral-100 text-neutral-800'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {geoStatus.message}
            </div>
          )}
        </div>

        {/* Alert Level Block */}
        <div
          className={`border rounded-xs p-6 shadow-2xs ${
            userZone.level === 'HIGH'
              ? 'bg-red-50 border-red-300'
              : userZone.level === 'ALERT'
              ? 'bg-amber-50 border-amber-300'
              : 'bg-neutral-50 border-neutral-300'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
            Current Area Alert Status
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`text-sm sm:text-base font-black px-3 py-1 rounded-xs uppercase tracking-wide ${
                userZone.level === 'HIGH'
                  ? 'bg-red-700 text-white'
                  : userZone.level === 'ALERT'
                  ? 'bg-amber-600 text-white'
                  : 'bg-neutral-800 text-white'
              }`}
            >
              {userZone.label}
            </span>
          </div>
          <p className="text-sm font-medium text-neutral-700 mt-2 leading-relaxed">
            {userZone.description}
          </p>
          {closestIncident && (
            <div className="mt-4 pt-3 border-t border-neutral-200/80 text-xs text-neutral-600">
              Closest active report: <strong>{closestIncident.type}</strong> (~{closestIncident.distanceKm} km away).
            </div>
          )}
        </div>
      </section>

      {/* Main Actions (Big, prominent, usable during stressful emergency) */}
      <section>
        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
          Emergency Action Center
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* REPORT INCIDENT (Visually most prominent) */}
          <button
            type="button"
            id="citizen-action-report-btn"
            onClick={() => onNavigate('report')}
            className="flex flex-col justify-between p-6 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white text-left rounded-xs transition-colors shadow-xs"
          >
            <div>
              <div className="text-xs font-bold text-red-200 uppercase tracking-wider">
                Emergency Report
              </div>
              <div className="text-xl font-extrabold mt-1">REPORT INCIDENT</div>
              <div className="text-xs text-red-100 mt-2 leading-normal">
                Submit details and photo of a fire, flood, blockage, or electrical hazard.
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-white uppercase">
              <span>Start Report</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* VIEW LIVE MAP */}
          <button
            type="button"
            id="citizen-action-map-btn"
            onClick={() => onNavigate('map')}
            className="flex flex-col justify-between p-6 bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-300 text-left rounded-xs transition-colors shadow-2xs"
          >
            <div>
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Interactive View
              </div>
              <div className="text-xl font-extrabold text-neutral-900 mt-1">VIEW LIVE MAP</div>
              <div className="text-xs text-neutral-600 mt-2 leading-normal">
                Open live satellite map with alert boundaries and verified incident pins.
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-neutral-900 uppercase">
              <span>Open Satellite Map</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* MY ALERTS */}
          <button
            type="button"
            id="citizen-action-alerts-btn"
            onClick={() => onNavigate('alerts')}
            className="flex flex-col justify-between p-6 bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-300 text-left rounded-xs transition-colors shadow-2xs"
          >
            <div>
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Warning Feed
              </div>
              <div className="text-xl font-extrabold text-neutral-900 mt-1">MY ALERTS</div>
              <div className="text-xs text-neutral-600 mt-2 leading-normal">
                View confirmed emergencies affecting your 0–15 km alert perimeter.
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-neutral-900 uppercase">
              <span>Check Alerts ({activeAlerts.length})</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* EMERGENCY ASSISTANT */}
          <button
            type="button"
            id="citizen-action-assistant-btn"
            onClick={() => onNavigate('assistant')}
            className="flex flex-col justify-between p-6 bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-300 text-left rounded-xs transition-colors shadow-2xs"
          >
            <div>
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Safety Guidance
              </div>
              <div className="text-xl font-extrabold text-neutral-900 mt-1">
                EMERGENCY ASSISTANT
              </div>
              <div className="text-xs text-neutral-600 mt-2 leading-normal">
                Ask ResQ AI for evacuation rules, first aid instructions, and helpline numbers.
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-neutral-900 uppercase">
              <span>Ask Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </section>

      {/* Community Verification Callout if nearby unverified report exists */}
      {unverifiedNearby && (
        <section className="bg-amber-50 border border-amber-300 rounded-xs p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                Community Verification Request
              </div>
              <div className="text-lg font-bold text-neutral-900 mt-1">
                POSSIBLE {unverifiedNearby.type.toUpperCase()} REPORTED NEARBY
              </div>
              <p className="text-sm text-neutral-700 mt-1">
                An unverified incident was reported approximately <strong>{unverifiedNearby.distanceKm} km</strong> from your location ({unverifiedNearby.address}). Are you near this scene?
              </p>
            </div>
            <button
              type="button"
              id="home-verify-nearby-btn"
              onClick={() => onOpenVerification(unverifiedNearby)}
              className="self-start sm:self-center shrink-0 px-5 py-2.5 bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wide rounded-xs transition-colors"
            >
              Verify Incident
            </button>
          </div>
        </section>
      )}

      {/* Nearby Active Incidents Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900">
              Nearby Active Incidents
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Showing the most relevant verified and reported hazards nearest to you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('map')}
            className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center gap-1"
          >
            <span>View All on Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          {nearbySlice.map((incident) => {
            const isConfirmed = incident.status === 'CONFIRMED';
            return (
              <div
                key={incident.id}
                className="bg-white border border-neutral-300 rounded-xs p-5 hover:border-neutral-400 transition-colors shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider ${
                        isConfirmed
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {incident.status}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">
                      Approx. <strong>{incident.distanceKm} km</strong> away
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-500">
                      Severity: <strong>{incident.severity}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900">
                    {incident.type} — {incident.address}
                  </h3>

                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    {incident.description}
                  </p>

                  <div className="text-[11px] text-neutral-500">
                    Community verifications: {incident.verificationStats.confirmations} confirmed, {incident.verificationStats.notPresent} not present.
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  {incident.status === 'UNVERIFIED' && (
                    <button
                      type="button"
                      onClick={() => onOpenVerification(incident)}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 text-xs font-bold rounded-xs border border-neutral-300 transition-colors"
                    >
                      Verify
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenIncidentDetail(incident)}
                    className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-bold rounded-xs border border-neutral-300 transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
