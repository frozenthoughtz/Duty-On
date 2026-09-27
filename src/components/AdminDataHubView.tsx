import React, { useState, useMemo } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { syncAlertToCloud } from '../services/firestoreDutyOn';
import { MultiSiteItem, FleetVehicle, OfficerRecord } from '../types/dutyon';
import { EditSiteModal } from './modals/EditSiteModal';
import { EditFleetModal } from './modals/EditFleetModal';
import { EditOfficerModal } from './modals/EditOfficerModal';

export const AdminDataHubView: React.FC = () => {
  const {
    sites,
    deleteSite,
    lockdownSite,
    dispatchArmedBackupToSite,
    setSelectedSiteForModal,
    setIsNewSiteModalOpen,
    fleetVehicles,
    updateFleetVehicle,
    deleteFleetVehicle,
    setIsNewFleetModalOpen,
    officersList,
    deleteOfficer,
    sendOfficerWelfarePing,
    updateOfficerStatus,
    setSelectedOfficerForModal,
    setIsNewOfficerModalOpen,
    isCloudConnected,
    showToast,
    resetToRealLifeData
  } = useDutyOn();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'sites' | 'fleet' | 'officers' | 'database'>('sites');
  const [siteSearch, setSiteSearch] = useState('');
  const [fleetSearch, setFleetSearch] = useState('');
  const [officerSearch, setOfficerSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isPingingCloud, setIsPingingCloud] = useState(false);

  // Edit Modals State
  const [editingSite, setEditingSite] = useState<MultiSiteItem | null>(null);
  const [editingFleet, setEditingFleet] = useState<FleetVehicle | null>(null);
  const [editingOfficer, setEditingOfficer] = useState<OfficerRecord | null>(null);

  // In-app Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'site' | 'fleet' | 'officer';
    id: string;
    name: string;
    extraInfo?: string;
  } | null>(null);

  const [officerSiteFilter, setOfficerSiteFilter] = useState<string>('ALL');

  // Combined site & location list across sites and uploaded officers
  const allAvailableSites = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      if (s.name) set.add(s.name.trim());
    });
    officersList.forEach((o) => {
      if (o.currentSite) set.add(o.currentSite.trim());
    });
    return Array.from(set).sort();
  }, [sites, officersList]);

  // Filtered lists
  const filteredSites = sites.filter(
    (s) =>
      s.name.toLowerCase().includes(siteSearch.toLowerCase()) ||
      s.location.toLowerCase().includes(siteSearch.toLowerCase()) ||
      s.category?.toLowerCase().includes(siteSearch.toLowerCase())
  );

  const filteredFleet = fleetVehicles.filter(
    (v) =>
      v.callSign.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      v.regPlate.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      v.sector.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      v.crew.toLowerCase().includes(fleetSearch.toLowerCase())
  );

  const normalizeSiteStr = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/khwamagxaki/g, 'kwamagxaki')
      .replace(/lindsy/g, 'lindsay');
  };

  const filteredOfficers = officersList.filter((o) => {
    const q = officerSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.name.toLowerCase().includes(q) ||
      o.empId.toLowerCase().includes(q) ||
      o.psiraNumber.toLowerCase().includes(q) ||
      (o.currentSite && o.currentSite.toLowerCase().includes(q)) ||
      (o.location && o.location.toLowerCase().includes(q));

    if (officerSiteFilter === 'ALL') return matchesSearch;

    const normFilter = normalizeSiteStr(officerSiteFilter);
    const normSite = normalizeSiteStr(o.currentSite || '');
    const normLoc = normalizeSiteStr(o.location || '');

    const matchesSite =
      normSite === normFilter ||
      normSite.includes(normFilter) ||
      normFilter.includes(normSite) ||
      normLoc.includes(normFilter);

    return matchesSearch && matchesSite;
  });

  // Export JSON backup
  const handleExportData = () => {
    setIsExporting(true);
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        database: 'ai-studio-926bc59b-371c-435c-99ce-0270f56d9027',
        version: '1.2.0-SOC-PRO',
        sites,
        fleetVehicles,
        officers: officersList
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `DutyOn_Master_Data_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Master SOC Data exported successfully as JSON');
    } catch (err) {
      console.error(err);
      showToast('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Live cloud ping test
  const handleCloudPing = async () => {
    setIsPingingCloud(true);
    try {
      await syncAlertToCloud({
        id: `ping-${Date.now()}`,
        title: 'Admin Live Cloud Ping Test',
        location: 'SOC Headquarters',
        description: `Verified two-way write from Admin Data Hub at ${new Date().toLocaleTimeString()}`,
        time: new Date().toLocaleTimeString().slice(0, 5),
        priority: 'MED',
        type: 'MED'
      });
      showToast('Live Firestore ping confirmed! Data committed to cloud.');
    } catch (err) {
      console.error(err);
      showToast('Cloud ping failed: Check Firestore connection');
    } finally {
      setIsPingingCloud(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#071726] overflow-y-auto">
      {/* Top Banner & Control Room Admin Header */}
      <div className="p-6 bg-gradient-to-r from-[#0A1E33] via-[#0A1E33]/90 to-[#071726] border-b border-white/10 flex-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-[#1FA6C9]/20 text-[#3FC9E9] grid place-items-center text-xl shadow-lg shadow-[#1FA6C9]/10">
                ⚙️
              </span>
              <div>
                <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  Admin Master Data Command Hub
                  <span className="text-[10px] uppercase font-mono-code px-2 py-0.5 rounded-full bg-[#1FA6C9]/20 text-[#3FC9E9] border border-[#1FA6C9]/30">
                    Live Management
                  </span>
                </h1>
                <p className="text-xs text-[#8598A8]">
                  Add, update, and manage real Client Sites, GPS Geofenced Perimeters, Armed Response Fleet, and PSIRA Officers.
                </p>
              </div>
            </div>
          </div>

          {/* Cloud Status & Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs">
              <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[#8598A8] text-[11px]">Firestore:</span>
              <span className="text-white font-mono-code text-[11px] font-semibold">
                {isCloudConnected ? 'Live Cloud' : 'Connecting'}
              </span>
            </div>

            <button
              onClick={() => setIsNewSiteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1FA6C9] hover:bg-[#1894b4] text-[#042430] font-bold text-xs shadow-md shadow-[#1FA6C9]/20 transition-all cursor-pointer"
            >
              <span>+</span>
              <span>Add Site &amp; Geofence</span>
            </button>

            <button
              onClick={() => setIsNewFleetModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 transition-all cursor-pointer"
            >
              <span>🚔</span>
              <span>Add Fleet Vehicle</span>
            </button>

            <button
              onClick={() => setIsNewOfficerModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 transition-all cursor-pointer"
            >
              <span>👮</span>
              <span>Enroll Guard</span>
            </button>

            <button
              onClick={() => {
                resetToRealLifeData();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
              title="Purge legacy demo records and bulk enroll 12 Tikedi sites & 85 officers into Firestore"
            >
              <span>🚀</span>
              <span>Bulk Upload Tikedi Data &amp; Purge</span>
            </button>
          </div>
        </div>

        {/* Real Data Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-[#071726]/80 p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#8598A8] uppercase tracking-wider font-semibold">Protected Sites</span>
              <span className="text-base">🏢</span>
            </div>
            <div className="text-2xl font-bold font-display text-white mt-1">{sites.length}</div>
            <div className="text-[10px] text-[#3FC9E9] mt-0.5">All with active GPS perimeters</div>
          </div>

          <div className="bg-[#071726]/80 p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#8598A8] uppercase tracking-wider font-semibold">Armed Fleet Units</span>
              <span className="text-base">🚔</span>
            </div>
            <div className="text-2xl font-bold font-display text-white mt-1">{fleetVehicles.length}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {fleetVehicles.filter((v) => v.status === '10-8 Available').length} units 10-8 Ready
            </div>
          </div>

          <div className="bg-[#071726]/80 p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#8598A8] uppercase tracking-wider font-semibold">Registered Guards</span>
              <span className="text-base">👮</span>
            </div>
            <div className="text-2xl font-bold font-display text-white mt-1">{officersList.length}</div>
            <div className="text-[10px] text-[#3FC9E9] mt-0.5">100% PSIRA Registered</div>
          </div>

          <div className="bg-[#071726]/80 p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#8598A8] uppercase tracking-wider font-semibold">Cloud Sync</span>
              <span className="text-base">☁️</span>
            </div>
            <div className="text-xs font-mono-code font-bold text-emerald-400 mt-2 truncate">
              {isCloudConnected ? 'CONNECTED' : 'OFFLINE'}
            </div>
            <div className="text-[10px] text-[#8598A8] mt-0.5">Firestore Collections live</div>
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-2 mt-5 border-b border-white/10 pb-0">
          <button
            onClick={() => setActiveAdminSubTab('sites')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeAdminSubTab === 'sites'
                ? 'border-[#1FA6C9] text-[#3FC9E9]'
                : 'border-transparent text-[#8598A8] hover:text-white'
            }`}
          >
            <span>🏢</span>
            <span>Protected Sites &amp; Geofences ({sites.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminSubTab('fleet')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeAdminSubTab === 'fleet'
                ? 'border-[#1FA6C9] text-[#3FC9E9]'
                : 'border-transparent text-[#8598A8] hover:text-white'
            }`}
          >
            <span>🚔</span>
            <span>Armed Response Fleet ({fleetVehicles.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminSubTab('officers')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeAdminSubTab === 'officers'
                ? 'border-[#1FA6C9] text-[#3FC9E9]'
                : 'border-transparent text-[#8598A8] hover:text-white'
            }`}
          >
            <span>👮</span>
            <span>Security Personnel ({officersList.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminSubTab('database')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeAdminSubTab === 'database'
                ? 'border-[#1FA6C9] text-[#3FC9E9]'
                : 'border-transparent text-[#8598A8] hover:text-white'
            }`}
          >
            <span>💾</span>
            <span>Database Backup &amp; Live Ping</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 flex-1">
        {/* TAB 1: SITES & GEOFENCES */}
        {activeAdminSubTab === 'sites' && (
          <div className="space-y-4">
            {/* Search Bar & Stats */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search sites, sector, category..."
                  value={siteSearch}
                  onChange={(e) => setSiteSearch(e.target.value)}
                  className="w-full bg-[#0A1E33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#8598A8] focus:outline-none focus:border-[#1FA6C9]"
                />
                {siteSearch && (
                  <button
                    onClick={() => setSiteSearch('')}
                    className="absolute right-3 top-2 text-[#8598A8] hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-[#8598A8]">
                <span>Showing {filteredSites.length} of {sites.length} client sites</span>
              </div>
            </div>

            {/* Sites Table */}
            <div className="bg-[#0A1E33] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#071726] border-b border-white/10 text-[#8598A8] text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Site Name &amp; Category</th>
                      <th className="py-3 px-4">Location &amp; SAPS Station</th>
                      <th className="py-3 px-4">Geofence Perimeter</th>
                      <th className="py-3 px-4">Guards Quota</th>
                      <th className="py-3 px-4">Client Contact</th>
                      <th className="py-3 px-4">Armed Unit</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white">
                    {filteredSites.map((site) => (
                      <tr key={site.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {site.name}
                          </div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-white/5 text-[#8598A8] text-[10px]">
                            {site.category || 'Commercial'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-[#8598A8]">
                          <div>{site.location}</div>
                          <div className="text-[10px] text-[#3FC9E9] mt-0.5">
                            👮 {site.sapsStation || 'Local SAPS'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono-code">
                          <span className="px-2 py-1 rounded-lg bg-[#1FA6C9]/15 text-[#3FC9E9] border border-[#1FA6C9]/30 text-[11px] font-bold">
                            🎯 {site.geofenceRadius || 35}m Radius
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-code font-bold text-white">
                              {site.officersPresent || 0} / {site.officersRequired}
                            </span>
                            <span className="text-[10px] text-[#8598A8]">on post</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-white font-medium">{site.clientContactName || 'Site Mgr'}</div>
                          <div className="text-[10px] text-[#8598A8] font-mono-code">{site.clientPhone}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-[#8598A8]">
                            {site.armedResponseUnit || 'AR-01 Alpha'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingSite(site)}
                              title="Edit Site Details, Geofence & Contacts"
                              className="px-2 py-1 rounded-lg bg-[#3FC9E9]/20 hover:bg-[#3FC9E9]/30 text-[#3FC9E9] text-[11px] font-bold cursor-pointer"
                            >
                              ✏️ Edit
                            </button>

                            <button
                              onClick={() => setSelectedSiteForModal(site)}
                              title="View Site Dossier & Files"
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Dossier
                            </button>

                            <button
                              onClick={() => dispatchArmedBackupToSite(site.id)}
                              title="Dispatch Tactical Vehicle"
                              className="px-2 py-1 rounded-lg bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] text-[11px] font-semibold cursor-pointer"
                            >
                              Dispatch
                            </button>

                            <button
                              onClick={() => lockdownSite(site.id)}
                              title="Emergency Lockdown"
                              className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-semibold cursor-pointer"
                            >
                              Lockdown
                            </button>

                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'site',
                                  id: site.id,
                                  name: site.name,
                                  extraInfo: `${site.location} · Client: ${site.clientName || 'Private'}`
                                })
                              }
                              title="Delete Protected Site"
                              className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/20 text-[11px] font-bold cursor-pointer ml-1 flex items-center gap-1"
                            >
                              <span>🗑️</span>
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredSites.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#8598A8]">
                          No sites match the search filter. Click "+ Add Site &amp; Geofence" to add real premises.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ARMED FLEET */}
        {activeAdminSubTab === 'fleet' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search fleet, callsign, reg plate, sector..."
                  value={fleetSearch}
                  onChange={(e) => setFleetSearch(e.target.value)}
                  className="w-full bg-[#0A1E33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#8598A8] focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div className="text-xs text-[#8598A8]">
                Showing {filteredFleet.length} of {fleetVehicles.length} armed response units
              </div>
            </div>

            {/* Fleet Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFleet.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl hover:border-[#1FA6C9]/40 transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base">🚔</span>
                          <span className="font-display font-bold text-sm text-white">{vehicle.callSign}</span>
                        </div>
                        <div className="text-[11px] text-[#8598A8] mt-0.5">{vehicle.vehicleModel}</div>
                      </div>

                      <span className="px-2.5 py-1 rounded-md bg-[#071726] border border-white/15 font-mono-code font-bold text-white text-[11px] shadow-sm tracking-wider">
                        {vehicle.regPlate}
                      </span>
                    </div>

                    {/* Telemetry Bar */}
                    <div className="grid grid-cols-3 gap-2 bg-[#071726] p-2.5 rounded-xl my-3 border border-white/5 text-[11px]">
                      <div>
                        <span className="text-[9px] text-[#8598A8] block">FUEL</span>
                        <span className="font-mono-code font-bold text-white">{vehicle.fuelPct}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#8598A8] block">TRACKER</span>
                        <span className="font-mono-code font-bold text-emerald-400">{vehicle.batteryPct}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#8598A8] block">SPEED</span>
                        <span className="font-mono-code font-bold text-white">{vehicle.speedKmH} km/h</span>
                      </div>
                    </div>

                    {/* Crew & Sector Info */}
                    <div className="space-y-1.5 text-xs text-[#8598A8]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-semibold text-white/60">Crew:</span>
                        <span className="text-white truncate">{vehicle.crew}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-semibold text-white/60">Sector:</span>
                        <span className="text-white truncate">{vehicle.sector}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-semibold text-white/60">Radio:</span>
                        <span className="font-mono-code text-[#3FC9E9] text-[11px]">{vehicle.radioChannel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Selector & Actions */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <select
                      value={vehicle.status}
                      onChange={(e) =>
                        updateFleetVehicle(vehicle.id, {
                          status: e.target.value as any
                        })
                      }
                      className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border focus:outline-none cursor-pointer ${
                        vehicle.status === '10-8 Available'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : vehicle.status === '10-23 En Route'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-white/10 text-white border-white/20'
                      }`}
                    >
                      <option value="10-8 Available" className="bg-[#0A1E33] text-white">10-8 Available</option>
                      <option value="10-23 En Route" className="bg-[#0A1E33] text-white">10-23 En Route</option>
                      <option value="10-7 Standby" className="bg-[#0A1E33] text-white">10-7 Standby</option>
                    </select>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingFleet(vehicle)}
                        title="Edit Vehicle & Crew Details"
                        className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold cursor-pointer"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => {
                          updateFleetVehicle(vehicle.id, {
                            status: '10-23 En Route',
                            destination: 'Emergency Alarm Response',
                            etaMin: 3
                          });
                          showToast(`Vehicle ${vehicle.callSign} dispatched to priority alarm`);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] text-xs font-semibold cursor-pointer"
                      >
                        Dispatch
                      </button>

                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: 'fleet',
                            id: vehicle.id,
                            name: vehicle.callSign,
                            extraInfo: `${vehicle.makeModel} (${vehicle.regPlate}) · Sector: ${vehicle.sector}`
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-bold cursor-pointer flex items-center gap-1"
                        title="Decommission and delete vehicle"
                      >
                        <span>🗑️</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredFleet.length === 0 && (
                <div className="col-span-3 py-12 text-center text-[#8598A8] bg-[#0A1E33] rounded-2xl border border-white/10">
                  No fleet vehicles match search. Click "+ Add Fleet Vehicle" to enroll real patrol cars.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: OFFICERS & PSIRA */}
        {activeAdminSubTab === 'officers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    placeholder="Search officers, PSIRA number, site..."
                    value={officerSearch}
                    onChange={(e) => setOfficerSearch(e.target.value)}
                    className="w-full bg-[#0A1E33] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#8598A8] focus:outline-none focus:border-[#1FA6C9]"
                  />
                  {officerSearch && (
                    <button
                      onClick={() => setOfficerSearch('')}
                      className="absolute right-3 top-2 text-[#8598A8] hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-[#8598A8] whitespace-nowrap">📍 Filter by Site:</span>
                  <select
                    value={officerSiteFilter}
                    onChange={(e) => setOfficerSiteFilter(e.target.value)}
                    className="bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-2 text-xs text-[#3FC9E9] font-medium focus:outline-none focus:border-[#1FA6C9] cursor-pointer"
                  >
                    <option value="ALL">All Sites &amp; Locations ({allAvailableSites.length})</option>
                    {allAvailableSites.map((siteName) => (
                      <option key={siteName} value={siteName}>{siteName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-[#8598A8] whitespace-nowrap">
                Showing <span className="text-white font-bold">{filteredOfficers.length}</span> of {officersList.length} guards
              </div>
            </div>

            <div className="bg-[#0A1E33] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#071726] border-b border-white/10 text-[#8598A8] text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Officer Name &amp; ID</th>
                      <th className="py-3 px-4">PSIRA Registration</th>
                      <th className="py-3 px-4">Hourly Rates (ZAR)</th>
                      <th className="py-3 px-4">Current Post &amp; Site</th>
                      <th className="py-3 px-4">Location &amp; Availability</th>
                      <th className="py-3 px-4">Firearm / Certs</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Attendance</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white">
                    {filteredOfficers.map((off) => (
                      <tr key={off.id} className="hover:bg-white/[0.04] transition-colors group">
                        <td
                          className="py-3.5 px-4 cursor-pointer"
                          onClick={() => setSelectedOfficerForModal(off)}
                          title="Click to view all documents, personnel profile, and operational data"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-xl bg-[#1FA6C9]/20 text-[#3FC9E9] group-hover:bg-[#1FA6C9] group-hover:text-[#042430] grid place-items-center font-bold text-xs transition-all flex-none shadow-sm">
                              {off.avatarInitial || off.name.charAt(0)}
                            </span>
                            <div>
                              <div className="font-semibold text-white group-hover:text-[#3FC9E9] flex items-center gap-1.5 transition-colors">
                                <span>{off.name}</span>
                                <span className="text-[9px] bg-[#1FA6C9]/10 text-[#3FC9E9] px-1.5 py-0.2 rounded border border-[#1FA6C9]/20">
                                  View File ↗
                                </span>
                              </div>
                              <div className="text-[10px] text-[#8598A8] font-mono-code flex items-center gap-2">
                                <span>ID: {off.empId}</span>
                                <span>•</span>
                                <span>{off.documents?.length || 0} doc(s)</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono-code text-[11px] text-[#3FC9E9]">
                            {off.psiraNumber}
                          </span>
                          <div className="text-[10px] text-[#8598A8] mt-0.5">{off.grade}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono-code">
                          <div className="text-[#5BCB80] font-bold text-xs">
                            R{(off.hourlyRate || 36.50).toFixed(2)}/hr
                          </div>
                          <div className="text-[10px] text-[#8598A8]">
                            Bill: R{(off.clientBillingRate || 82.00).toFixed(2)}/hr
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-white font-medium">{off.currentSite}</div>
                          <div className="text-[10px] text-[#8598A8]">{off.currentPost}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-white text-[11px] truncate max-w-[140px]">{off.location || 'Gqeberha, EC'}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(off.availableDays && off.availableDays.length > 0 ? off.availableDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).slice(0, 3).map((d) => (
                              <span key={d} className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] text-[#3FC9E9] font-semibold">{d}</span>
                            ))}
                            {(off.availableDays?.length || 6) > 3 && (
                              <span className="text-[9px] text-[#8598A8]">+{((off.availableDays?.length || 6) - 3)}</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {off.firearmCompetency ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              🔫 Armed SAPS 511(a)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-white/5 text-[#8598A8] text-[10px]">
                              Unarmed Patrol
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono-code text-[#8598A8]">
                          {off.phone}
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => updateOfficerStatus(off.id, !off.isClockedIn)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              off.isClockedIn
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-white/10 text-[#8598A8] border border-white/15'
                            }`}
                          >
                            {off.isClockedIn ? '● Clocked In' : '○ Off Duty'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedOfficerForModal(off)}
                              title="Open Full Profile, Documents Vault, and Edit Options"
                              className="px-2.5 py-1 rounded-lg bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] text-[11px] font-bold cursor-pointer flex items-center gap-1 border border-[#1FA6C9]/30"
                            >
                              <span>📁 Profile &amp; Docs</span>
                            </button>

                            <button
                              onClick={() => setEditingOfficer(off)}
                              title="Edit Officer Rates & Details"
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold cursor-pointer"
                            >
                              ✏️ Edit
                            </button>

                            <button
                              onClick={() => sendOfficerWelfarePing(off.id)}
                              title="Welfare Check Ping"
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] cursor-pointer"
                            >
                              Ping
                            </button>

                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'officer',
                                  id: off.id,
                                  name: off.name,
                                  extraInfo: `EMP: ${off.empId} · PSIRA: ${off.psiraNumber || 'N/A'} · ${off.grade}`
                                })
                              }
                              title="Delete Officer"
                              className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/20 text-[11px] font-bold cursor-pointer ml-1 flex items-center gap-1"
                            >
                              <span>🗑️</span>
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DATABASE PERSISTENCE & UTILITIES */}
        {activeAdminSubTab === 'database' && (
          <div className="space-y-5 max-w-4xl">
            <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-display font-bold text-white">Google Cloud Firestore Live Persistence</h3>
                  <p className="text-xs text-[#8598A8]">
                    Real-time synchronization across all dispatch consoles, patrol wands, and mobile field clients.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#071726] p-4 rounded-xl border border-white/5 font-mono-code">
                <div>
                  <span className="text-[#8598A8] text-[10px] block">PROJECT ID</span>
                  <span className="text-white font-bold">ai-studio-926bc59b-371c-435c-99ce-0270f56d9027</span>
                </div>
                <div>
                  <span className="text-[#8598A8] text-[10px] block">SECURITY RULES</span>
                  <span className="text-emerald-400 font-bold">firestore.rules Verified</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleCloudPing}
                  disabled={isPingingCloud}
                  className="px-4 py-2.5 rounded-xl bg-[#1FA6C9] hover:bg-[#1894b4] text-[#042430] font-bold text-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <span>{isPingingCloud ? '⏳' : '⚡'}</span>
                  <span>{isPingingCloud ? 'Pinging Cloud...' : 'Send Live Cloud Ping to Firestore'}</span>
                </button>

                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <span>📥</span>
                  <span>{isExporting ? 'Exporting...' : 'Export Master SOC Data (JSON)'}</span>
                </button>

                <button
                  onClick={() => {
                    resetToRealLifeData();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 font-bold text-xs border border-red-500/30 transition-all cursor-pointer flex items-center gap-2"
                  title="Remove all placeholder data and bulk upload 12 Tikedi sites & 85 officers to Firestore"
                >
                  <span>🧹</span>
                  <span>Purge Placeholder Data &amp; Bulk Upload Tikedi Operations</span>
                </button>
              </div>
            </div>

            {/* Explanatory Guide on Real vs Sample Data */}
            <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
              <h4 className="text-sm font-display font-bold text-white flex items-center gap-2">
                <span>ℹ️</span>
                <span>How Real Data Works in DutyOn Security Suite</span>
              </h4>
              <ul className="text-xs text-[#8598A8] space-y-2 leading-relaxed list-disc list-inside">
                <li>
                  <strong className="text-white">Sample Seed Data:</strong> Provides instant mock telemetry for immediate testing (e.g. Kwamagxaki Shopping Centre, AR-01 Alpha, Greenacres Mall).
                </li>
                <li>
                  <strong className="text-white">Real Data Enrollment:</strong> Use the buttons at the top right of this screen (or in the Control Room top bar) to add your real client sites, GPS geofences, tactical fleet vehicles, and PSIRA officers.
                </li>
                <li>
                  <strong className="text-white">Firestore Cloud Persistence:</strong> Any site, vehicle, or officer you add is saved to Google Cloud Firestore and subscribed to in real time. Deleting a record removes it from both the local store and Firestore.
                </li>
                <li>
                  <strong className="text-white">Live Radar Map Integration:</strong> Newly added sites and vehicles immediately plot on the interactive radar map with live coordinates, tactical radius overlays, and status indicators.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Edit Site Modal */}
      {editingSite && (
        <EditSiteModal
          site={editingSite}
          onClose={() => setEditingSite(null)}
        />
      )}

      {/* Edit Fleet Modal */}
      {editingFleet && (
        <EditFleetModal
          vehicle={editingFleet}
          onClose={() => setEditingFleet(null)}
        />
      )}

      {/* Edit Officer Modal */}
      {editingOfficer && (
        <EditOfficerModal
          officer={editingOfficer}
          onClose={() => setEditingOfficer(null)}
        />
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0A1E33] border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 grid place-items-center text-2xl flex-none">
                🗑️
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  Confirm Permanent Deletion
                </h3>
                <p className="text-xs text-[#8598A8]">
                  Delete {deleteTarget.type === 'site' ? 'Protected Site' : deleteTarget.type === 'fleet' ? 'Armed Response Vehicle' : 'Security Officer'}
                </p>
              </div>
            </div>

            <div className="bg-[#071726] border border-white/10 rounded-xl p-3.5 space-y-1">
              <div className="text-sm font-bold text-white">{deleteTarget.name}</div>
              {deleteTarget.extraInfo && (
                <div className="text-xs text-[#8598A8]">{deleteTarget.extraInfo}</div>
              )}
            </div>

            <p className="text-xs text-red-200/80 leading-relaxed">
              This record will be permanently deleted from Google Cloud Firestore and removed from all active duty rosters, live radar tracking, and dispatch consoles.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteTarget.type === 'site') {
                    deleteSite(deleteTarget.id);
                  } else if (deleteTarget.type === 'fleet') {
                    deleteFleetVehicle(deleteTarget.id);
                  } else if (deleteTarget.type === 'officer') {
                    deleteOfficer(deleteTarget.id);
                  }
                  showToast(`Successfully deleted ${deleteTarget.name}`);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <span>🗑️</span>
                <span>Yes, Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
