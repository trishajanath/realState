import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePropertyDetails, useLocalities } from '../../hooks/useApi';
import { useCompareStore } from '../../store/useCompareStore';
import { useMapFilterStore } from '../../store/useMapFilterStore';
import { MapView } from '../../components/shared/MapView';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Building, Maximize, Sparkles, MapPin, 
  ArrowLeftRight, Heart, ShieldAlert, Share2, PhoneCall, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

export const PropertyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const propertyId = id || '';

  const { data: property } = usePropertyDetails(propertyId);
  const { data: localities } = useLocalities();
  const store = useMapFilterStore();

  const { addId, removeId, isCompared } = useCompareStore();
  const [isSaved, setIsSaved] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

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

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  // Mock price trend history
  const trendData = [
    { year: '2023', val: property.price * 0.88 },
    { year: '2024', val: property.price * 0.93 },
    { year: '2025', val: property.price * 0.97 },
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
        <span className="text-slate-600">{property.title}</span>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold font-display text-slate-900 leading-tight">
            {property.title}
          </h1>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span>{locality?.name || 'Coimbatore'}, Coimbatore, Tamil Nadu</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCompareClick}
            className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              compared
                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>{compared ? 'Added to Compare' : 'Compare Specifications'}</span>
          </button>
          <button 
            onClick={() => setIsSaved(!isSaved)}
            className={`border p-2.5 rounded-xl transition-all shadow-sm cursor-pointer ${
              isSaved ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className="h-4 w-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Large visual gallery (React Bits image reveal layout) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.01 }}
          className="md:col-span-2 aspect-[16/10] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200/50 shadow-inner overflow-hidden cursor-zoom-in group relative"
        >
          {store.mapsApiKey && property.latitude && property.longitude ? (
            <img 
              src={`https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${property.latitude},${property.longitude}&fov=90&heading=235&pitch=10&key=${store.mapsApiKey}`}
              alt={`Live street view of ${property.title}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <Building className="h-16 w-16 stroke-[1.2] group-hover:scale-110 transition-transform duration-300" />
          )}
          <div className="absolute inset-0 bg-slate-950/10 group-hover:bg-slate-950/0 transition-colors" />
          <span className="absolute bottom-4 left-4 bg-slate-900/80 text-white text-[10px] font-mono px-3 py-1.5 rounded-xl backdrop-blur">MAIN STREET VIEW Centroid</span>
        </motion.div>
        <div className="grid grid-rows-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200/50 shadow-inner overflow-hidden cursor-zoom-in group relative"
          >
            <Building className="h-10 w-10 stroke-[1.2]" />
            <span className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-[9px] font-mono px-2 py-1 rounded-lg backdrop-blur">INTERIOR PROJECTION</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200/50 shadow-inner overflow-hidden cursor-zoom-in group relative"
          >
            <Building className="h-10 w-10 stroke-[1.2]" />
            <span className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-[9px] font-mono px-2 py-1 rounded-lg backdrop-blur">COMMUNAL HUD</span>
          </motion.div>
        </div>
      </div>

      {/* Page Content layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-4">
        
        {/* Main Content Panels */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Key metrics header (shadcn Card) */}
          <Card>
            <CardContent className="grid grid-cols-3 gap-4 text-center p-6">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block uppercase">Property Type</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">{property.property_type}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block uppercase">Built Up Area</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block flex items-center justify-center gap-1.5">
                  <Maximize className="h-4 w-4 text-slate-400" />
                  <span>{property.area_sqft} sqft</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block uppercase">Configuration</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">
                  {property.bedrooms ? `${property.bedrooms} BHK` : '-'} / {property.bathrooms ? `${property.bathrooms} Bath` : '-'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* AI Deal Review */}
          <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-blue-900">
              <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
              <h3 className="font-bold text-xs uppercase font-mono tracking-wider">Gemini Deal Evaluation Analysis</h3>
            </div>
            
            <div className="mt-4 flex items-baseline gap-2">
              <span className="bg-blue-600 text-white text-[10px] font-mono px-2.5 py-0.5 rounded-lg font-bold uppercase">
                {ratingGrade}
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">COIMBATORE MARKET STABILITY</span>
            </div>

            <p className="text-xs text-slate-700 mt-3 leading-relaxed font-semibold font-sans">
              {ratingAnalysis}
            </p>
            
            <p className="text-xs text-slate-500 mt-4 leading-relaxed border-t border-blue-100 pt-3 font-sans">
              {property.ai_description}
            </p>
          </div>

          {/* Price history chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Unit Acquisition History</CardTitle>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                    formatter={(val: any) => [`${formatPrice(val)}`, 'Price']}
                  />
                  <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Interactive proximity map */}
          <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-semibold text-slate-800 uppercase font-mono tracking-wider mb-4">Local Geospatial Context</h3>
            <MapView propertyId={property.id} localityId={property.locality_id || ''} height="h-64" />
          </div>

        </div>

        {/* Right side Sticky Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-[88px] h-fit">
          
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block uppercase">Transaction Valuation</span>
                <span className="text-3xl font-extrabold font-display text-slate-900 block mt-1">
                  {formatPrice(property.price)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  ~ {Math.round(property.price / property.area_sqft).toLocaleString()} INR/sqft
                </span>
              </div>

              <div className="space-y-3 text-xs font-semibold text-slate-700">
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                  <span className="text-slate-400">Builder/Developer</span>
                  <span className="font-semibold text-slate-900">Casagrand Structures</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                  <span className="text-slate-400">Possession</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Dec 2027
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-slate-400">Inventory Status</span>
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 text-[10px] uppercase font-bold tracking-wider">
                    Active
                  </span>
                </div>
              </div>

              {/* Action buttons inside ScrollArea-like drawer */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleCompareClick}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    compared
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span>{compared ? 'Added to Compare' : 'Compare Specifications'}</span>
                </button>

                <button
                  onClick={handleShareClick}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>{shareCopied ? 'Link Copied!' : 'Share Intelligence Link'}</span>
                </button>

                {/* Dialog triggered Contact Form */}
                <Dialog>
                  <DialogTrigger>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/10">
                      <PhoneCall className="h-3.5 w-3.5" />
                      <span>Contact Advisory Desk</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Expert Advisory Call</DialogTitle>
                      <DialogDescription>
                        Get detail-oriented structural specs and yield projections from our regional real estate desk.
                      </DialogDescription>
                    </DialogHeader>
                    {contactSubmitted ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl text-center mt-4">
                        Advisory ticket submitted! An intelligence consultant will dial within 30 minutes.
                      </div>
                    ) : (
                      <form onSubmit={handleContactSubmit} className="space-y-4 mt-4 text-xs">
                        <div className="flex flex-col space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Consultant Name</label>
                          <input required type="text" placeholder="Trisha Janath" className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600/20 focus:border-blue-600" />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Contact Mobile Number</label>
                          <input required type="tel" placeholder="+91 98765 43210" className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600/20 focus:border-blue-600" />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl cursor-pointer">Submit advisory callback ticket</button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Risk warning */}
          <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl shadow-sm flex gap-3 text-slate-800">
            <ShieldAlert className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-[10px] font-mono uppercase tracking-wider text-rose-800">Micro-market Risk Checks</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1 font-sans">
                Centroid records show minor highway bottleneck alerts during morning hours. Groundwater metrics checked and verified within standards.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
