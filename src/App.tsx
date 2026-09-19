import React, { useState, useEffect } from 'react';
import { UserRole, Incident, UserLocation, Alert } from './types';
import { incidentStore } from './services/incidentStore';
import { Header } from './components/Header';
import { CitizenHomePage } from './pages/CitizenHomePage';
import { LiveMapPage } from './pages/LiveMapPage';
import { ReportIncidentPage } from './pages/ReportIncidentPage';
import { MyAlertsPage } from './pages/MyAlertsPage';
import { EmergencyAssistantPage } from './pages/EmergencyAssistantPage';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { VerificationModal } from './components/VerificationModal';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { Phone, Shield, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('citizen');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [incidents, setIncidents] = useState<Incident[]>(incidentStore.getIncidents());
  const [userLocation, setUserLocation] = useState<UserLocation>(incidentStore.getUserLocation());
  const [alerts, setAlerts] = useState<Alert[]>(incidentStore.getAlerts());

  // Modals state
  const [detailModalIncident, setDetailModalIncident] = useState<Incident | null>(null);
  const [verifyModalIncident, setVerifyModalIncident] = useState<Incident | null>(null);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = incidentStore.subscribe(() => {
      setIncidents(incidentStore.getIncidents());
      setUserLocation(incidentStore.getUserLocation());
      setAlerts(incidentStore.getAlerts());
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateLocation = (newLoc: UserLocation, reanchor = false) => {
    incidentStore.updateUserLocation(newLoc, reanchor);
    setUserLocation(incidentStore.getUserLocation());
    setIncidents(incidentStore.getIncidents());
  };

  const handleResetData = () => {
    if (window.confirm('Reset all incidents and reports to initial demo baseline?')) {
      incidentStore.resetToDemoData();
      setIncidents(incidentStore.getIncidents());
      setUserLocation(incidentStore.getUserLocation());
      setAlerts(incidentStore.getAlerts());
    }
  };

  // Open verified or newly reported incident on map
  const handleViewIncidentOnMap = (incidentId?: string) => {
    setActiveTab('map');
    if (incidentId) {
      const found = incidents.find((i) => i.id === incidentId);
      if (found) {
        setDetailModalIncident(found);
      }
    }
  };

  // Active confirmed alerts affecting user
  const activeAlertCount = incidents.filter((i) => i.status === 'CONFIRMED').length;

  return (
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      {/* Universal Official Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={(role) => {
          setCurrentRole(role);
          setActiveTab(role === 'citizen' ? 'home' : 'dashboard');
        }}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        activeAlertCount={activeAlertCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-16">
        {currentRole === 'citizen' ? (
          <>
            {activeTab === 'home' && (
              <CitizenHomePage
                userLocation={userLocation}
                onUpdateLocation={handleUpdateLocation}
                incidents={incidents}
                activeAlerts={alerts}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenIncidentDetail={(inc) => setDetailModalIncident(inc)}
                onOpenVerification={(inc) => setVerifyModalIncident(inc)}
              />
            )}

            {activeTab === 'map' && (
              <LiveMapPage
                incidents={incidents}
                userLocation={userLocation}
                onOpenVerification={(inc) => setVerifyModalIncident(inc)}
                onOpenIncidentDetail={(inc) => setDetailModalIncident(inc)}
              />
            )}

            {activeTab === 'report' && (
              <ReportIncidentPage
                userLocation={userLocation}
                onSubmitted={(incidentId) => {
                  handleViewIncidentOnMap(incidentId);
                }}
                onCancel={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'alerts' && (
              <MyAlertsPage
                userLocation={userLocation}
                incidents={incidents}
                onNavigateToMap={(incidentId) => handleViewIncidentOnMap(incidentId)}
                onOpenIncidentDetail={(inc) => setDetailModalIncident(inc)}
              />
            )}

            {activeTab === 'assistant' && (
              <EmergencyAssistantPage
                userLocation={userLocation}
                incidents={incidents}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
          </>
        ) : (
          /* Authority Portal View */
          <AuthorityDashboard
            userLocation={userLocation}
            incidents={incidents}
            activeSubTab={activeTab}
            onOpenIncidentDetail={(inc) => setDetailModalIncident(inc)}
          />
        )}
      </main>

      {/* Verification Modal */}
      {verifyModalIncident && (
        <VerificationModal
          incident={verifyModalIncident}
          userLocation={userLocation}
          onClose={() => setVerifyModalIncident(null)}
          onVerificationSubmitted={() => {
            // refresh data
            setIncidents(incidentStore.getIncidents());
          }}
        />
      )}

      {/* Incident Detail Modal */}
      {detailModalIncident && (
        <IncidentDetailModal
          incident={detailModalIncident}
          userRole={currentRole}
          onClose={() => setDetailModalIncident(null)}
          onUpdated={() => {
            setIncidents(incidentStore.getIncidents());
          }}
          onOpenVerification={(inc) => {
            setDetailModalIncident(null);
            setVerifyModalIncident(inc);
          }}
        />
      )}

      {/* Clean Public Service Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-auto py-8 px-4 sm:px-6 text-xs text-neutral-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-extrabold text-neutral-900 text-sm">
              Disaster Response &amp; React
            </div>
            <p className="text-neutral-500 mt-1 max-w-lg">
              Official Civil Protection Public Alert &amp; Incident Verification Service. In case of immediate life threat, always dial 112 directly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-neutral-500">
              Helplines: Police/Medical <strong>112</strong> | Disaster Control <strong>1077</strong>
            </span>
            <span className="text-neutral-300">|</span>
            {/* Subtle text notice per prompt instructions: "Demo data where appropriate, never a flashy demo badge or icon" */}
            <span className="text-neutral-400">
              Demo data environment
            </span>
            <button
              type="button"
              onClick={handleResetData}
              className="text-neutral-500 hover:text-neutral-900 underline flex items-center gap-1 ml-2"
              title="Reset state to original demo incidents"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset demo state</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
