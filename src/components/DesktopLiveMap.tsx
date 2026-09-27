import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { useDutyOn } from '../context/DutyOnContext';
import { MultiSiteItem } from '../types/dutyon';

interface ResponseVehicle {
  id: string;
  callSign: string;
  vehicleModel: string;
  crew: string;
  status: '10-8 Available' | '10-23 En Route' | '10-7 Standby';
  speedKmH: number;
  batteryPct: number;
  fuelPct: number;
  radioChannel: string;
  lat: number;
  lng: number;
  destination?: string;
  etaMin?: number;
}

interface TacticalCheckpoint {
  id: number;
  name: string;
  lat: number;
  lng: number;
  scanned: boolean;
  time?: string;
}

interface MapSiteData {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  guardsCount: number;
  status: 'normal' | 'alert' | 'overdue';
  activeWand: string;
  lastScan: string;
  geofenceRadius: number; // in meters
  checkpoints: TacticalCheckpoint[];
  notes?: string;
  clientContactName?: string;
  clientPhone?: string;
}

// Standard South African coordinates for Tikedi / DutyOn operational sites
const DEFAULT_SITE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'site-provincial-office': { lat: -32.3567, lng: 22.5833 }, // Provincial Government Complex, Beaufort West
  'site-zebra-mountains': { lat: -32.2472, lng: 25.4981 }, // Cradock / Mountain Zebra
  'site-ganzekraal-resort': { lat: -33.5186, lng: 18.3242 }, // West Coast Resort
  'site-jankempsdorp': { lat: -27.9192, lng: 24.8322 }, // Jan Kempdorp Northern Cape
  'site-national-lottery': { lat: -28.7380, lng: 24.7640 }, // Kimberley Central Hub
  'site-khwamagxaki': { lat: -33.8650, lng: 25.5420 }, // Khwamagxaki Facility
  'site-lindsy': { lat: -33.9312, lng: 25.5910 }, // Lindsy Logistics
  'site-cape-town-national-library': { lat: -33.9268, lng: 18.4194 }, // National Library & Centre for Book
  'site-54-york-street': { lat: -33.9630, lng: 22.4610 }, // 54 York Street, George
  'site-sarao': { lat: -30.7128, lng: 21.4438 }, // SARAO Karoo Facility
  'site-mossel-bay': { lat: -34.1831, lng: 22.1460 }, // Mossel Bay Facility
  'site-saao': { lat: -33.9348, lng: 18.4770 } // SAAO Cape Town Observatory
};

