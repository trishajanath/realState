import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapView } from '../../components/shared/MapView';
import { Select, SelectTrigger, SelectContent, SelectItem } from '../../components/ui/Select';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../components/ui/Accordion';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../components/ui/Sheet';
import { useLocalities, useProperties } from '../../hooks/useApi';
import { Compass, Filter, Sparkles, Building, Map, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { data: localities } = useLocalities();
  const { data: properties } = useProperties();

  // Filters State
  const [selectedType, setSelectedType] = useState('All Configurations');
  const [maxPrice, setMaxPrice] = useState(350); // in Lakhs
  const [selectedLayer, setSelectedLayer] = useState<'pins' | 'heatmap' | 'safety'>('pins');
  const [selectedLocality, setSelectedLocality] = useState<string>('all');
  
  // Amenities flags
  const [nearSchool, setNearSchool] = useState(false);
  const [nearHospital, setNearHospital] = useState(false);

  // Set active search query if passed from search bar
  useEffect(() => {
    if (initialQuery && localities) {
      const matched = localities.find(l => l.name.toLowerCase().includes(initialQuery.toLowerCase()));
      if (matched) {
        setSelectedLocality(matched.id);
      }
    }
  }, [initialQuery, localities]);

  // Filters logical application
  const filteredProperties = properties?.filter((prop) => {
    // 1. Locality Filter
    if (selectedLocality !== 'all' && prop.locality_id !== selectedLocality) return false;
    
    // 2. Type Configuration Filter
    if (selectedType !== 'All Configurations') {
      const bhkVal = selectedType.split(' ')[0]; // e.g. "3" from "3 BHK"
      if (prop.bedrooms && prop.bedrooms.toString() !== bhkVal) return false;
    }

    // 3. Price Filter (maxPrice is in Lakhs, prop.price is in INR)
    const priceLakhs = prop.price / 100000;
    if (priceLakhs > maxPrice) return false;

    return true;
  }) || [];

  const getLocalityName = (localityId?: string | null) => {
    return localities?.find(l => l.id === localityId)?.name || 'Coimbatore';
  };

  const desktopSidebar = (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <div className="h-8 w-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
          <Compass className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-extrabold text-sm font-display text-slate-900 leading-none">Geospatial GIS Console</h2>
          <p className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">Map filters & Layers</p>
        </div>
      </div>

      <Accordion>
        {/* Category: Map Layers */}
        <AccordionItem value="layers">
          <AccordionTrigger>Geospatial Overlays</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2.5">
              <button
                onClick={() => setSelectedLayer('pins')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer transition-all ${
                  selectedLayer === 'pins' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Active Listings Pins</span>
                <Building className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setSelectedLayer('heatmap')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer transition-all ${
                  selectedLayer === 'heatmap' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Price Trend Heatmap</span>
                <Map className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setSelectedLayer('safety')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer transition-all ${
                  selectedLayer === 'safety' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Safety Index Overlay</span>
                <ShieldAlert className="h-3.5 w-3.5" />
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Category: Filters */}
        <AccordionItem value="filters">
          <AccordionTrigger>Valuation & Location</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {/* Locality Select */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">Select Locality</label>
              <Select value={selectedLocality === 'all' ? 'All Localities' : localities?.find(l => l.id === selectedLocality)?.name} onValueChange={(val) => {
                const loc = localities?.find(l => l.name === val);
                setSelectedLocality(loc ? loc.id : 'all');
              }}>
                <SelectTrigger placeholder="All Localities" />
                <SelectContent>
                  <SelectItem value="All Localities">All Localities</SelectItem>
                  {localities?.map(l => (
                    <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Select */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">Config/Bedrooms</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger placeholder="All Configurations" />
                <SelectContent>
                  <SelectItem value="All Configurations">All Configurations</SelectItem>
                  <SelectItem value="3 BHK">3 BHK Units</SelectItem>
                  <SelectItem value="4 BHK">4 BHK Units</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Slider */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">Max Price</label>
                <span className="text-xs font-mono font-bold text-slate-800">{maxPrice} L (Lakhs)</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="400" 
                step="10"
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none" 
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Category: Proximity */}
        <AccordionItem value="proximity">
          <AccordionTrigger>Proximity Parameters</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
              <input 
                type="checkbox" 
                checked={nearSchool} 
                onChange={(e) => setNearSchool(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/20" 
              />
              <span>Proximity to top CBSE schools</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
              <input 
                type="checkbox" 
                checked={nearHospital} 
                onChange={(e) => setNearHospital(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/20" 
              />
              <span>Proximity to specialty hospitals</span>
            </label>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* AI recommendation alert */}
      <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex gap-3 text-slate-800">
        <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 animate-pulse" />
        <div>
          <h4 className="font-bold text-[10px] font-mono uppercase tracking-wider text-blue-800">GIS Recommendation</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed mt-1 font-sans">
            Saravanampatti shows high listing velocity under 90L parameters with 92% school density coverage.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-grow flex flex-col md:flex-row h-[calc(100vh-68px)] overflow-hidden">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 bg-white border-r border-slate-200/60 p-6 overflow-y-auto flex-shrink-0">
        {desktopSidebar}
      </div>

      {/* Mobile Floating Filters HUD */}
      <div className="md:hidden absolute top-4 left-4 z-30">
        <Sheet>
          <SheetTrigger>
            <button className="bg-white border border-slate-200/80 p-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <Filter className="h-4 w-4 text-slate-400" />
              <span>GIS Filters</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>GIS Parameters</SheetTitle>
              <SheetDescription>Configure overlays and zoning indices.</SheetDescription>
            </SheetHeader>
            {desktopSidebar}
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Map Content area */}
      <div className="flex-grow flex flex-col relative h-full">
        <div className="flex-grow relative h-full">
          <MapView 
            localityId={selectedLocality === 'all' ? undefined : selectedLocality}
            height="h-full"
          />
        </div>

        {/* Bottom Property Preview cards drawer */}
        <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-6 z-20 pointer-events-none">
          <div className="max-w-4xl mx-auto flex gap-4 overflow-x-auto pb-2 pointer-events-auto">
            <AnimatePresence>
              {filteredProperties.slice(0, 3).map((prop) => (
                <motion.div
                  key={prop.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-80 flex-shrink-0 bg-white border border-slate-200/60 rounded-xl p-3.5 shadow-xl flex gap-3"
                >
                  <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200/50 flex-shrink-0">
                    <Building className="h-6 w-6 stroke-[1.2]" />
                  </div>
                  <div className="flex-grow space-y-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded">
                        Grade {prop.ai_investment_rating?.split('|')[0]?.replace('Grade:', '').trim() || 'B'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {prop.price >= 10000000 ? `${(prop.price / 10000000).toFixed(2)} Cr` : `${(prop.price / 100000).toFixed(0)} L`}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs truncate">{prop.title}</h4>
                    <p className="text-[9px] text-slate-400 font-mono uppercase">{getLocalityName(prop.locality_id)} &bull; {prop.area_sqft} sqft</p>
                    <div className="pt-1 flex justify-end">
                      <Link 
                        to={`/property/${prop.id}`}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-1 px-2.5 text-[9px] font-mono uppercase font-bold cursor-pointer"
                      >
                        Analyze &rarr;
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredProperties.length === 0 && (
              <div className="bg-white/90 backdrop-blur border border-slate-200 p-6 rounded-xl shadow-lg w-full text-center text-xs text-slate-500 font-sans">
                No active properties match the selected parameters in this centroid radius.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
