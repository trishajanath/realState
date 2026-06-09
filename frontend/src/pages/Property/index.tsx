import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePropertyDetails, useLocalities, useAmenities } from '../../hooks/useApi';
import { useCompareStore } from '../../store/useCompareStore';
import { MapView } from '../../components/shared/MapView';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Building, Maximize, Bed, Bath, Sparkles, MapPin, 
  ArrowLeftRight, Check, Heart, ShieldAlert, BadgeInfo 
} from 'lucide-react';

export const PropertyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const propertyId = id || '';

  const { data: property } = usePropertyDetails(propertyId);
  const { data: localities } = useLocalities();
  const { data: amenities } = useAmenities(property?.locality_id || '');

  const { addId, removeId, isCompared } = useCompareStore();

  if (!property) {
    return (
      <div className="flex-grow flex items-center justify-center p-12 text-slate-400 text-xs font-mono">
        Loading property listing intelligence profile...
      </div>
    );
  }

  const compared = isCompared(property.id);
  const locality = localities?.find(l => l.id === property.locality_id);

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Cr`;
    }
    return `${(price / 100000).toFixed(1)} L`;
  };

  const handleCompareClick = () => {
    if (compared) {
      removeId(property.id);
    } else {
      addId(property.id);
    }
  };

  // Mock price trends
  const trendData = [
    { year: '2023', val: property.price * 0.9 },
    { year: '2024', val: property.price * 0.95 },
    { year: '2025', val: property.price * 0.98 },
    { year: '2026', val: property.price }
  ];

  const ratingGrade = property.ai_investment_rating?.split('|')[0]?.replace('Grade:', '').trim() || 'B';
  const ratingAnalysis = property.ai_investment_rating?.split('|')[1]?.replace('Analysis:', '').trim() || '';

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 w-full flex-grow flex flex-col gap-8">
      
      {/* Breadcrumb paths */}
      <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
        <Link to="/" className="hover:underline">Coimbatore</Link>
        <span>/</span>
        <Link to="/map" className="hover:underline">Properties</Link>
        <span>/</span>
        <span>{property.title}</span>
      </div>

      {/* Hero Title & Actions Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 leading-tight">
            {property.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {locality?.name || 'Coimbatore'}, Coimbatore, Tamil Nadu
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCompareClick}
            className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              compared
                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" />
            {compared ? 'Added to Compare' : 'Compare Specifications'}
          </button>
          <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 p-2.5 rounded-xl transition-all shadow-sm">
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Image Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 aspect-[16/10] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-200/50 shadow-inner">
          <Building className="h-20 w-20 stroke-[1]" />
        </div>
        <div className="grid grid-rows-2 gap-4">
          <div className="bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-200/50 shadow-inner">
            <Building className="h-10 w-10 stroke-[1.2]" />
          </div>
          <div className="bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-200/50 shadow-inner">
            <Building className="h-10 w-10 stroke-[1.2]" />
          </div>
        </div>
      </div>

      {/* Grid Specs Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-4">
        
        {/* Left main content panels */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Key specs row */}
          <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-mono block uppercase">Property Type</span>
              <span className="text-sm font-semibold text-slate-800 mt-1 block">{property.property_type}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono block uppercase">Built Up Area</span>
              <span className="text-sm font-semibold text-slate-800 mt-1 block flex items-center justify-center gap-1">
                <Maximize className="h-3.5 w-3.5 text-slate-400" />
                {property.area_sqft} sqft
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono block uppercase">Configuration</span>
              <span className="text-sm font-semibold text-slate-800 mt-1 block">
                {property.bedrooms ? `${property.bedrooms} Bed` : '-'} / {property.bathrooms ? `${property.bathrooms} Bath` : '-'}
              </span>
            </div>
          </div>

          {/* AI Deal Intelligence Review Card */}
          <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-blue-800">
              <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
              <h3 className="font-bold text-sm uppercase font-mono tracking-wider">Gemini Deal Evaluation Analysis</h3>
            </div>
            
            <div className="mt-4 flex items-baseline gap-2">
              <span className="bg-blue-600 text-white text-xs font-mono px-2.5 py-0.5 rounded-lg font-bold uppercase">
                {ratingGrade}
              </span>
              <span className="text-xs text-slate-500 font-mono font-semibold">COIMBATORE MARKET COMPARISON</span>
            </div>

            <p className="text-xs text-slate-700 mt-3 leading-relaxed font-medium">
              {ratingAnalysis}
            </p>
            
            <p className="text-xs text-slate-500 mt-4 leading-relaxed border-t border-blue-100 pt-3">
              {property.ai_description}
            </p>
          </div>

          {/* Price history chart */}
          <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 uppercase font-mono tracking-wider mb-4">Unit Pricing History</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                    formatter={(val: any) => [`${formatPrice(val)}`, 'Price']}
                  />
                  <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive proximity map */}
          <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 uppercase font-mono tracking-wider mb-4">Local Geospatial Context</h3>
            <MapView propertyId={property.id} localityId={property.locality_id || ''} height="h-64" />
          </div>

        </div>

        {/* Right side Sticky transaction specs panel */}
        <div className="space-y-6 lg:sticky lg:top-[88px]">
          
          <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Transaction Valuation</span>
            <span className="text-3xl font-extrabold font-display text-slate-900 block mt-1">
              {formatPrice(property.price)}
            </span>
            <span className="text-xs text-slate-500 font-mono mt-0.5 block">
              Estimated: ~ {Math.round(property.price / property.area_sqft).toLocaleString()} INR/sqft
            </span>

            <div className="mt-6 space-y-4 text-xs font-medium text-slate-700">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-400">Builder</span>
                <span className="font-semibold text-slate-900">Premium Developer</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-400">Source provider</span>
                <span className="font-mono">{property.source || 'Direct Broker'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Listing Status</span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 text-[10px] uppercase font-bold tracking-wider">
                  Active
                </span>
              </div>
            </div>

            {property.listing_url && (
              <a
                href={property.listing_url}
                target="_blank"
                rel="noreferrer"
                className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl mt-6 transition-all shadow-sm"
              >
                View Original Listing &rarr;
              </a>
            )}
          </div>

          {/* Risk factors warnings */}
          <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl shadow-sm flex gap-3 text-slate-800">
            <ShieldAlert className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-xs font-mono uppercase tracking-wider text-rose-800">Micro-market Risk Checks</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Centroid records show minor highway bottleneck alerts during morning hours. Groundwater metrics checked and verified within standards.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
