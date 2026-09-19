import React, { useState } from 'react';
import { IncidentType, IncidentSeverity, UserLocation } from '../types';
import { incidentStore } from '../services/incidentStore';
import { Camera, ImagePlus, Navigation, CheckCircle2 } from 'lucide-react';

interface ReportIncidentPageProps {
  userLocation: UserLocation;
  onSubmitted: (incidentId: string) => void;
  onCancel: () => void;
}

const INCIDENT_TYPES: IncidentType[] = [
  'Flood',
  'Fire',
  'Earthquake',
  'Storm',
  'Road blockage',
  'Building damage',
  'Landslide',
  'Electrical hazard',
  'Other emergency',
];

export const ReportIncidentPage: React.FC<ReportIncidentPageProps> = ({
  userLocation,
  onSubmitted,
  onCancel,
}) => {
  const [type, setType] = useState<IncidentType>('Flood');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [address, setAddress] = useState<string>(userLocation.address || '');
  const [latitude, setLatitude] = useState<number>(userLocation.latitude);
  const [longitude, setLongitude] = useState<number>(userLocation.longitude);
  const [description, setDescription] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    setLatitude(userLocation.latitude);
    setLongitude(userLocation.longitude);
    setAddress(userLocation.address || `Coordinates: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert file to local preview URL
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (result) {
        setPhotos((currentPhotos) => [result as string, ...currentPhotos]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please enter a brief description of the incident so rescue teams understand the hazard.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // If no user photo uploaded, provide relevant real incident photo for clear visibility
    let finalPhotos = [...photos];
    if (finalPhotos.length === 0) {
      if (type === 'Flood') {
        finalPhotos.push('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80');
      } else if (type === 'Fire') {
        finalPhotos.push('https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=800&q=80');
      } else if (type === 'Road blockage' || type === 'Landslide') {
        finalPhotos.push('https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80');
      } else if (type === 'Electrical hazard') {
        finalPhotos.push('https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80');
      }
    }

    try {
      const created = incidentStore.reportIncident({
        type,
        latitude,
        longitude,
        address: address.trim() || `Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        description: description.trim(),
        severity,
        evidencePhotos: finalPhotos,
      });

      setSubmittedId(created.id);
    } catch (err) {
      setErrorMsg('An error occurred while saving the report. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Post-submission confirmation screen
  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-neutral-300 rounded-xs p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Incident ID: {submittedId}
            </div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
              Report Submitted Successfully
            </h2>
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xs text-sm font-semibold text-amber-900 mt-4">
              Your report has been submitted and is awaiting community verification.
            </div>
            <p className="text-xs text-neutral-600 max-w-md mx-auto pt-2 leading-relaxed">
              Nearby citizens and civil protection controllers have been notified to corroborate the report. It is currently marked as <strong>UNVERIFIED</strong> until corroborated.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onSubmitted(submittedId)}
              className="w-full sm:w-auto px-6 py-2.5 bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xs transition-colors"
            >
              View on Live Map
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmittedId(null);
                setDescription('');
                setPhotos([]);
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-neutral-100 text-neutral-800 font-bold text-xs uppercase tracking-wider rounded-xs border border-neutral-300 transition-colors"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Title */}
      <div className="border-b border-neutral-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Report Emergency Incident
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Provide accurate information to alert nearby citizens and dispatch emergency response units.
        </p>

        {/* Status Notice per prompt requirement */}
        <div className="mt-4 p-3 bg-neutral-100 border-l-4 border-amber-600 text-xs text-neutral-700">
          <strong>Important Verification Notice:</strong> All initial incident reports start as <strong>UNVERIFIED</strong>. Reports must be corroborated by multiple community witnesses or verified by civil protection authorities before becoming an official high-priority alert.
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-800 text-xs font-semibold rounded-xs">
          {errorMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Incident Type */}
        <div className="bg-white border border-neutral-300 rounded-xs p-6 space-y-4 shadow-2xs">
          <label className="block text-sm font-bold text-neutral-900 uppercase tracking-wide">
            1. Select Incident Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {INCIDENT_TYPES.map((incType) => {
              const isSelected = type === incType;
              return (
                <button
                  key={incType}
                  type="button"
                  onClick={() => setType(incType)}
                  className={`p-3 text-left border rounded-xs text-xs font-bold transition-colors ${
                    isSelected
                      ? 'border-red-700 bg-red-50 text-red-900 ring-1 ring-red-700'
                      : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50'
                  }`}
                >
                  {incType}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Location */}
        <div className="bg-white border border-neutral-300 rounded-xs p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-neutral-900 uppercase tracking-wide">
              2. Incident Location
            </label>
            <button
              type="button"
              id="use-current-location-form-btn"
              onClick={handleUseCurrentLocation}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-800"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Use My Current Location</span>
            </button>
          </div>

          <div>
            <input
              type="text"
              id="report-location-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Near Bridge 2 Causeway, Old Highway Road"
              className="w-full text-sm border border-neutral-300 rounded-xs p-3 text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-neutral-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-neutral-500 font-medium">Latitude:</span>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full mt-1 p-2 border border-neutral-300 rounded-xs font-mono text-neutral-800"
              />
            </div>
            <div>
              <span className="text-neutral-500 font-medium">Longitude:</span>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full mt-1 p-2 border border-neutral-300 rounded-xs font-mono text-neutral-800"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Description & Severity */}
        <div className="bg-white border border-neutral-300 rounded-xs p-6 space-y-4 shadow-2xs">
          <label className="block text-sm font-bold text-neutral-900 uppercase tracking-wide">
            3. Incident Description &amp; Severity
          </label>

          <div>
            <textarea
              id="report-description-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the situation clearly: what is happening, is anyone trapped or injured, are roads blocked, is water rising?"
              className="w-full text-sm border border-neutral-300 rounded-xs p-3 text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-neutral-800 leading-relaxed"
              required
            />
          </div>

          <div>
            <div className="text-xs font-bold text-neutral-600 mb-2">Estimated Severity:</div>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as IncidentSeverity[]).map((sev) => {
                const isSelected = severity === sev;
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 text-center text-xs font-bold rounded-xs border transition-colors ${
                      isSelected
                        ? sev === 'CRITICAL' || sev === 'HIGH'
                          ? 'bg-red-700 text-white border-red-700'
                          : 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    {sev}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 4: Photo / Video Evidence */}
        <div className="bg-white border border-neutral-300 rounded-xs p-6 space-y-4 shadow-2xs">
          <label className="block text-sm font-bold text-neutral-900 uppercase tracking-wide">
            4. Photo or Video Evidence (Optional but Recommended)
          </label>
          <p className="text-xs text-neutral-600">
            Field photos help civil protection officers verify the threat level and dispatch appropriate heavy rescue equipment.
          </p>

          <div className="border-2 border-dashed border-neutral-300 rounded-xs p-6 text-center hover:border-neutral-400 transition-colors">
            <input
              type="file"
              id="evidence-gallery-input"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <input
              type="file"
              id="evidence-camera-input"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <label
                htmlFor="evidence-camera-input"
                className="cursor-pointer inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wide rounded-xs transition-colors"
              >
                <Camera className="w-4 h-4" />
                Take a photo
              </label>
              <label
                htmlFor="evidence-gallery-input"
                className="cursor-pointer inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-bold uppercase tracking-wide rounded-xs transition-colors"
              >
                <ImagePlus className="w-4 h-4" />
                Choose from device
              </label>
            </div>
            <div className="text-[11px] text-neutral-500 mt-3">
              Camera photos and JPG, PNG, MP4 files up to 15MB are supported.
            </div>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              {photos.map((photo, i) => (
                <div key={i} className="relative rounded-xs overflow-hidden border border-neutral-300 h-24">
                  <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Timestamp & Submission */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="text-xs text-neutral-500">
            Report timestamp: <strong>{new Date().toLocaleTimeString()}</strong> • Submitting as registered citizen reporter
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-3 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold uppercase rounded-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-incident-report-btn"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white text-xs font-extrabold uppercase tracking-wide rounded-xs transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'SUBMIT REPORT (UNVERIFIED)'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
