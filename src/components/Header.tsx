import React, { useState } from 'react';
import { UserRole } from '../types';
import { Shield, Phone, AlertCircle, Menu, X, Radio } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeAlertCount: number;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

interface NavTabItem {
  id: string;
  label: string;
  badge?: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  activeAlertCount,
  isDemoMode,
  onToggleDemoMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const citizenTabs: NavTabItem[] = [
    { id: 'home', label: 'Home' },
    { id: 'map', label: 'Live Map' },
    { id: 'report', label: 'Report Incident' },
    { id: 'alerts', label: 'My Alerts', badge: activeAlertCount > 0 ? activeAlertCount : null },
    { id: 'assistant', label: 'Emergency Assistant' },
  ];

  const authorityTabs: NavTabItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'incidents', label: 'Live Incidents' },
    { id: 'verification', label: 'Verification Queue' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'zones', label: 'Alert Zones' },
    { id: 'history', label: 'Incident History' },
    { id: 'resources', label: 'Emergency Resources' },
    { id: 'audit', label: 'Audit Log' },
  ];

  const currentTabs = currentRole === 'citizen' ? citizenTabs : authorityTabs;

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-2xs">
      {/* Top emergency dispatch notification bar */}
      <div className="bg-neutral-900 text-white px-4 py-1.5 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-600"></span>
            <span className="font-semibold text-neutral-100">Official Emergency Response Network</span>
            <span className="hidden sm:inline text-neutral-400">|</span>
            <span className="hidden sm:inline text-neutral-300">Active Monitoring 24/7</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-neutral-400">
              National Emergency: <strong className="text-white font-bold tracking-wider">112</strong>
            </span>
            <span className="hidden md:inline text-neutral-400">
              Disaster Control: <strong className="text-white font-bold">1077</strong>
            </span>
            {/* Subtle demo data indicator per guideline (text only, no flashy badge/icon) */}
            <span className="text-neutral-400 border-l border-neutral-700 pl-3">
              {isDemoMode ? 'Demo mode' : 'Public user mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Brand & Portal Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand identity */}
        <div
          onClick={() => onTabChange(currentRole === 'citizen' ? 'home' : 'dashboard')}
          className="cursor-pointer flex items-center gap-3 select-none"
        >
          <div className="w-10 h-10 bg-red-700 text-white flex items-center justify-center font-black text-xl rounded-xs">
            R
          </div>
          <div>
            <div className="text-xl font-extrabold text-neutral-900 tracking-tight leading-none">
              Disaster Response &amp; React
            </div>
            <div className="text-xs font-medium text-neutral-600 mt-1">
              Public Safety &amp; Civil Protection Service
            </div>
          </div>
        </div>

        {/* Portal Role Switcher & Action */}
        <div className="flex items-center gap-3">
          {/* Clean Portal Toggle */}
          <div className="bg-neutral-100 border border-neutral-300 rounded-xs p-0.5 flex text-xs font-semibold">
            <button
              type="button"
              id="switch-citizen-portal-btn"
              onClick={() => {
                onRoleChange('citizen');
                onTabChange('home');
              }}
              className={`px-3 py-1.5 rounded-xs transition-colors ${
                currentRole === 'citizen'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Citizen Portal
            </button>
            <button
              type="button"
              id="switch-authority-portal-btn"
              onClick={() => {
                onRoleChange('authority');
                onTabChange('dashboard');
              }}
              className={`px-3 py-1.5 rounded-xs transition-colors ${
                currentRole === 'authority'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Authority Portal
            </button>
          </div>

          {/* Prominent Quick Report Button for Citizens */}
          {currentRole === 'citizen' && (
            <button
              type="button"
              id="header-report-btn"
              onClick={() => onTabChange('report')}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white font-bold text-xs uppercase tracking-wide rounded-xs transition-colors"
            >
              Report Incident
            </button>
          )}

          <button
            type="button"
            onClick={onToggleDemoMode}
            className="hidden sm:inline-flex items-center justify-center px-3 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-semibold text-xs rounded-xs transition-colors"
          >
            {isDemoMode ? 'Exit Demo Mode' : 'Try Demo Mode'}
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-700 hover:text-neutral-900 border border-neutral-300 rounded-xs"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation Bar (Desktop) */}
      <nav className="border-t border-neutral-200 hidden lg:block bg-neutral-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center overflow-x-auto">
          {currentTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`nav-tab-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-red-700 text-red-700 bg-white'
                    : 'border-transparent text-neutral-700 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-red-700 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-3 space-y-1">
          {currentTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`mobile-nav-tab-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full text-left py-2.5 px-3 rounded-xs text-sm font-semibold flex items-center justify-between ${
                  isActive
                    ? 'bg-red-50 text-red-800 border-l-4 border-red-700'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-red-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          {currentRole === 'citizen' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleTabClick('report')}
                className="w-full py-3 bg-red-700 text-white font-bold text-sm uppercase tracking-wide rounded-xs text-center block"
              >
                Report Incident Now
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onToggleDemoMode();
              setMobileMenuOpen(false);
            }}
            className="w-full mt-2 py-2.5 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-semibold text-sm rounded-xs text-center"
          >
            {isDemoMode ? 'Exit Demo Mode' : 'Try Demo Mode'}
          </button>
        </div>
      )}
    </header>
  );
};
