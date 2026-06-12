import React, { useState } from 'react';
import { mockLocalities, mockProperties } from '../../services/mockData';
import { Navigation, Compass, Layers, Shield, TrendingUp, Radio } from 'lucide-react';

interface MapViewProps {
  localityId?: string;
  propertyId?: string;
  height?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  localityId,
  propertyId,
  height = 'h-[500px]'
}) => {
  const [activeLayer, setActiveLayer] = useState<'pins' | 'heatmap' | 'safety' | 'none'>('pins');
  const [selectedLoc, setSelectedLoc] = useState<any>(
    localityId ? mockLocalities.find(l => l.id === localityId) : null
  );

  // Filter properties in selected locality
  const propertiesToDisplay = propertyId 
    ? mockProperties.filter(p => p.id === propertyId)
    : selectedLoc 
      ? mockProperties.filter(p => p.locality_id === selectedLoc.id)
      : mockProperties;

  // Grid coordinates map
  // Coimbatore bounds approximately (76.90 to 77.06 Longitude, 10.98 to 11.09 Latitude)
  const mapWidth = 800;
  const mapHeight = 500;

  const latToY = (lat: number | undefined | null) => {
    const minLat = 10.99;
    const maxLat = 11.09;
    const l = lat || 11.02;
    const y = ((maxLat - l) / (maxLat - minLat)) * mapHeight;
    return Math.max(20, Math.min(mapHeight - 20, y));
  };

  const lonToX = (lon: number | undefined | null) => {
    const minLon = 76.93;
    const maxLon = 77.05;
    const l = lon || 77.00;
    const x = ((l - minLon) / (maxLon - minLon)) * mapWidth;
    return Math.max(20, Math.min(mapWidth - 20, x));
  };

  return (
    <div className={`relative w-full ${height} bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden shadow-inner`}>
      
      {/* Dynamic Grid Background representing Coimbatore map */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <style>{`
        .bg-grid {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, #cbd5e1 1px, transparent 1px),
                            linear-gradient(to bottom, #cbd5e1 1px, transparent 1px);
        }
      `}</style>

      {/* SVG Canvas Map Layers */}
      <svg className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing">
        {/* Heatmap overlay gradients */}
        {activeLayer === 'heatmap' && (
          <g opacity="0.6">
            {mockLocalities.map((loc) => {
              const x = lonToX(loc.longitude);
              const y = latToY(loc.latitude);
              return (
                <g key={`heat-${loc.id}`}>
                  <defs>
                    <radialGradient id={`grad-${loc.id}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.45" />
                      <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx={x} cy={y} r="120" fill={`url(#grad-${loc.id})`} />
                </g>
              );
            })}
          </g>
        )}

        {/* Safety overlay gradients */}
        {activeLayer === 'safety' && (
          <g opacity="0.55">
            {mockLocalities.map((loc, idx) => {
              const x = lonToX(loc.longitude);
              const y = latToY(loc.latitude);
              const color = idx % 2 === 0 ? '#10b981' : '#f59e0b'; // Alternating green and orange for safety indicators
              return (
                <g key={`safety-${loc.id}`}>
                  <defs>
                    <radialGradient id={`safe-grad-${loc.id}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                      <stop offset="60%" stopColor={color} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx={x} cy={y} r="100" fill={`url(#safe-grad-${loc.id})`} />
                </g>
              );
            })}
          </g>
        )}

        {/* Connections / Road mock-lines */}
        <g stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 4" fill="none">
          {mockLocalities.map((loc, idx) => {
            if (idx === mockLocalities.length - 1) return null;
            const nextLoc = mockLocalities[idx + 1];
            return (
              <line 
                key={`line-${idx}`} 
                x1={lonToX(loc.longitude)} 
                y1={latToY(loc.latitude)} 
                x2={lonToX(nextLoc.longitude)} 
                y2={latToY(nextLoc.latitude)} 
              />
            );
          })}
        </g>

        {/* Locality Centroids Overlay */}
        <g>
          {mockLocalities.map((loc) => {
            const x = lonToX(loc.longitude);
            const y = latToY(loc.latitude);
            const isSelected = selectedLoc?.id === loc.id;
            return (
              <g 
                key={`loc-${loc.id}`} 
                onClick={() => setSelectedLoc(loc)}
                className="cursor-pointer group"
              >
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isSelected ? 10 : 6} 
                  fill={isSelected ? '#2563eb' : '#94a3b8'} 
                  className="transition-all duration-300 group-hover:scale-125"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isSelected ? 18 : 12} 
                  fill="none" 
                  stroke={isSelected ? '#2563eb' : '#cbd5e1'} 
                  strokeWidth="1" 
                  opacity={isSelected ? 0.4 : 0.2}
                  className="animate-ping"
                  style={{ animationDuration: '3s' }}
                />
              </g>
            );
          })}
        </g>

        {/* Property Pin Markers */}
        <g>
          {propertiesToDisplay.map((prop) => {
            if (!prop.latitude || !prop.longitude) return null;
            const x = lonToX(prop.longitude);
            const y = latToY(prop.latitude);
            return (
              <g key={`prop-pin-${prop.id}`} className="cursor-pointer">
                <circle cx={x} cy={y - 8} r="14" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
                <path 
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                  fill="#2563eb"
                  transform={`translate(${x - 12}, ${y - 20}) scale(1)`}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Map Navigation HUD Controls */}
      <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur px-3 py-2.5 rounded-2xl border border-slate-200/60 shadow-lg flex items-center gap-4 text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1"><Compass className="h-4 w-4 text-slate-400" /> N 11.0° | E 77.0°</span>
        <span className="h-4 w-px bg-slate-200" />
        <span className="flex items-center gap-1"><Navigation className="h-4 w-4 text-blue-600 animate-pulse" /> Coimbatore, IN</span>
      </div>

      {/* Layers Switch Control HUD */}
      <div className="absolute top-5 right-5 bg-white/95 backdrop-blur p-2 rounded-2xl border border-slate-200/60 shadow-lg flex flex-col gap-1 z-30">
        <button 
          onClick={() => setActiveLayer('pins')}
          className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${activeLayer === 'pins' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Layers className="h-4 w-4" />
          <span>Properties</span>
        </button>
        <button 
          onClick={() => setActiveLayer('heatmap')}
          className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${activeLayer === 'heatmap' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Price Heatmap</span>
        </button>
        <button 
          onClick={() => setActiveLayer('safety')}
          className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${activeLayer === 'safety' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Shield className="h-4 w-4" />
          <span>Safety Index</span>
        </button>
      </div>

      {/* Selected Centroid Details Popover card */}
      {selectedLoc && (
        <div className="absolute bottom-5 right-5 w-72 bg-white/95 backdrop-blur p-4 rounded-2xl border border-slate-200/60 shadow-lg z-30 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-slate-900 text-sm font-display">{selectedLoc.name}</h4>
              <p className="text-[10px] text-slate-500 font-mono">Centroid: {selectedLoc.latitude.toFixed(4)}, {selectedLoc.longitude.toFixed(4)}</p>
            </div>
            <button 
              onClick={() => setSelectedLoc(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              Close
            </button>
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-2 text-center border-t border-slate-100 pt-3">
            <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200/30">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Median Price</span>
              <span className="text-xs font-semibold text-slate-800 font-mono">4,300/sqft</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200/30">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">IT Proximity</span>
              <span className="text-xs font-semibold text-slate-800 font-mono">&lt; 1.5 km</span>
            </div>
          </div>
          
          <div className="mt-3">
            <a 
              href={`/locality/${selectedLoc.id}`}
              className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-xl transition-all shadow-sm"
            >
              Analyze Neighborhood
            </a>
          </div>
        </div>
      )}

      {/* Hotspots pulse sensor HUD (representing live websocket feeds or changes) */}
      <div className="absolute top-5 left-5 bg-white/95 backdrop-blur px-3 py-2 rounded-xl border border-slate-200/50 shadow flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-600">
        <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
        <span>Live geospatial sensor active</span>
      </div>
    </div>
  );
};
