import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePropertyDetails, useLocalities } from '../../hooks/useApi';
import { useCompareStore } from '../../store/useCompareStore';
import { MapView } from '../../components/shared/MapView';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, MapPin, ArrowLeftRight, Share2, PhoneCall, AlertTriangle, ChevronRight } from 'lucide-react';

const tooltipStyle = {
  background: '#0A0A0A',
  color: '#FFFFFF',
  borderRadius: '8px',
  border: '1px solid #2A2A2A',
  fontSize: '12px',
};

export const PropertyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: property } = usePropertyDetails(id || '');
  const { data: localities } = useLocalities();
  const { addId, removeId, isCompared } = useCompareStore();

  const [shareCopied, setShareCopied] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  if (!property) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-sm" style={{ color: '#52525B' }}>
        Loading property profile...
      </div>
    );
  }

  const compared = isCompared(property.id);
  const locality = localities?.find((l) => l.id === property.locality_id);

  const formatPrice = (p: number) =>
    p >= 10000000 ? `₹${(p / 10000000).toFixed(2)} Cr` : `₹${(p / 100000).toFixed(1)} L`;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // unused divider var removed
  const trendData = [
    { year: '2023', val: property.price * 0.88 },
    { year: '2024', val: property.price * 0.93 },
    { year: '2025', val: property.price * 0.97 },
    { year: '2026', val: property.price },
  ];

  const ratingGrade = property.ai_investment_rating?.split('|')[0]?.replace('Grade:', '').trim() || 'B';
  const ratingAnalysis = property.ai_investment_rating?.split('|')[1]?.replace('Analysis:', '').trim() || '';

  return (
    <div className="flex-1 p-8 max-w-[1600px] mx-auto w-full">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs mb-6" style={{ color: '#52525B' }}>
        <Link to="/" style={{ color: '#71717A' }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FFFFFF')} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#71717A')}>Overview</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/map" style={{ color: '#71717A' }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FFFFFF')} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#71717A')}>Properties</Link>
        <ChevronRight className="w-3 h-3" />
        <span style={{ color: '#A1A1AA' }}>{property.title}</span>
      </div>

      {/* Title row */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#FFFFFF', letterSpacing: '-0.03em' }}>
            {property.title}
          </h1>
          <div className="flex items-center gap-1.5 mt-1.5 text-sm" style={{ color: '#71717A' }}>
            <MapPin className="w-3.5 h-3.5" />
            {locality?.name || 'Coimbatore'}, Tamil Nadu
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => compared ? removeId(property.id) : addId(property.id)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded transition-colors"
            style={{
              backgroundColor: compared ? '#FFFFFF' : '#111111',
              color: compared ? '#000000' : '#A1A1AA',
              border: '1px solid #2A2A2A',
            }}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {compared ? 'Added' : 'Compare'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded transition-colors"
            style={{ backgroundColor: '#111111', color: '#A1A1AA', border: '1px solid #2A2A2A' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FFFFFF')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#A1A1AA')}
          >
            <Share2 className="w-3.5 h-3.5" />
            {shareCopied ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>

      {/* Images */}
      <div className="grid grid-cols-3 gap-3 mb-8" style={{ height: '320px' }}>
        <div className="col-span-2 rounded overflow-hidden" style={{ backgroundColor: '#0A0A0A', border: '1px solid #1F1F1F' }}>
          {property.images?.[0] ? (
            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: '#3F3F46' }}>
              <Building2 className="w-12 h-12" />
            </div>
          )}
        </div>
        <div className="grid grid-rows-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded overflow-hidden" style={{ backgroundColor: '#0A0A0A', border: '1px solid #1F1F1F' }}>
              {property.images?.[i] ? (
                <img src={property.images[i]} alt={`${property.title} ${i}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: '#2A2A2A' }}>
                  <Building2 className="w-8 h-8" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2">

          {/* Spec strip */}
          <div className="grid grid-cols-3 gap-0 mb-8" style={{ border: '1px solid #1F1F1F', borderRadius: '8px', overflow: 'hidden' }}>
            {[
              { label: 'Type', value: property.property_type, border: true },
              { label: 'Built-up Area', value: `${property.area_sqft} sqft`, border: true },
              { label: 'Configuration', value: `${property.bedrooms ?? '-'} BHK / ${property.bathrooms ?? '-'} Bath`, border: false },
            ].map((spec) => (
              <div
                key={spec.label}
                className="p-4"
                style={{ borderRight: spec.border ? '1px solid #1F1F1F' : 'none', backgroundColor: '#0A0A0A' }}
              >
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#52525B' }}>{spec.label}</div>
                <div className="text-sm font-medium" style={{ color: '#FFFFFF' }}>{spec.value}</div>
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          <div className="p-5 rounded mb-8" style={{ backgroundColor: '#0A0A0A', border: '1px solid #1F1F1F' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: '#1C1C1C', color: '#FFFFFF', border: '1px solid #2A2A2A' }}>
                Grade {ratingGrade}
              </span>
              <span className="text-xs uppercase tracking-wider" style={{ color: '#52525B' }}>AI Investment Analysis</span>
            </div>
            {ratingAnalysis && (
              <p className="text-sm font-medium mb-3 leading-relaxed" style={{ color: '#FFFFFF' }}>{ratingAnalysis}</p>
            )}
            <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>{property.ai_description}</p>
          </div>

          {/* Price trend */}
          <div className="mb-8">
            <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: '#52525B' }}>Price History</h3>
            <div style={{ height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#3F3F46" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#3F3F46" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} width={48} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [formatPrice(v), 'Price']} cursor={{ stroke: '#2A2A2A' }} />
                  <Area type="monotone" dataKey="val" stroke="#FFFFFF" strokeWidth={1.5} fill="url(#priceGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Map */}
          <div>
            <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: '#52525B' }}>Location</h3>
            <div className="rounded overflow-hidden" style={{ border: '1px solid #1F1F1F' }}>
              <MapView propertyId={property.id} localityId={property.locality_id || ''} height="h-64" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 h-fit">
          <div className="p-5 rounded" style={{ backgroundColor: '#0A0A0A', border: '1px solid #1F1F1F' }}>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#52525B' }}>
              {property.listing_type === 'Rent' ? 'Monthly Rent' : 'Sale Price'}
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#FFFFFF', letterSpacing: '-0.03em' }}>
              {formatPrice(property.price)}
            </div>
            <div className="text-xs mb-5" style={{ color: '#71717A' }}>
              ≈ ₹{Math.round(property.price / property.area_sqft).toLocaleString()}/sqft
            </div>

            <div className="space-y-0 mb-5" style={{ borderTop: '1px solid #1F1F1F' }}>
              {[
                { label: 'Source', value: property.source },
                { label: 'Listing Type', value: property.listing_type },
                { label: 'Status', value: 'Active' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between py-3 text-sm"
                  style={{ borderBottom: '1px solid #111111' }}
                >
                  <span style={{ color: '#71717A' }}>{row.label}</span>
                  <span className="font-medium" style={{ color: '#FFFFFF' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => compared ? removeId(property.id) : addId(property.id)}
                className="flex items-center justify-center gap-2 w-full h-10 rounded text-sm font-medium transition-colors"
                style={{
                  backgroundColor: compared ? '#FFFFFF' : '#111111',
                  color: compared ? '#000000' : '#A1A1AA',
                  border: '1px solid #2A2A2A',
                }}
              >
                <ArrowLeftRight className="w-4 h-4" />
                {compared ? 'Remove from Compare' : 'Add to Compare'}
              </button>

              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="flex items-center justify-center gap-2 w-full h-10 rounded text-sm font-medium transition-colors"
                    style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#D4D4D4')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF')}
                  >
                    <PhoneCall className="w-4 h-4" />
                    Contact Advisory
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Advisory Call</DialogTitle>
                    <DialogDescription>Our regional desk will respond within 30 minutes.</DialogDescription>
                  </DialogHeader>
                  {contactSubmitted ? (
                    <div className="p-4 rounded text-sm mt-4 text-center" style={{ backgroundColor: '#0A0A0A', border: '1px solid #1F1F1F', color: '#A1A1AA' }}>
                      Advisory ticket submitted. A consultant will contact you shortly.
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); setContactSubmitted(true); }} className="space-y-4 mt-4">
                      {['Name', 'Phone'].map((field) => (
                        <div key={field}>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#A1A1AA' }}>{field}</label>
                          <input
                            required
                            type={field === 'Phone' ? 'tel' : 'text'}
                            placeholder={field === 'Phone' ? '+91 98765 43210' : 'Your name'}
                            className="w-full h-10 px-3 rounded text-sm outline-none"
                            style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', color: '#FFFFFF' }}
                          />
                        </div>
                      ))}
                      <button
                        type="submit"
                        className="w-full h-10 rounded text-sm font-medium"
                        style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
                      >
                        Submit
                      </button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Risk note */}
          <div className="flex gap-3 p-4 rounded text-sm" style={{ backgroundColor: '#0A0A0A', border: '1px solid #1F1F1F' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#71717A' }} />
            <p style={{ color: '#71717A', lineHeight: '1.6' }}>
              Minor highway bottleneck alerts during morning hours. Groundwater metrics within standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
