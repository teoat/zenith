import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { ShieldAlert, MapPin, Loader } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { secureLogger } from '../../utils/secureLogger';

// Lazy load the map components to reduce bundle size
const Map = React.lazy(() =>
  import('react-map-gl/maplibre').then(module => ({ default: module.Map }))
);
const Marker = React.lazy(() =>
  import('react-map-gl/maplibre').then(module => ({ default: module.Marker }))
);
const Popup = React.lazy(() =>
  import('react-map-gl/maplibre').then(module => ({ default: module.Popup }))
);
const NavigationControl = React.lazy(() =>
  import('react-map-gl/maplibre').then(module => ({ default: module.NavigationControl }))
);
const FullscreenControl = React.lazy(() =>
  import('react-map-gl/maplibre').then(module => ({ default: module.FullscreenControl }))
);

// Lazy load CSS
const loadMapLibreCSS = () => {
  if (!document.querySelector('link[href*="maplibre-gl"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/maplibre-gl@4.1.0/dist/maplibre-gl.css';
    document.head.appendChild(link);
  }
};

// Interfaces for Threat Data
interface ThreatLocation {
  id: string;
  lat: number;
  lng: number;
  riskScore: number;
  city: string;
  country: string;
  description: string;
}

interface RawThreatData {
  lat: number;
  lng: number;
  intensity: number;
  type: string;
}

const ThreatMap: React.FC = () => {
  // All hooks must be called before any conditional logic
  const [threats, setThreats] = useState<ThreatLocation[]>([]);
  const [popupInfo, setPopupInfo] = useState<ThreatLocation | null>(null);
  const [viewState, setViewState] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 1.5
  });
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  // Feature flag to completely disable map functionality
  const isMapEnabled = import.meta.env.VITE_ENABLE_THREAT_MAP !== 'false';

  // Detect slow network connections
  useEffect(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      setIsSlowConnection(true);
    }
  }, []);

  // Show static view for slow connections
  if (isSlowConnection) {
    return (
      <div className="h-full w-full bg-slate-800 rounded-xl p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <ShieldAlert className="text-red-500" size={24} />
          <h3 className="text-lg font-medium text-white">Threat Monitor</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {threats.slice(0, 10).map(threat => (
              <div key={threat.id} className="bg-slate-700 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-medium">{threat.city}</div>
                    <div className="text-slate-400 text-sm">
                      Risk: {threat.riskScore}/100
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    threat.riskScore >= 80 ? 'bg-red-600 text-white' :
                    threat.riskScore >= 60 ? 'bg-amber-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {threat.riskScore >= 80 ? 'Critical' :
                     threat.riskScore >= 60 ? 'High' : 'Medium'}
                  </div>
                </div>
              </div>
            ))}
            {threats.length === 0 && (
              <div className="text-center text-slate-400 py-8">
                <Loader className="mx-auto mb-2 animate-spin" size={24} />
                Loading threat data...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Load MapLibre CSS dynamically
  useEffect(() => {
    loadMapLibreCSS();
  }, []);

  // Fetch threat locations from backend
  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const response = await fetch('/api/v1/stats/locations');
        if (response.ok) {
          const data = await response.json();
          // Map backend format to component format
          setThreats(data.map((t: RawThreatData, i: number) => ({
            id: String(i),
            lat: t.lat,
            lng: t.lng,
            riskScore: Math.round(t.intensity * 100),
            city: t.type === 'blocked' ? 'Blocked' : 'Active',
            country: '',
            description: `Type: ${t.type}`
          })));
        }
       } catch (error) { 
        secureLogger.error('Failed to load threat data', error);
      }
    };
    fetchThreats();
  }, []);

  // Calculate risk-based Tailwind class
  const getRiskClass = (score: number) => {
    if (score >= 90) return 'bg-red-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const markers = useMemo(() => threats.map(city => (
    <Marker
      key={city.id}
      longitude={city.lng}
      latitude={city.lat}
      anchor="bottom"
      onClick={e => {
        // If we let the click propagate to the map, it will immediately close the popup
        // with the onClick event of the map
        e.originalEvent.stopPropagation();
        setPopupInfo(city);
      }}
    >
      <div className="relative group cursor-pointer">
        {/* Pulse Effect */}
        <span 
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${getRiskClass(city.riskScore)}`}
        ></span>
        
        {/* Icon */}
        <div 
          className={`relative text-white p-2 rounded-full shadow-lg transform transition group-hover:scale-110 ${getRiskClass(city.riskScore)}`}
        >
          <MapPin size={20} fill="currentColor" />
        </div>
      </div>
    </Marker>
  )), [threats]);

  // Feature flag to completely disable map functionality
  if (!isMapEnabled) {
    return (
      <div className="h-full w-full bg-slate-800 rounded-xl flex items-center justify-center">
        <div className="text-center text-slate-400">
          <ShieldAlert size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Map Disabled</h3>
          <p className="text-sm">Threat monitoring map has been disabled</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-900 relative flex items-center justify-center">
        <div className="text-center text-slate-400">
          <Loader className="mx-auto mb-2 animate-spin" size={24} />
          <p>Loading threat map...</p>
        </div>
      </div>
    }>
      <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-900 relative">
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur px-4 py-2 rounded-lg border border-slate-700 text-white shadow-xl">
        <h3 className="font-bold flex items-center gap-2">
          <ShieldAlert className="text-red-500 animate-pulse" size={18} />
          Global Threat Monitor
        </h3>
        <p className="text-xs text-slate-400">Live Transaction Activity</p>
      </div>

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapLib={maplibregl}
        onError={(e) => secureLogger.error("Map Error:", e)}
      >
        <NavigationControl position="bottom-right" />
        <FullscreenControl position="bottom-right" />

        {markers}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            onClose={() => setPopupInfo(null)}
            className="text-black"
          >
            <div className="p-2 min-w-[200px]">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-900">{popupInfo.city}, {popupInfo.country}</h4>
                <span 
                  className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${getRiskClass(popupInfo.riskScore)}`}
                >
                  Risk: {popupInfo.riskScore}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{popupInfo.description}</p>
              <button 
                className="w-full text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded transition"
                onClick={() => alert(`Drill down into ${popupInfo.city}`)}
              >
                Inspect Region
              </button>
            </div>
          </Popup>
        )}
      </Map>

      {/* Fallback Overlay if no token */}
      {!import.meta.env.VITE_MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none z-0">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center max-w-md pointer-events-auto">
            <h4 className="text-white font-bold mb-2">Mapbox Token Missing</h4>
            <p className="text-slate-400 text-sm mb-4">
              Please add <code>VITE_MAPBOX_TOKEN</code> to your <code>.env</code> file to enable the live threat map.
            </p>
            <div className="text-xs text-slate-500 bg-slate-900 p-2 rounded">
              Current Mode: Visualization Placeholder
            </div>
          </div>
        </div>
      )}
      </div>
    </Suspense>
  );
};

export default ThreatMap;
