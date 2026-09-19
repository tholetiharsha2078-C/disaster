import React, { useState } from 'react';
import { Incident, VerificationResponse, UserLocation } from '../types';
import { incidentStore } from '../services/incidentStore';
import { calculateDistanceKm } from '../utils/geo';
import { CheckCircle2, XCircle, HelpCircle, X, MapPin, Clock, Users, AlertCircle } from 'lucide-react';

interface VerificationModalProps {
  incident: Incident;
  userLocation: UserLocation;
  onClose: () => void;
  onVerificationSubmitted?: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  incident,
  userLocation,
  onClose,
  onVerificationSubmitted,
}) => {
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [notes, setNotes] = useState<string>('');
  const hasVoted = incidentStore.hasUserVoted(incident.id);

  const distanceKm = calculateDistanceKm(
    userLocation.latitude,
    userLocation.longitude,
    incident.latitude,
    incident.longitude
  );

  const handleVote = (choice: VerificationResponse) => {
    const res = incidentStore.submitVerification(incident.id, choice, notes);
    setFeedback(res);
    if (res.success && onVerificationSubmitted) {
      onVerificationSubmitted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
      <div className="bg-white border border-neutral-300 rounded-xs max-w-lg w-full p-6 shadow-xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 p-1"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Heading */}
        <div className="border-b border-neutral-200 pb-4">
          <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
            Community Emergency Verification
          </div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight leading-tight">
            POSSIBLE {incident.type.toUpperCase()} REPORTED NEARBY
          </h2>
          <p className="text-sm font-medium text-neutral-700 mt-2">
            An incident has been reported approximately <strong>{distanceKm} km</strong> from your location.
          </p>
          <div className="text-xs text-neutral-500 mt-1">
            Location: {incident.address}
          </div>
        </div>

        {/* Incident Description & Evidence */}
        <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xs space-y-3">
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Report Summary
          </div>
          <p className="text-sm text-neutral-800 leading-relaxed">
            {incident.description}
          </p>
          {incident.evidence && incident.evidence.length > 0 && (
            <div className="rounded-xs overflow-hidden border border-neutral-200 mt-2">
              <img
                src={incident.evidence[0].fileUrl}
                alt="Evidence"
                className="w-full h-36 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        {/* Current Verification Numbers */}
        <div className="border border-neutral-200 rounded-xs p-4 bg-white">
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
            Current Verification Counts
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
            <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-xs">
              <div className="text-lg font-black text-neutral-800">
                {incident.verificationStats.unsure}
              </div>
              <div className="text-[11px] font-bold text-neutral-700 uppercase">Unsure</div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-neutral-500 text-center">
            Total unique verifiers: <strong>{incident.verificationStats.totalVerifiers}</strong> • Reported {new Date(incident.createdAt).toLocaleTimeString()}
          </div>
        </div>

        {/* Status or Vote Result */}
        {feedback ? (
          <div
            className={`p-4 rounded-xs text-sm font-semibold ${
              feedback.success
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : 'bg-amber-50 text-amber-900 border border-amber-300'
            }`}
          >
            {feedback.message}
            <div className="mt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : hasVoted ? (
          <div className="p-4 bg-neutral-100 border border-neutral-300 rounded-xs text-center space-y-2">
            <div className="text-xs font-bold text-neutral-700">
              You have already recorded your verification for this incident.
            </div>
            <p className="text-[11px] text-neutral-500">
              To ensure integrity, only one response per citizen device is permitted.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs font-bold text-neutral-700 text-center uppercase tracking-wide">
              Are you present in this area? What is the condition?
            </div>

            {/* Verification Buttons - Large for easy touch on phone screens */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* CONFIRM */}
              <button
                type="button"
                id="verify-confirm-btn"
                onClick={() => handleVote('CONFIRM')}
                className="py-4 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold text-sm uppercase tracking-wide rounded-xs transition-colors text-center shadow-xs flex flex-col items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>CONFIRM</span>
                <span className="text-[10px] font-normal opacity-90">I see this hazard</span>
              </button>

              {/* NOT PRESENT */}
              <button
                type="button"
                id="verify-not-present-btn"
                onClick={() => handleVote('NOT_PRESENT')}
                className="py-4 px-3 bg-neutral-800 hover:bg-black active:bg-neutral-900 text-white font-extrabold text-sm uppercase tracking-wide rounded-xs transition-colors text-center shadow-xs flex flex-col items-center justify-center gap-1"
              >
                <XCircle className="w-5 h-5" />
                <span>NOT PRESENT</span>
                <span className="text-[10px] font-normal opacity-90">Clear / False report</span>
              </button>

              {/* UNSURE */}
              <button
                type="button"
                id="verify-unsure-btn"
                onClick={() => handleVote('UNSURE')}
                className="py-4 px-3 bg-neutral-200 hover:bg-neutral-300 active:bg-neutral-400 text-neutral-900 font-extrabold text-sm uppercase tracking-wide rounded-xs transition-colors text-center shadow-xs flex flex-col items-center justify-center gap-1 border border-neutral-300"
              >
                <HelpCircle className="w-5 h-5 text-neutral-700" />
                <span>UNSURE</span>
                <span className="text-[10px] font-normal text-neutral-600">Cannot confirm</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