export const DesktopLiveMap: React.FC = () => {
  const {
    sites: contextSites,
    fleetVehicles,
    officersList,
    incidents,
    userLocation,
    officer: currentOfficerUser,
    dispatchArmedBackupToSite,
    setSelectedOfficerForModal,
    setSelectedIncidentForModal,
    setControlRoomTab,
    showToast
  } = useDutyOn();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const guardMarkerRef = useRef<L.Marker | null>(null);

  // Multi-Location Radar Selection: 'all' for metropolitan radar, or specific site id
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');

  // Layer switches
  const [showVehicles, setShowVehicles] = useState(true);
  const [showCheckpoints, setShowCheckpoints] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showOfficers, setShowOfficers] = useState(true);
  const [nightVisionMode, setNightVisionMode] = useState(false);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);

  // Selected item details drawer on map
  const [selectedSite, setSelectedSite] = useState<MapSiteData | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<ResponseVehicle | null>(null);

  // Patrol walkthrough simulation state
  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);
  const [walkProgress, setWalkProgress] = useState(0); // 0 to 100

  // Standardize sites with real-world GPS coordinates
  const allMapSites: MapSiteData[] = useMemo(() => {
    if (!contextSites || contextSites.length === 0) {
      return [
        {
          id: 'site-deal-party',
          name: 'Deal Party Logistics & Rail Hub',
          category: 'Industrial Precinct',
          lat: -33.9210,
          lng: 25.6180,
          guardsCount: 6,
          status: 'normal',
          activeWand: 'Sefeko Wand #DP-1002',
          lastScan: '4 mins ago (North Rail Gate)',
          geofenceRadius: 18,
          checkpoints: [
            { id: 1, name: 'Main Gate Access Boom', lat: -33.9208, lng: 25.6178, scanned: true, time: '23:38' },
            { id: 2, name: 'Container Yard Perimeter', lat: -33.9212, lng: 25.6184, scanned: true, time: '23:42' },
            { id: 3, name: 'Rail Siding Sensor Point', lat: -33.9215, lng: 25.6176, scanned: false }
          ]
        }
      ];
    }

    return contextSites.map((cs, idx) => {
      // Prioritize existing lat/lng, then fallback map, then pseudo-scattered SA coordinates
      const fallback = DEFAULT_SITE_COORDINATES[cs.id] || {
        lat: -33.9400 - (idx * 0.025),
        lng: 25.5900 + ((idx * 0.03) % 0.12)
      };

      const siteLat = (cs.coords as any)?.lat || (cs as any).lat || fallback.lat;
      const siteLng = (cs.coords as any)?.lng || (cs as any).lng || fallback.lng;
      const geofence = cs.geofenceRadius || 18;

      // Realistic checkpoint offsets in meters around site (roughly 0.00015 deg ~ 16m)
      const checkpoints: TacticalCheckpoint[] = (cs.checkpoints && cs.checkpoints.length > 0)
        ? cs.checkpoints.map((cp, cIdx) => ({
            id: cp.id,
            name: cp.name,
            lat: siteLat + (Math.sin(cIdx * 1.5) * 0.00018),
            lng: siteLng + (Math.cos(cIdx * 1.5) * 0.00018),
            scanned: cp.scanned,
            time: cp.time
          }))
        : [
            { id: 1, name: 'Main Gate Access Boom', lat: siteLat - 0.00014, lng: siteLng - 0.00012, scanned: true, time: '23:35' },
            { id: 2, name: 'Perimeter East Electric Fence', lat: siteLat + 0.00015, lng: siteLng + 0.00014, scanned: true, time: '23:42' },
            { id: 3, name: 'Sefeko RFID Checkpoint 03', lat: siteLat + 0.00008, lng: siteLng - 0.00016, scanned: false },
            { id: 4, name: 'Loading Bay & Turnstile', lat: siteLat - 0.00011, lng: siteLng + 0.00015, scanned: false }
          ];

      return {
        id: cs.id,
        name: cs.name,
        category: cs.category || 'Protected Site',
        lat: siteLat,
        lng: siteLng,
        guardsCount: cs.officersPresent || 0,
        status: cs.status === 'critical' ? 'alert' : cs.status === 'attention' ? 'overdue' : 'normal',
        activeWand: 'Sefeko Wand #SF-' + (1000 + idx),
        lastScan: cs.patrolStatus || 'Active Guard Roster',
        geofenceRadius: geofence,
        checkpoints,
        notes: cs.notes,
        clientContactName: cs.clientContactName,
        clientPhone: cs.clientPhone
      };
    });
  }, [contextSites]);

  // Map fleet vehicles with GPS locations
  const mappedVehicles: ResponseVehicle[] = useMemo(() => {
    if (!fleetVehicles || fleetVehicles.length === 0) {
      // Default tactical response vehicles near first site
      const baseLat = allMapSites[0]?.lat || -33.9210;
      const baseLng = allMapSites[0]?.lng || 25.6180;
      return [
        {
          id: 'v-alpha-1',
          callSign: 'Alpha-01 Tactical',
          vehicleModel: 'Toyota Hilux 2.8 GD-6 4x4',
          crew: 'Constable D. Ndlovu (Armed)',
          status: '10-8 Available',
          speedKmH: 0,
          batteryPct: 98,
          fuelPct: 88,
          radioChannel: 'VHF Tactical Ch 01',
          lat: baseLat + 0.002,
          lng: baseLng - 0.0025,
          destination: 'Standby Perimeter Patrol'
        },
        {
          id: 'v-bravo-2',
          callSign: 'Bravo-02 Rapid Response',
          vehicleModel: 'Ford Ranger 2.0 Bi-Turbo',
          crew: 'Sgt. M. Van Wyk & K9 Unit',
          status: '10-23 En Route',
          speedKmH: 54,
          batteryPct: 92,
          fuelPct: 76,
          radioChannel: 'VHF Tactical Ch 02',
          lat: baseLat - 0.0035,
          lng: baseLng + 0.004,
          destination: 'Deal Party Sector Alert',
          etaMin: 2
        }
      ];
    }

    return fleetVehicles.map((fv, idx) => {
      const parentSite = allMapSites[idx % allMapSites.length];
      const vLat = (fv as any).lat || parentSite?.lat + (0.0018 * (idx + 1)) || -33.9200;
      const vLng = (fv as any).lng || parentSite?.lng - (0.0022 * (idx + 1)) || 25.6150;

      return {
        id: fv.id,
        callSign: fv.callSign || `Unit ${idx + 1}`,
        vehicleModel: fv.model || `${fv.make} Armed Response`,
        crew: fv.assignedDriver || 'Armed Patrol Crew',
        status: (fv.status === 'on_patrol' ? '10-23 En Route' : fv.status === 'standby' ? '10-7 Standby' : '10-8 Available') as any,
        speedKmH: fv.status === 'on_patrol' ? 48 : 0,
        batteryPct: fv.batteryLevel || 94,
        fuelPct: fv.fuelLevel || 82,
        radioChannel: fv.radioChannel || 'VHF Tactical Ch 01',
        lat: vLat,
        lng: vLng,
        destination: fv.currentSite || 'Regional Escort Patrol',
        etaMin: fv.status === 'on_patrol' ? 3 : undefined
      };
    });
  }, [fleetVehicles, allMapSites]);

  const [vehicles, setVehicles] = useState<ResponseVehicle[]>(mappedVehicles);

  useEffect(() => {
    setVehicles(mappedVehicles);
  }, [mappedVehicles]);

  // Current focused site if a specific location is selected
  const focusedSite = useMemo(() => {
    if (selectedLocationId === 'all') return null;
    return allMapSites.find((s) => s.id === selectedLocationId) || null;
  }, [selectedLocationId, allMapSites]);

  // 1. INITIALIZE LEAFLET MAP
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = [allMapSites[0].lat, allMapSites[0].lng];
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB Dark Matter tile layer for sleek tactical dark mode
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Add clean zoom control top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapInstanceRef.current = map;

      // Invalidate size once rendered
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    return () => {
      // cleanup is handled on unmount
    };
  }, [allMapSites]);

  // 2. RENDER LAYERS ON MAP
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    // 2.1 GEOFENCES & SITES
    allMapSites.forEach((site) => {
      const isFocused = focusedSite?.id === site.id;
      const isAlert = site.status === 'alert';

      // 18m High-Precision Geofence Boundary Circle
      if (showGeofences) {
        const fenceCircle = L.circle([site.lat, site.lng], {
          radius: site.geofenceRadius || 18,
          color: isAlert ? '#E0574B' : isFocused ? '#3FC9E9' : '#1FA6C9',
          fillColor: isAlert ? '#E0574B' : '#1FA6C9',
          fillOpacity: isFocused ? 0.22 : 0.12,
          weight: isFocused ? 2.5 : 1.5,
          dashArray: isFocused ? '4, 4' : '3, 5'
        });

        fenceCircle.bindTooltip(
          `<strong>${site.name}</strong><br/>Exact Geofence: ${site.geofenceRadius}m Perimeter PASS`,
          { className: 'leaflet-tactical-tooltip', direction: 'top' }
        );

        layers.addLayer(fenceCircle);
      }

      // Site Tactical Marker
      const siteIconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute w-8 h-8 rounded-full ${
            isAlert
              ? 'bg-rose-500/30 animate-ping'
              : isFocused
              ? 'bg-[#3FC9E9]/40 animate-pulse'
              : 'bg-[#1FA6C9]/25'
          }"></div>
          <div class="w-7 h-7 rounded-xl flex items-center justify-center border shadow-lg transition-transform group-hover:scale-110 ${
            isAlert
              ? 'bg-[#0A1E33] border-rose-500 text-rose-400'
              : isFocused
              ? 'bg-[#071726] border-[#3FC9E9] text-[#3FC9E9]'
              : 'bg-[#0A1E33] border-[#1FA6C9]/60 text-white'
          }">
            <span style="font-size: 13px;">${isAlert ? '🚨' : '🏢'}</span>
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-[#071726]/90 border border-white/10 text-[9.5px] font-mono-code font-bold text-white shadow-md pointer-events-none">
            ${site.name.split(' ')[0]} · ${site.guardsCount}G
          </div>
        </div>
      `;

      const siteIcon = L.divIcon({
        className: 'custom-site-marker',
        html: siteIconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const siteMarker = L.marker([site.lat, site.lng], { icon: siteIcon });
      siteMarker.on('click', () => {
        setSelectedSite(site);
        setSelectedVehicle(null);
        setSelectedLocationId(site.id);
        map.flyTo([site.lat, site.lng], 18, { duration: 1.2 });
      });

      layers.addLayer(siteMarker);

      // 2.2 CHECKPOINTS FOR THIS SITE
      if (showCheckpoints && (isFocused || selectedLocationId === 'all')) {
        // Draw route line if breadcrumbs enabled
        if (showBreadcrumbs && site.checkpoints.length > 1) {
          const routePoints: [number, number][] = site.checkpoints.map((cp) => [cp.lat, cp.lng]);
          routePoints.push(routePoints[0]); // loop back to first point

          const routeLine = L.polyline(routePoints, {
            color: isFocused ? '#3FC9E9' : '#1FA6C9',
            weight: 2,
            opacity: 0.6,
            dashArray: '4, 4'
          });
          layers.addLayer(routeLine);
        }

        // Checkpoint markers
        site.checkpoints.forEach((cp) => {
          const cpHtml = `
            <div class="relative flex items-center justify-center cursor-pointer" title="${cp.name}">
              <div class="w-3.5 h-3.5 rounded-full border border-[#0A1E33] shadow ${
                cp.scanned ? 'bg-[#5BCB80]' : 'bg-amber-400 animate-pulse'
              }"></div>
            </div>
          `;

          const cpIcon = L.divIcon({
            className: 'custom-cp-marker',
            html: cpHtml,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });

          const cpMarker = L.marker([cp.lat, cp.lng], { icon: cpIcon });
          cpMarker.bindPopup(`
            <div style="font-family: system-ui; font-size: 11px; color: #042430; padding: 2px;">
              <strong>RFID Checkpoint:</strong> ${cp.name}<br/>
              Status: <b>${cp.scanned ? `Scanned (${cp.time || 'Verified'})` : 'Pending Sweep'}</b><br/>
              Geofence Radius: 18m Secure
            </div>
          `);
          layers.addLayer(cpMarker);
        });
      }
    });

    // 2.3 OFFICERS ON DUTY (from officersList)
    if (showOfficers && officersList && officersList.length > 0) {
      officersList.forEach((officer, oIdx) => {
        // Find matching site or fallback
        const matchingSite = allMapSites.find((s) => {
          const sName = s.name.toLowerCase();
          const oSite = (officer.siteDeployed || officer.currentSite || '').toLowerCase();
          return oSite.includes(sName) || sName.includes(oSite);
        }) || allMapSites[oIdx % allMapSites.length];

        const isCurrentAdmin = (officer.email === 'tshepomaloa@gmail.com' || officer.id === 'off-admin');
        const customCoords = (isCurrentAdmin && userLocation)
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : officer.coords;

        const oLat = customCoords ? customCoords.lat : (matchingSite.lat + ((Math.sin(oIdx * 1.8) * 0.00010)));
        const oLng = customCoords ? customCoords.lng : (matchingSite.lng + ((Math.cos(oIdx * 1.8) * 0.00010)));

        const officerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" title="${officer.name} (${officer.grade}) · ${isCurrentAdmin ? 'Admin Director Lock' : officer.currentSite}">
            <div class="w-5 h-5 rounded-full border-2 ${isCurrentAdmin ? 'border-amber-400' : 'border-white'} shadow-md bg-[#0A1E33] text-[9px] flex items-center justify-center text-[#3FC9E9] font-bold font-mono-code overflow-hidden">
              ${officer.photoUrl ? `<img src="${officer.photoUrl}" class="w-full h-full object-cover"/>` : officer.name.slice(0, 2).toUpperCase()}
            </div>
            <div class="absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${
              officer.isClockedIn || officer.status === 'on-duty' ? 'bg-[#5BCB80]' : 'bg-slate-400'
            } border border-[#0A1E33]"></div>
          </div>
        `;

        const officerIcon = L.divIcon({
          className: 'custom-officer-marker',
          html: officerHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const officerMarker = L.marker([oLat, oLng], { icon: officerIcon });
        officerMarker.on('click', () => {
          setSelectedOfficerForModal(officer);
          showToast(`Opened profile for Officer ${officer.name} (${officer.grade})`);
        });

        layers.addLayer(officerMarker);
      });
    }

    // 2.4 REAL-TIME ACTIVE INCIDENTS (Linked directly to Incident Queue)
    if (incidents && incidents.length > 0) {
      incidents.filter((inc) => (inc.status || 'open') !== 'resolved').forEach((inc) => {
        let iLat: number | null = null;
        let iLng: number | null = null;

        if (inc.coordinates) {
          if (typeof inc.coordinates === 'object') {
            iLat = inc.coordinates.lat;
            iLng = inc.coordinates.lng;
          } else if (typeof inc.coordinates === 'string') {
            const parts = inc.coordinates.split(',').map((s) => parseFloat(s.trim()));
            if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              iLat = parts[0];
              iLng = parts[1];
            }
          }
        }

        if (iLat === null || iLng === null) {
          const sMatch = allMapSites.find((s) => 
            s.name.toLowerCase().includes((inc.site || '').toLowerCase()) || 
            (inc.site || '').toLowerCase().includes(s.name.toLowerCase())
          );
          if (sMatch) {
            iLat = sMatch.lat + 0.00015;
            iLng = sMatch.lng - 0.00012;
          }
        }

        if (iLat !== null && iLng !== null) {
          const isCritical = inc.priority.toUpperCase() === 'HIGH' || inc.priority.toUpperCase() === 'CRITICAL';
          const incHtml = `
            <div class="relative flex items-center justify-center cursor-pointer group" title="Docket #${inc.id}: ${inc.category}">
              <div class="absolute w-8 h-8 rounded-full ${isCritical ? 'bg-rose-500/40' : 'bg-amber-500/40'} animate-ping"></div>
              <div class="w-7 h-7 rounded-xl ${isCritical ? 'bg-rose-600 border-rose-400' : 'bg-amber-600 border-amber-400'} border-2 flex items-center justify-center text-white shadow-xl text-xs font-bold">
                ${isCritical ? '🚨' : '⚠️'}
              </div>
              <div class="absolute -bottom-4 whitespace-nowrap px-1.5 py-0.5 rounded bg-black/90 border border-white/20 text-[9px] font-mono-code ${isCritical ? 'text-rose-400 font-bold' : 'text-amber-300'}">
                ${inc.category.slice(0, 16)}…
              </div>
            </div>
          `;

          const incIcon = L.divIcon({
            className: 'custom-incident-marker',
            html: incHtml,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const incMarker = L.marker([iLat, iLng], { icon: incIcon });
          incMarker.on('click', () => {
            setSelectedIncidentForModal(inc);
            setControlRoomTab('incidents');
            showToast(`Opened Case Docket #${inc.id} in Incident Queue`);
          });

          layers.addLayer(incMarker);
        }
      });
    }

    // 2.5 LOGGED-IN ADMIN REAL GPS LOCK
    if (userLocation) {
      const userGpsHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" title="Your Verified Device GPS Lock (${userLocation.address || 'Real-time'})">
          <div class="absolute w-9 h-9 rounded-full bg-cyan-400/30 animate-ping"></div>
          <div class="w-6 h-6 rounded-full bg-[#0B1E30] border-2 border-[#3FC9E9] text-[#3FC9E9] flex items-center justify-center text-[11px] shadow-xl font-bold">
            👤
          </div>
          <div class="absolute -bottom-4 whitespace-nowrap px-1.5 py-0.5 rounded bg-black/90 border border-[#3FC9E9]/40 text-[9px] font-mono-code text-[#3FC9E9]">
            Admin GPS Lock
          </div>
        </div>
      `;

      const userGpsIcon = L.divIcon({
        className: 'custom-admin-gps-marker',
        html: userGpsHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const userGpsMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userGpsIcon });
      userGpsMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px;">
          <b>Admin / Director Real Device GPS</b><br/>
          Latitude: ${userLocation.lat.toFixed(4)}<br/>
          Longitude: ${userLocation.lng.toFixed(4)}<br/>
          Status: Verified Device Geolocation Lock
        </div>
      `);
      layers.addLayer(userGpsMarker);
    }

    // 2.6 ARMED TACTICAL VEHICLES
    if (showVehicles) {
      vehicles.forEach((veh) => {
        const isEnRoute = veh.status === '10-23 En Route';
        const vehHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute w-7 h-7 rounded-full ${isEnRoute ? 'bg-sky-400/30 animate-ping' : 'bg-[#1FA6C9]/20'}"></div>
            <div class="w-6 h-6 rounded-lg bg-[#071726] border ${
              isEnRoute ? 'border-sky-400' : 'border-[#1FA6C9]'
            } flex items-center justify-center shadow-lg text-[11px]">
              🚓
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap px-1 py-0.2 rounded bg-[#071726] border border-white/10 text-[9px] font-mono-code text-[#3FC9E9]">
              ${veh.callSign.split(' ')[0]} · ${veh.speedKmH}km/h
            </div>
          </div>
        `;

        const vehIcon = L.divIcon({
          className: 'custom-vehicle-marker',
          html: vehHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const vehMarker = L.marker([veh.lat, veh.lng], { icon: vehIcon });
        vehMarker.on('click', () => {
          setSelectedVehicle(veh);
          setSelectedSite(null);
          map.flyTo([veh.lat, veh.lng], 17, { duration: 1 });
        });

        layers.addLayer(vehMarker);
      });
    }
  }, [
    allMapSites,
    focusedSite,
    selectedLocationId,
    showGeofences,
    showCheckpoints,
    showBreadcrumbs,
    showOfficers,
    showVehicles,
    officersList,
    vehicles,
    incidents,
    userLocation,
    setSelectedOfficerForModal,
    setSelectedIncidentForModal,
    setControlRoomTab,
    showToast
  ]);

  // 3. ZOOM / FIT TO SELECTED LOCATION
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedLocationId === 'all') {
      if (allMapSites.length > 1) {
        const bounds = L.latLngBounds(allMapSites.map((s) => [s.lat, s.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } else if (allMapSites.length === 1) {
        map.setView([allMapSites[0].lat, allMapSites[0].lng], 15);
      }
    } else if (selectedLocationId === 'my_gps' && userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 1.2 });
    } else {
      const site = allMapSites.find((s) => s.id === selectedLocationId);
      if (site) {
        map.flyTo([site.lat, site.lng], 18, { duration: 1.2 });
      }
    }
  }, [selectedLocationId, allMapSites, userLocation]);

  // 4. ANIMATED PATROL TOUR SIMULATION
  useEffect(() => {
    let animTimer: any;
    if (isSimulatingWalk) {
      animTimer = setInterval(() => {
        setWalkProgress((prev) => {
          if (prev >= 100) {
            setIsSimulatingWalk(false);
            showToast('✓ Patrol tour walkthrough completed with 100% checkpoint verification!');
            return 0;
          }
          return prev + 2;
        });
      }, 250);
    }
    return () => clearInterval(animTimer);
  }, [isSimulatingWalk, showToast]);

  // Animate guard on active route
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    if (!map || !layers) return;

    const activeSite = focusedSite || allMapSites[0];
    if (!activeSite || !activeSite.checkpoints || activeSite.checkpoints.length < 2) return;

    if (!isSimulatingWalk) {
      if (guardMarkerRef.current) {
        layers.removeLayer(guardMarkerRef.current);
        guardMarkerRef.current = null;
      }
      return;
    }

    const waypoints = activeSite.checkpoints.map((cp) => [cp.lat, cp.lng] as [number, number]);
    waypoints.push(waypoints[0]);

    const currentSegment = Math.min(
      waypoints.length - 2,
      Math.floor((walkProgress / 100) * (waypoints.length - 1))
    );
    const segmentProgress = ((walkProgress / 100) * (waypoints.length - 1)) % 1;
    const p1 = waypoints[currentSegment];
    const p2 = waypoints[currentSegment + 1];

    const currentLat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
    const currentLng = p1[1] + (p2[1] - p1[1]) * segmentProgress;

    const guardIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-6 h-6 rounded-full bg-amber-400/40 animate-ping absolute"></div>
        <div class="w-6 h-6 rounded-full bg-[#0A1E33] border-2 border-amber-400 text-xs flex items-center justify-center shadow-xl">
          👮
        </div>
      </div>
    `;

    const guardIcon = L.divIcon({
      className: 'patrol-sim-marker',
      html: guardIconHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    if (!guardMarkerRef.current) {
      guardMarkerRef.current = L.marker([currentLat, currentLng], { icon: guardIcon });
      layers.addLayer(guardMarkerRef.current);
    } else {
      guardMarkerRef.current.setLatLng([currentLat, currentLng]);
    }
  }, [isSimulatingWalk, walkProgress, focusedSite, allMapSites]);

  // Handle Location Switch
  const handleSelectLocation = (locationId: string) => {
    setSelectedLocationId(locationId);
    if (locationId === 'all') {
      setSelectedSite(null);
      showToast('Switched radar to Metropolitan Tactical Overview');
    } else if (locationId === 'my_gps') {
      setSelectedSite(null);
      setSelectedVehicle(null);
      if (userLocation) {
        const map = mapInstanceRef.current;
        if (map) map.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 1.2 });
        showToast('Radar centered on your live device GPS location');
      } else {
        showToast('Acquiring device GPS position lock...');
      }
    } else {
      const site = allMapSites.find((s) => s.id === locationId);
      if (site) {
        setSelectedSite(site);
        setSelectedVehicle(null);
        showToast(`Tactical Radar zoomed to ${site.name} (18m Geofence Active)`);
      }
    }
  };

  const handleDispatchVehicle = (vehicle: ResponseVehicle, destinationName: string) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicle.id
          ? {
              ...v,
              status: '10-23 En Route',
              destination: `${destinationName} (Emergency Code 10)`,
              speedKmH: 68,
              etaMin: 2
            }
          : v
      )
    );
    setSelectedVehicle((prev) =>
      prev && prev.id === vehicle.id
        ? {
            ...prev,
            status: '10-23 En Route',
            destination: `${destinationName} (Emergency Code 10)`,
            speedKmH: 68,
            etaMin: 2
          }
        : prev
    );
    if (selectedSite) {
      dispatchArmedBackupToSite(selectedSite.id);
    }
    showToast(`🚨 Dispatched unit ${vehicle.callSign} to ${destinationName}!`);
  };

  return (
    <div className="flex flex-col bg-[#0A1E33] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      {/* 1. PRIMARY MULTI-LOCATION RADAR SELECTION BAR */}
      <div className="p-3 bg-[#051424] border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        {/* Dropdown Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 font-display font-extrabold text-[#3FC9E9] text-xs shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1FA6C9] animate-pulse" />
            <span>RADAR LOCATION:</span>
          </div>

          <div className="relative min-w-[260px] sm:min-w-[320px]">
            <select
              value={selectedLocationId}
              onChange={(e) => handleSelectLocation(e.target.value)}
              className="w-full bg-[#0A1E33] border border-[#1FA6C9]/40 hover:border-[#1FA6C9] text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1FA6C9] transition-all cursor-pointer shadow-inner"
            >
              <option value="all">🌐 All Locations (Metropolitan Tactical Radar Sector)</option>
              {userLocation && (
                <option value="my_gps">
                  📍 My Live GPS Location ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
                </option>
              )}
              <optgroup label="─── Live Monitored Sites ───">
                {allMapSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.status === 'alert' ? '🚨' : site.status === 'overdue' ? '⚠️' : '🟢'}{' '}
                    {site.name} ({site.category} · {site.guardsCount} Guards · 18m Geofence)
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {focusedSite && (
            <button
              onClick={() => handleSelectLocation('all')}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono-code text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              title="Return to full metropolitan radar view"
            >
              <span>↺</span> Reset to Metro View
            </button>
          )}
        </div>

        {/* Quick Location Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <button
            onClick={() => handleSelectLocation('all')}
            className={`px-2.5 py-1 rounded-lg font-mono-code text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
              selectedLocationId === 'all'
                ? 'bg-[#1FA6C9] text-[#042430] border-[#1FA6C9] shadow-md shadow-[#1FA6C9]/20'
                : 'bg-white/5 text-[#8598A8] border-white/10 hover:border-white/20'
            }`}
          >
            🌐 All Sites
          </button>

          {allMapSites.map((site) => {
            const isSelected = selectedLocationId === site.id;
            return (
              <button
                key={site.id}
                onClick={() => handleSelectLocation(site.id)}
                className={`px-2.5 py-1 rounded-lg font-mono-code text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#1FA6C9] text-[#042430] border-[#1FA6C9] shadow-md shadow-[#1FA6C9]/20'
                    : site.status === 'alert'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                    : site.status === 'overdue'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-white/5 text-[#8598A8] border-white/10 hover:border-white/20'
                }`}
              >
                <span>{site.status === 'alert' ? '🚨' : site.status === 'overdue' ? '⚠️' : '🟢'}</span>
                <span>{site.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SECONDARY TACTICAL CONTROL STRIP (Layers & Tour Replay) */}
      <div className="p-2.5 sm:p-3 bg-[#071726]/80 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        {/* Left: Layer Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto py-0.5 shrink-0">
          <span className="font-mono-code text-[11px] text-[#8598A8] font-bold mr-1 flex-none">
            LAYERS:
          </span>

          <button
            onClick={() => setShowVehicles(!showVehicles)}
            className={`px-2 py-1 rounded-lg font-mono-code text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap flex-none ${
              showVehicles
                ? 'bg-[#1FA6C9]/20 text-[#3FC9E9] border-[#1FA6C9]/40'
                : 'bg-white/5 text-[#8598A8] border-white/10 opacity-60'
            }`}
          >
            🚓 Armed Units ({vehicles.length})
          </button>

          <button
            onClick={() => setShowOfficers(!showOfficers)}
            className={`px-2 py-1 rounded-lg font-mono-code text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap flex-none ${
              showOfficers
                ? 'bg-[#3AA655]/20 text-[#5BCB80] border-[#3AA655]/40'
                : 'bg-white/5 text-[#8598A8] border-white/10 opacity-60'
            }`}
          >
            👮 Guard Personnel ({officersList.length})
          </button>

          <button
            onClick={() => setShowCheckpoints(!showCheckpoints)}
            className={`px-2 py-1 rounded-lg font-mono-code text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap flex-none ${
              showCheckpoints
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 text-[#8598A8] border-white/10 opacity-60'
            }`}
          >
            📍 RFID Points
          </button>

          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`px-2 py-1 rounded-lg font-mono-code text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap flex-none ${
              showGeofences
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-white/5 text-[#8598A8] border-white/10 opacity-60'
            }`}
          >
            🌐 18m Geofences
          </button>

          <button
            onClick={() => setShowBreadcrumbs(!showBreadcrumbs)}
            className={`px-2 py-1 rounded-lg font-mono-code text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap flex-none ${
              showBreadcrumbs
                ? 'bg-[#1FA6C9]/20 text-[#3FC9E9] border-[#1FA6C9]/40'
                : 'bg-white/5 text-[#8598A8] border-white/10 opacity-60'
            }`}
          >
            👣 Tour Paths
          </button>

          <button
            onClick={() => setNightVisionMode(!nightVisionMode)}
            className={`px-2 py-1 rounded-lg font-mono-code text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap flex-none ${
              nightVisionMode
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                : 'bg-white/5 text-[#8598A8] border-white/10'
            }`}
            title="Toggle high-contrast tactical night vision palette"
          >
            {nightVisionMode ? '🟢 FLIR Night-Vision' : '⚫ Standard Dark'}
          </button>
        </div>

        {/* Right: Patrol Replay Simulation Controller */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-[#0A1E33] border border-white/10 rounded-xl px-2.5 py-1">
            <span className="text-[11px] text-[#8598A8] font-semibold hidden sm:inline">
              Tour Replay:
            </span>
            <button
              onClick={() => {
                if (isSimulatingWalk) {
                  setIsSimulatingWalk(false);
                } else {
                  setIsSimulatingWalk(true);
                  if (walkProgress >= 100) setWalkProgress(0);
                  showToast(
                    `Initiating GPS patrol route simulation for ${focusedSite?.name || 'Sector'}...`
                  );
                }
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                isSimulatingWalk
                  ? 'bg-amber-500 text-[#071726]'
                  : 'bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430]'
              }`}
            >
              <span>{isSimulatingWalk ? '⏸ Pause' : '▶ Play Patrol Walk'}</span>
            </button>

            {walkProgress > 0 && (
              <button
                onClick={() => {
                  setWalkProgress(0);
                  setIsSimulatingWalk(false);
                }}
                className="text-[11px] text-[#8598A8] hover:text-white px-1 cursor-pointer"
                title="Reset simulation"
              >
                ↺
              </button>
            )}

            <div className="font-mono-code text-[11px] text-[#3FC9E9]">
              {walkProgress}%
            </div>
          </div>
        </div>
      </div>

      {/* 3. LEAFLET RADAR CANVAS */}
      <div className="relative h-[360px] sm:h-[460px] w-full overflow-hidden select-none">
        {/* On-Map HUD Indicator */}
        {focusedSite ? (
          <div className="absolute top-3 left-3 z-[1000] bg-[#071726]/90 backdrop-blur-md border border-[#1FA6C9]/40 rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs shadow-lg animate-fade-in pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-[#3FC9E9] animate-ping" />
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{focusedSite.name}</span>
                <span className="text-[9px] bg-[#1FA6C9]/20 text-[#3FC9E9] px-1.5 py-0.2 rounded font-mono-code">
                  18m Geofence Active
                </span>
              </div>
              <div className="text-[10px] text-[#8598A8] font-mono-code">
                {focusedSite.guardsCount} Guards · {focusedSite.activeWand}
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute top-3 left-3 z-[1000] bg-[#071726]/80 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1 text-[11px] text-[#8598A8] font-mono-code flex items-center gap-2 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>METROPOLITAN SECTOR · {allMapSites.length} PROTECTED SITES LIVE</span>
          </div>
        )}

        {/* Real Leaflet Map Container with Night-Vision Filter Support */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full transition-all duration-500 ${
            nightVisionMode ? 'brightness-95 contrast-125 hue-rotate-[90deg] saturate-150' : ''
          }`}
          style={{ minHeight: '360px' }}
        />
      </div>

      {/* 4. SELECTED ITEM DETAILS DRAWER */}
      {(selectedSite || selectedVehicle) && (
        <div className="p-4 bg-[#071726] border-t border-white/10 animate-fade-in text-xs">
          {selectedSite && (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-sm text-white">
                      {selectedSite.name}
                    </span>
                    <span
                      className={`font-mono-code text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedSite.status === 'alert'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : selectedSite.status === 'overdue'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {selectedSite.status.toUpperCase()}
                    </span>
                    {selectedLocationId === selectedSite.id && (
                      <span className="text-[10px] bg-[#1FA6C9]/20 text-[#3FC9E9] px-2 py-0.5 rounded-full font-mono-code font-bold">
                        CURRENT RADAR FOCUS
                      </span>
                    )}
                  </div>
                  <div className="text-[#8598A8] text-[11px] mt-0.5">
                    {selectedSite.category} · Exact Geofence: <strong className="text-[#3FC9E9]">{selectedSite.geofenceRadius}m</strong> · Active Wand: {selectedSite.activeWand}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedLocationId !== selectedSite.id && (
                    <button
                      onClick={() => handleSelectLocation(selectedSite.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#1FA6C9]/20 text-[#3FC9E9] hover:bg-[#1FA6C9]/30 text-xs font-bold cursor-pointer"
                    >
                      Focus Radar Here
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedSite(null)}
                    className="text-[#8598A8] hover:text-white text-xs px-2 py-1 rounded bg-white/5 cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Site Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-[#8598A8]">Officers on Post</div>
                  <div className="font-display font-bold text-sm text-white">
                    {selectedSite.guardsCount} Guards
                  </div>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-[#8598A8]">RFID Checkpoints</div>
                  <div className="font-display font-bold text-sm text-[#3FC9E9]">
                    {selectedSite.checkpoints.filter((c) => c.scanned).length} / {selectedSite.checkpoints.length} Scanned
                  </div>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-[#8598A8]">Geofence Perimeter</div>
                  <div className="font-display font-bold text-xs text-[#5BCB80]">
                    18m Boundary PASS
                  </div>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex items-center justify-center">
                  <button
                    onClick={() => {
                      const availableVehicle = vehicles.find((v) => v.status === '10-8 Available') || vehicles[0];
                      handleDispatchVehicle(availableVehicle, selectedSite.name);
                    }}
                    className="w-full bg-[#E0574B] hover:bg-rose-600 text-white font-bold text-[11px] py-2 rounded-lg transition-all cursor-pointer shadow-lg shadow-rose-600/20"
                  >
                    🚨 Dispatch Armed Unit
                  </button>
                </div>
              </div>

              {/* Checkpoint list for this site */}
              <div className="bg-[#0A1E33] p-2.5 rounded-xl border border-white/10 space-y-1.5">
                <div className="text-[11px] font-bold text-[#8598A8] uppercase tracking-wider flex items-center justify-between">
                  <span>RFID Patrol Route Points:</span>
                  <span className="text-[#3FC9E9]">{selectedSite.checkpoints.length} Verification Tags</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedSite.checkpoints.map((cp) => (
                    <div
                      key={cp.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cp.scanned ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        <span className="text-white font-medium">{cp.name}</span>
                      </div>
                      <span className="text-[10px] font-mono-code text-[#8598A8]">
                        {cp.scanned ? `Scanned ${cp.time || 'OK'}` : 'Pending tag scan'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedVehicle && (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-white">
                      🚓 {selectedVehicle.callSign} ({selectedVehicle.id})
                    </span>
                    <span
                      className={`font-mono-code text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedVehicle.status === '10-23 En Route'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {selectedVehicle.status}
                    </span>
                  </div>
                  <div className="text-[#8598A8] text-[11px] mt-0.5">
                    {selectedVehicle.vehicleModel} · Crew: {selectedVehicle.crew}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-[#8598A8] hover:text-white text-xs px-2 py-1 rounded bg-white/5 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Vehicle Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-[#8598A8]">Road Speed</div>
                  <div className="font-display font-bold text-sm text-white font-mono-code">
                    {selectedVehicle.speedKmH} km/h
                  </div>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-[#8598A8]">Fuel &amp; Battery</div>
                  <div className="font-display font-bold text-sm text-[#5BCB80] font-mono-code">
                    {selectedVehicle.fuelPct}% Fuel · {selectedVehicle.batteryPct}%
                  </div>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-[#8598A8]">Radio Patch</div>
                  <div className="font-display font-bold text-xs text-[#3FC9E9] truncate font-mono-code">
                    {selectedVehicle.radioChannel}
                  </div>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex items-center justify-center gap-1.5">
                  <button
                    onClick={() =>
                      showToast(`Hailing ${selectedVehicle.callSign} over ${selectedVehicle.radioChannel}…`)
                    }
                    className="flex-1 bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-bold text-[11px] py-2 rounded-lg transition-all cursor-pointer"
                  >
                    📻 Hail Radio
                  </button>
                </div>
              </div>

              {selectedVehicle.destination && (
                <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between text-xs text-sky-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                    <span>Destination: <strong>{selectedVehicle.destination}</strong></span>
                  </div>
                  <div className="font-mono-code font-bold">
                    ETA: ~{selectedVehicle.etaMin || 3} mins
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
