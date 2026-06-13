import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapView } from '../../components/shared/MapView';
import { Select, SelectTrigger, SelectContent, SelectItem } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../components/ui/Sheet';
import { useLocalities, useProperties } from '../../hooks/useApi';
import { useMapFilterStore } from '../../store/useMapFilterStore';
import { mockLocalities, mockProperties, mockAmenities, mockScores, mockMetrics, mockRecommendations } from '../../services/mockData';
import type { Property } from '../../types';
import { 
  Compass, Filter, Sparkles, Building, Map, Shield, 
  Search, Heart, ArrowLeftRight, Navigation, Clock, 
  MapPin, GraduationCap, Flame, TrendingUp, DollarSign, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { data: localities } = useLocalities();
  const { data: properties } = useProperties();

  // State Management Store
  const store = useMapFilterStore();

  // Tab State in Sidebar: 'filters' | 'commute' | 'saved' | 'locality'
  const [activeTab, setActiveTab] = useState<'filters' | 'commute' | 'saved' | 'locality'>('filters');
  
  // Resizable Sidebar States
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const isResizing = useRef(false);

  // Search autocomplete states
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  
  // Observability latencies
  const searchStartRef = useRef<number>(0);

  // Auto-switch to locality tab if a locality is selected
  useEffect(() => {
    if (store.selectedLocalityId) {
      setActiveTab('locality');
    }
  }, [store.selectedLocalityId]);

  // Set active search query if passed from home search bar
  useEffect(() => {
    if (initialQuery && localities) {
      store.setFilters({ searchQuery: initialQuery });
      const matched = localities.find(l => l.name.toLowerCase().includes(initialQuery.toLowerCase()));
      if (matched) {
        store.setFilters({ selectedLocalityId: matched.id });
        setActiveTab('locality');
      }
    }
  }, [initialQuery, localities]);

  // Resizing event handlers
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', endResize);
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing.current) return;
    setSidebarWidth(Math.max(300, Math.min(600, e.clientX)));
  };

  const endResize = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', endResize);
  };

  // Distance calculator helper
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in km
  };

  // Filter and sort properties logic (Client-side virtual filter)
  const filteredProperties = (properties || mockProperties)
    .filter((prop) => {
      // 1. Locality Filter
      if (store.selectedLocalityId && prop.locality_id !== store.selectedLocalityId) return false;
      
      // 2. Type configuration
      if (store.propertyType !== 'All' && prop.property_type !== store.propertyType) return false;

      // 3. Price Filter (store.priceMax is in INR)
      if (prop.price < store.priceMin || prop.price > store.priceMax) return false;

      // 4. Bedrooms
      if (store.bedrooms !== 'All' && prop.bedrooms !== store.bedrooms) return false;

      // 5. Bathrooms
      if (store.bathrooms !== 'All' && prop.bathrooms !== store.bathrooms) return false;

      // 6. Area range bounds
      if (prop.area_sqft < store.areaMin || prop.area_sqft > store.areaMax) return false;

      // 7. Builder filter
      if (store.builder !== 'All') {
        const b = store.builder.toLowerCase();
        const developer = "Casagrand";
        if (!developer.toLowerCase().includes(b)) return false;
      }

      // 8. Property Status
      if (store.propertyStatus !== 'all') {
        if (store.propertyStatus === 'pre-launch' && prop.property_type !== 'Plot') return false;
        if (store.propertyStatus === 'under-construction' && prop.property_type !== 'Apartment') return false;
      }

      // 9. Commute Analysis distance filter
      if (store.commuteDestination) {
        let destLat = 11.0254;
        let destLng = 77.0028;
        const normDest = store.commuteDestination.toLowerCase();
        if (normDest.includes('chil')) { destLat = 11.0829; destLng = 77.0257; }
        else if (normDest.includes('tidel')) { destLat = 11.0276; destLng = 77.0305; }
        else if (normDest.includes('junction')) { destLat = 10.9978; destLng = 76.9634; }

        if (prop.latitude && prop.longitude) {
          const dist = calculateDistance(prop.latitude, prop.longitude, destLat, destLng);
          const driveTime = dist * 2.5;
          if (driveTime > store.commuteMaxTime) return false;
        }
      }

      // 10. Search autocomplete query matching (including BHK intent parsing)
      if (store.searchQuery && store.searchQuery !== store.commuteDestination) {
        const q = store.searchQuery.toLowerCase();
        
        // 1. BHK check
        const hasBhkQuery = q.match(/(\d+)\s*bhk/);
        if (hasBhkQuery) {
          const bhkCount = parseInt(hasBhkQuery[1]);
          if (prop.bedrooms !== bhkCount) return false;
        }

        // 2. Rent/Sale check
        const isRentQuery = q.includes('rent') || q.includes('lease');
        const isSaleQuery = q.includes('sale') || q.includes('sell') || q.includes('buy') || q.includes('purchase');
        if (isRentQuery && prop.listing_type?.toLowerCase() !== 'rent') return false;
        if (isSaleQuery && prop.listing_type?.toLowerCase() !== 'sale' && prop.listing_type?.toLowerCase() !== 'buy') {
          return false;
        }

        // 3. Locality check: if the query contains a locality name, restrict matches to that locality
        const matchedLocality = mockLocalities.find(l => q.includes(l.name.toLowerCase()));
        if (matchedLocality && prop.locality_id !== matchedLocality.id) {
          return false;
        }

        // 4. Property Type check: if the query contains a type keyword, restrict to that type
        let matchedType: string | null = null;
        if (q.includes('villa')) matchedType = 'Villa';
        else if (q.includes('apartment') || q.includes('flat') || q.includes('residency') || q.includes('gated')) matchedType = 'Apartment';
        else if (q.includes('plot') || q.includes('land') || q.includes('site')) matchedType = 'Plot';
        else if (q.includes('house') || q.includes('home') || q.includes('residential')) matchedType = 'Residential'; // general residential

        if (matchedType) {
          if (matchedType === 'Residential') {
            if (prop.property_type === 'Plot') return false;
          } else if (prop.property_type !== matchedType) {
            return false;
          }
        }

        // 5. If no specific locality or type was parsed from the query, or as a fallback,
        // perform a word-by-word match: at least one non-common word should match the property
        if (!matchedLocality && !matchedType && !hasBhkQuery) {
          const commonWords = ['in', 'for', 'near', 'the', 'a', 'an', 'at', 'with', 'and', 'of', 'to'];
          const terms = q.split(/\s+/).filter(t => t.length > 0);
          const searchTerms = terms.filter(t => !commonWords.includes(t));
          
          if (searchTerms.length > 0) {
            const propText = `${prop.title} ${prop.property_type} ${prop.ai_description || ''} ${prop.ai_investment_rating || ''}`.toLowerCase();
            const matchesAnyTerm = searchTerms.some(term => propText.includes(term));
            if (!matchesAnyTerm) return false;
          }
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (store.sortBy === 'price-asc') return a.price - b.price;
      if (store.sortBy === 'price-desc') return b.price - a.price;
      if (store.sortBy === 'investment') {
        const ratingScore = (str?: string | null) => {
          if (!str) return 0;
          if (str.includes('Grade: A')) return 3;
          if (str.includes('Grade: B')) return 2;
          return 1;
        };
        return ratingScore(b.ai_investment_rating) - ratingScore(a.ai_investment_rating);
      }
      if (store.sortBy === 'yield') {
        const getLocYield = (locId?: string | null) => mockMetrics[locId || '']?.rental_yield_estimate || 3.5;
        return getLocYield(b.locality_id) - getLocYield(a.locality_id);
      }
      return 0; // Default stays unchanged
    });

  // Autocomplete Suggestions
  const searchSuggestions = () => {
    if (!store.searchQuery) return [];
    const q = store.searchQuery.toLowerCase();
    
    const matchedLocs = mockLocalities.filter(l => l.name.toLowerCase().includes(q));
    const matchedProps = mockProperties.filter(p => p.title.toLowerCase().includes(q));
    const matchedLandmarks = [
      { name: 'CHIL SEZ IT Park, Saravanampatti', coords: { lat: 11.0829, lng: 77.0257 } },
      { name: 'PSG Tech, Peelamedu', coords: { lat: 11.0254, lng: 77.0028 } },
      { name: 'Tidel Park, Avinashi Road', coords: { lat: 11.0276, lng: 77.0305 } },
      { name: 'Coimbatore Railway Junction', coords: { lat: 10.9978, lng: 76.9634 } }
    ].filter(l => l.name.toLowerCase().includes(q));

    return [
      ...matchedLocs.map(l => ({ type: 'locality', label: l.name, id: l.id })),
      ...matchedProps.map(p => ({ type: 'property', label: p.title, id: p.id })),
      ...matchedLandmarks.map(lm => ({ type: 'landmark', label: lm.name, id: lm.name }))
    ].slice(0, 6);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!searchStartRef.current) {
      searchStartRef.current = performance.now();
    }
    store.setFilters({ searchQuery: e.target.value });
    setShowSearchSuggestions(true);
  };

  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'locality') {
      store.setFilters({ selectedLocalityId: suggestion.id, searchQuery: suggestion.label });
      setActiveTab('locality');
    } else if (suggestion.type === 'property') {
      store.setFilters({ selectedPropertyId: suggestion.id, searchQuery: suggestion.label });
    } else if (suggestion.type === 'landmark') {
      store.setFilters({ commuteDestination: suggestion.id, searchQuery: suggestion.label });
      setActiveTab('commute');
    }
    setShowSearchSuggestions(false);

    // Latency telemetry
    if (searchStartRef.current) {
      const latency = performance.now() - searchStartRef.current;
      fetch('http://localhost:8000/api/v1/metrics/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric_name: 'search_latency', value_ms: latency })
      }).catch(() => {});
      searchStartRef.current = 0;
    }
  };

  // Get nearest school and hospital distance metrics
  const getProximityMetrics = (prop: Property) => {
    if (!prop.latitude || !prop.longitude) return { schoolDist: '1.2 km', hospitalDist: '2.5 km' };
    const amenities = mockAmenities[prop.locality_id || ''] || [];
    
    let minSchool = Infinity;
    let minHospital = Infinity;

    amenities.forEach(am => {
      const dist = calculateDistance(prop.latitude!, prop.longitude!, am.latitude, am.longitude);
      if (am.category === 'school' && dist < minSchool) minSchool = dist;
      if (am.category === 'hospital' && dist < minHospital) minHospital = dist;
    });

    return {
      schoolDist: minSchool === Infinity ? '1.5 km' : `${minSchool.toFixed(1)} km`,
      hospitalDist: minHospital === Infinity ? '1.9 km' : `${minHospital.toFixed(1)} km`
    };
  };

  // Highlight winners logic for property comparison HUD
  const getComparisonWinner = (rowKey: string) => {
    if (store.comparedPropertyIds.length < 2) return null;
    const items = store.comparedPropertyIds.map(id => mockProperties.find(p => p.id === id)).filter(Boolean) as Property[];

    if (rowKey === 'price') {
      // Lowest price is winner
      const minPrice = Math.min(...items.map(p => p.price));
      return items.find(p => p.price === minPrice)?.id;
    }
    if (rowKey === 'area') {
      // Largest area is winner
      const maxArea = Math.max(...items.map(p => p.area_sqft));
      return items.find(p => p.area_sqft === maxArea)?.id;
    }
    if (rowKey === 'investment') {
      // Grade A is better than B or C
      const score = (gradeStr: string) => {
        if (gradeStr.includes('Grade: A')) return 3;
        if (gradeStr.includes('Grade: B')) return 2;
        return 1;
      };
      const maxScore = Math.max(...items.map(p => score(p.ai_investment_rating || '')));
      return items.find(p => score(p.ai_investment_rating || '') === maxScore)?.id;
    }
    return null;
  };

  // Layout components
  const desktopSidebar = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100 font-sans">
      
      {/* Platform Title */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-sm font-display text-white leading-none">Property Intelligence</h2>
          <p className="text-[9px] text-slate-400 font-mono mt-1 uppercase tracking-wider">Coimbatore GIS Engine</p>
        </div>
      </div>

      {/* Autocomplete Search input */}
      <div className="p-4 border-b border-slate-800 relative z-40">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search properties, builders, localities..."
            value={store.searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSearchSuggestions(true)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-white"
          />
          {store.searchQuery && (
            <button 
              onClick={() => store.setFilters({ searchQuery: '' })}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Suggestions Autocomplete Panel */}
        <AnimatePresence>
          {showSearchSuggestions && store.searchQuery && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowSearchSuggestions(false)} />
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-4 right-4 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-40 overflow-hidden"
              >
                {searchSuggestions().map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-750 border-b border-slate-700/50 last:border-b-0 flex items-center gap-2 text-slate-200"
                  >
                    {suggestion.type === 'locality' && <Map className="h-3.5 w-3.5 text-blue-400" />}
                    {suggestion.type === 'property' && <Building className="h-3.5 w-3.5 text-purple-400" />}
                    {suggestion.type === 'landmark' && <MapPin className="h-3.5 w-3.5 text-emerald-400" />}
                    <span>{suggestion.label}</span>
                  </button>
                ))}
                {searchSuggestions().length === 0 && (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center">No matching entities found</div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs navigation HUD */}
      <div className="grid grid-cols-4 border-b border-slate-800 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
        <button 
          onClick={() => setActiveTab('filters')}
          className={`py-3 text-center border-b-2 transition-all ${activeTab === 'filters' ? 'border-blue-500 text-white bg-slate-800/40' : 'border-transparent hover:text-slate-200'}`}
        >
          Filters
        </button>
        <button 
          onClick={() => setActiveTab('commute')}
          className={`py-3 text-center border-b-2 transition-all ${activeTab === 'commute' ? 'border-blue-500 text-white bg-slate-800/40' : 'border-transparent hover:text-slate-200'}`}
        >
          Commute
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={`py-3 text-center border-b-2 transition-all ${activeTab === 'saved' ? 'border-blue-500 text-white bg-slate-800/40' : 'border-transparent hover:text-slate-200'}`}
        >
          Saved
        </button>
        <button 
          onClick={() => setActiveTab('locality')}
          disabled={!store.selectedLocalityId}
          className={`py-3 text-center border-b-2 transition-all disabled:opacity-30 ${activeTab === 'locality' ? 'border-blue-500 text-white bg-slate-800/40' : 'border-transparent hover:text-slate-200'}`}
        >
          Locality
        </button>
      </div>

      {/* Sidebar Content Panel */}
      <div className="flex-grow overflow-y-auto p-4 space-y-5">
        
        {/* TAB 1: FILTERS */}
        {activeTab === 'filters' && (
          <div className="space-y-4">
            
            {/* Price Budget selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Max Budget</span>
                <span className="text-xs font-mono font-bold text-blue-400">
                  {store.priceMax >= 10000000 
                    ? `${(store.priceMax / 10000000).toFixed(1)} Cr` 
                    : `${(store.priceMax / 100000).toFixed(0)} Lakhs`}
                </span>
              </div>
              <input 
                type="range"
                min={2000000}
                max={40000000}
                step={1000000}
                value={store.priceMax}
                onChange={(e) => store.setFilters({ priceMax: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* Property Types Select */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Property Configuration</span>
              <Select value={store.propertyType} onValueChange={(val) => store.setFilters({ propertyType: val })}>
                <SelectTrigger placeholder="Select Property Configuration" className="bg-slate-800 border-slate-700 text-white" />
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Apartment">Apartment Units</SelectItem>
                  <SelectItem value="Villa">Luxury Villas</SelectItem>
                  <SelectItem value="Independent House">Independent Houses</SelectItem>
                  <SelectItem value="Plot">Zoned Land Plots</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By Select */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Sort By</span>
              <Select value={store.sortBy} onValueChange={(val) => store.setFilters({ sortBy: val as any })}>
                <SelectTrigger placeholder="Sort By" className="bg-slate-800 border-slate-700 text-white" />
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="investment">Investment Potential</SelectItem>
                  <SelectItem value="yield">Rental Yield</SelectItem>
                  <SelectItem value="newest">Newest Launch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bedrooms Button Grid */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Bedrooms (BHK)</span>
              <div className="grid grid-cols-5 gap-1">
                {(['All', 1, 2, 3, 4] as const).map((bhk) => (
                  <button
                    key={bhk}
                    type="button"
                    onClick={() => store.setFilters({ bedrooms: bhk })}
                    className={`py-1.5 text-[10px] font-mono rounded-lg border text-center font-bold uppercase transition ${
                      store.bedrooms === bhk 
                        ? 'bg-blue-600/30 border-blue-500 text-blue-400' 
                        : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {bhk === 'All' ? 'All' : `${bhk} BHK`}
                  </button>
                ))}
              </div>
            </div>

            {/* Bathrooms Button Grid */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Bathrooms</span>
              <div className="grid grid-cols-5 gap-1">
                {(['All', 1, 2, 3, 4] as const).map((baths) => (
                  <button
                    key={baths}
                    type="button"
                    onClick={() => store.setFilters({ bathrooms: baths })}
                    className={`py-1.5 text-[10px] font-mono rounded-lg border text-center font-bold uppercase transition ${
                      store.bathrooms === baths 
                        ? 'bg-blue-600/30 border-blue-500 text-blue-400' 
                        : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {baths === 'All' ? 'All' : `${baths}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Built-up Area Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Max Built-up Area</span>
                <span className="text-xs font-mono font-bold text-blue-400">
                  {store.areaMax} SqFt
                </span>
              </div>
              <input 
                type="range"
                min={500}
                max={10000}
                step={250}
                value={store.areaMax}
                onChange={(e) => store.setFilters({ areaMax: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* New Projects Layer */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">New Projects Layer</span>
              <div className="grid grid-cols-3 gap-1">
                {['all', 'pre-launch', 'under-construction'].map((type) => (
                  <button
                    key={type}
                    onClick={() => store.setFilters({ newProjectsFilter: type as any })}
                    className={`py-1.5 text-[10px] font-mono rounded-lg border text-center font-bold uppercase transition ${
                      store.newProjectsFilter === type 
                        ? 'bg-blue-600/30 border-blue-500 text-blue-400' 
                        : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Investment Heatmap layer overlays */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Intelligence Heatmaps</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'none', label: 'Disable Heatmaps', icon: Map },
                  { id: 'investment', label: 'Investment Potential', icon: Flame },
                  { id: 'price', label: 'Price Velocity', icon: TrendingUp },
                  { id: 'safety', label: 'Safety Index', icon: Shield }
                ].map((heatmap) => (
                  <button
                    key={heatmap.id}
                    onClick={() => store.setFilters({ activeHeatmap: heatmap.id as any })}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-[10px] font-bold transition text-left cursor-pointer ${
                      store.activeHeatmap === heatmap.id 
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                        : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <heatmap.icon className="h-3.5 w-3.5" />
                    <span>{heatmap.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities Toggle indicators */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Toggle Proximity Pins</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { category: 'school', label: 'Schools', icon: GraduationCap },
                  { category: 'hospital', label: 'Hospitals', icon: Shield },
                  { category: 'restaurant', label: 'Cafes', icon: DollarSign }
                ].map((amenity) => {
                  const isActive = store.amenityCategories.includes(amenity.category);
                  return (
                    <button
                      key={amenity.category}
                      onClick={() => store.toggleAmenity(amenity.category)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-bold transition text-center cursor-pointer ${
                        isActive 
                          ? 'bg-blue-600/30 border-blue-500 text-blue-400' 
                          : 'border-slate-800 bg-slate-850 hover:bg-slate-850 text-slate-400'
                      }`}
                    >
                      <amenity.icon className="h-4 w-4" />
                      <span>{amenity.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Locality Boundaries Checkbox Toggle */}
            <div className="flex items-center gap-2 py-2 select-none border-t border-slate-800 mt-2">
              <Checkbox
                id="showLocalityBoundaries"
                checked={store.showLocalityBoundaries}
                onCheckedChange={(checked) => store.setFilters({ showLocalityBoundaries: checked })}
                className="border-slate-700 bg-slate-800 text-white hover:border-slate-600"
              />
              <label
                htmlFor="showLocalityBoundaries"
                className="text-[11px] font-bold text-slate-400 cursor-pointer uppercase font-mono"
              >
                Show Locality Boundaries
              </label>
            </div>

            {/* Properties Listings results count display */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-500">Matching Properties ({filteredProperties.length})</span>
              <div className="space-y-2 mt-2">
                {filteredProperties.map(prop => (
                  <div 
                    key={prop.id}
                    onClick={() => store.setFilters({ selectedPropertyId: prop.id })}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                      prop.id === store.selectedPropertyId 
                        ? 'bg-slate-800/80 border-blue-500' 
                        : 'bg-slate-850/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 truncate max-w-[180px]">{prop.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{prop.property_type} &bull; {prop.area_sqft} SqFt</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-200 block">
                        {prop.price >= 10000000 ? `${(prop.price/10000000).toFixed(2)} Cr` : `${(prop.price/100000).toFixed(0)} L`}
                      </span>
                      <span className="text-[8px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded font-bold mt-1 inline-block">
                        Grade {prop.ai_investment_rating?.split('|')[0]?.replace('Grade:', '').trim() || 'B'}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredProperties.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-500">No properties matches active filters</div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: COMMUTE */}
        {activeTab === 'commute' && (
          <div className="space-y-4 font-sans">
            <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wide">Commute Analysis Overlay</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter destination coordinates or select key micro-corridors. Filter active property pins by maximum transit duration.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Custom Work / School Destination</label>
              <input 
                type="text" 
                placeholder="e.g. CHIL SEZ IT Park, PSG Tech, Tidel Park"
                value={store.commuteDestination}
                onChange={(e) => store.setFilters({ commuteDestination: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-white"
              />
            </div>

            {store.commuteDestination && (
              <>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Max Commute Time</span>
                    <span className="text-xs font-mono font-bold text-blue-400">{store.commuteMaxTime} Mins</span>
                  </div>
                  <input 
                    type="range"
                    min={10}
                    max={90}
                    step={5}
                    value={store.commuteMaxTime}
                    onChange={(e) => store.setFilters({ commuteMaxTime: Number(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2 mt-4">
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block">Commute Parameters Matrix</span>
                  <div className="flex items-center gap-3 text-slate-350 text-xs">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <div>
                      <div>Drive speed model: <span className="font-mono text-slate-200 font-bold">25 km/h avg</span></div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Adjust commute radius using the slider above.</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: SAVED COLLECTIONS */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wide">Collections Management</h3>

            {/* Create custom collection */}
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Create folder e.g. Plots Under ₹50L"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="flex-grow px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 text-white"
              />
              <button 
                onClick={() => {
                  if (newCollectionName) {
                    store.createCollection(newCollectionName);
                    setNewCollectionName('');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                Create
              </button>
            </div>

            {/* Collections List */}
            <div className="space-y-3.5 pt-3">
              {Object.keys(store.savedCollections).map((name) => (
                <div key={name} className="bg-slate-850 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200 font-display">{name}</span>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">{store.savedCollections[name]?.length || 0} Items</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {store.savedCollections[name]?.map((id) => {
                      const prop = mockProperties.find(p => p.id === id);
                      if (!prop) return null;
                      return (
                        <div key={id} className="flex justify-between items-center text-[11px] bg-slate-800 px-2.5 py-1.5 rounded-lg">
                          <span className="text-slate-350 truncate max-w-[150px]">{prop.title}</span>
                          <button 
                            onClick={() => store.removePropertyFromCollection(id, name)}
                            className="text-rose-500 hover:text-rose-400 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                    {(!store.savedCollections[name] || store.savedCollections[name].length === 0) && (
                      <div className="text-[10px] text-slate-600 text-center py-2 font-mono uppercase">Folder is empty</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 4: LOCALITY INTELLIGENCE DETAILED */}
        {activeTab === 'locality' && store.selectedLocalityId && (
          <div className="space-y-4">
            {(() => {
              const loc = mockLocalities.find(l => l.id === store.selectedLocalityId);
              const scores = mockScores[store.selectedLocalityId || ''] || {};
              const metrics = mockMetrics[store.selectedLocalityId || ''] || {};
              const recommendations = mockRecommendations[store.selectedLocalityId || ''] || {};

              if (!loc) return <div className="text-slate-400">Select a locality to show intelligence report.</div>;

              return (
                <div className="space-y-4">
                  {/* Header info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-base text-white font-display leading-tight">{loc.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{loc.city}, {loc.state}</p>
                    </div>
                    <button 
                      onClick={() => store.setFilters({ selectedLocalityId: null })}
                      className="text-slate-500 hover:text-slate-300 text-xs font-mono uppercase font-bold"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Locality Scores Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-slate-850 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block">Avg Price</span>
                      <span className="text-xs font-mono font-extrabold text-slate-200 mt-0.5 block">₹{metrics.avg_price_per_sqft || 4300}/SqFt</span>
                    </div>
                    <div className="bg-slate-850 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block">Investment Grade</span>
                      <span className="text-xs font-extrabold text-emerald-400 mt-0.5 block">
                        {scores.investment_score ? `${scores.investment_score}/100 Grade A` : '85/100 Grade B+'}
                      </span>
                    </div>
                    <div className="bg-slate-850 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block">Livability Index</span>
                      <span className="text-xs font-mono font-extrabold text-slate-200 mt-0.5 block">{scores.overall_livability_score || 78}%</span>
                    </div>
                    <div className="bg-slate-850 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block">Listing Velocity</span>
                      <span className="text-xs font-mono font-extrabold text-slate-200 mt-0.5 block">{metrics.listing_velocity || 8.5}/10</span>
                    </div>
                  </div>

                  {/* Smart Alternatives section */}
                  <div className="border-t border-slate-800 pt-3.5 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Smart Alternatives Nearby</span>
                    </div>

                    <div className="space-y-2">
                      {/* Cheaper option */}
                      {recommendations['CHEAPER'] && recommendations['CHEAPER'].map((item: any) => (
                        <div key={item.id} className="bg-slate-850 border border-slate-800 rounded-xl p-3 space-y-1.5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-400 font-mono text-[8px] px-2 py-0.5 rounded-bl uppercase font-extrabold">Cheaper Option</div>
                          <h5 className="font-bold text-xs text-slate-200">{item.name}</h5>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{item.reasoning}</p>
                          <div className="flex gap-2 pt-1">
                            <span className="text-[8px] font-mono uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">Price savings: {(item.feature_contribution.price_savings * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}

                      {/* Premium option */}
                      {recommendations['PREMIUM'] && recommendations['PREMIUM'].map((item: any) => (
                        <div key={item.id} className="bg-slate-850 border border-slate-800 rounded-xl p-3 space-y-1.5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-purple-500/10 text-purple-400 font-mono text-[8px] px-2 py-0.5 rounded-bl uppercase font-extrabold">Premium Alternative</div>
                          <h5 className="font-bold text-xs text-slate-200">{item.name}</h5>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{item.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );

  // Bottom floating HUD comparison mode panel
  const comparisonHUD = (
    <AnimatePresence>
      {store.comparedPropertyIds.length > 0 && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 shadow-2xl z-40 p-4 pb-6 font-sans text-slate-100"
        >
          <div className="max-w-6xl mx-auto space-y-4">
            
            {/* Header comparison */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                <h3 className="font-extrabold text-sm text-white font-display uppercase tracking-wide">Property Comparison Mode</h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase">({store.comparedPropertyIds.length} of 4 Selected)</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => store.clearComparedProperties()}
                  className="text-xs font-mono font-bold text-slate-400 hover:text-white uppercase"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => store.clearComparedProperties()}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Comparison Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="py-2.5 font-mono text-slate-500 uppercase tracking-wider w-1/5">Metrics</th>
                    {store.comparedPropertyIds.map(id => {
                      const prop = mockProperties.find(p => p.id === id);
                      return (
                        <th key={id} className="py-2.5 px-4 font-bold text-slate-200">
                          {prop?.title}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  
                  {/* Row: Price */}
                  <tr>
                    <td className="py-3 font-mono text-slate-400">Price</td>
                    {store.comparedPropertyIds.map(id => {
                      const prop = mockProperties.find(p => p.id === id);
                      const isWinner = getComparisonWinner('price') === id;
                      return (
                        <td key={id} className={`py-3 px-4 font-mono font-bold ${isWinner ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {prop ? (prop.price >= 10000000 ? `${(prop.price/10000000).toFixed(2)} Cr` : `${(prop.price/100000).toFixed(0)} L`) : '-'}
                          {isWinner && <span className="ml-2 text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded font-mono font-bold uppercase">Best Value</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Area */}
                  <tr>
                    <td className="py-3 font-mono text-slate-400">Area (Sq Ft)</td>
                    {store.comparedPropertyIds.map(id => {
                      const prop = mockProperties.find(p => p.id === id);
                      const isWinner = getComparisonWinner('area') === id;
                      return (
                        <td key={id} className={`py-3 px-4 font-mono font-bold ${isWinner ? 'text-blue-400' : 'text-slate-300'}`}>
                          {prop?.area_sqft} SqFt
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Config */}
                  <tr>
                    <td className="py-3 font-mono text-slate-400">Config</td>
                    {store.comparedPropertyIds.map(id => {
                      const prop = mockProperties.find(p => p.id === id);
                      return (
                        <td key={id} className="py-3 px-4 text-slate-350">
                          {prop?.bedrooms} BHK / {prop?.bathrooms} Bath
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Investment Grade */}
                  <tr>
                    <td className="py-3 font-mono text-slate-400">Investment Rating</td>
                    {store.comparedPropertyIds.map(id => {
                      const prop = mockProperties.find(p => p.id === id);
                      const isWinner = getComparisonWinner('investment') === id;
                      return (
                        <td key={id} className="py-3 px-4">
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            isWinner ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            Grade {prop?.ai_investment_rating?.split('|')[0]?.replace('Grade:', '').trim() || 'B'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Proximity metrics */}
                  <tr>
                    <td className="py-3 font-mono text-slate-400">Connectivity Proximity</td>
                    {store.comparedPropertyIds.map(id => {
                      const prop = mockProperties.find(p => p.id === id);
                      if (!prop) return <td key={id}>-</td>;
                      const { schoolDist, hospitalDist } = getProximityMetrics(prop);
                      return (
                        <td key={id} className="py-3 px-4 text-slate-350 text-[11px]">
                          Schools: {schoolDist} &bull; Hospital: {hospitalDist}
                        </td>
                      );
                    })}
                  </tr>

                </tbody>
              </table>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex-grow flex flex-col md:flex-row h-[calc(100vh-68px)] overflow-hidden relative">
      
      {/* Desktop Sidebar with custom Drag resizing */}
      <div 
        style={{ width: `${sidebarWidth}px` }}
        className="hidden md:flex flex-col h-full bg-slate-900 border-r border-slate-800 flex-shrink-0 relative overflow-hidden"
      >
        {desktopSidebar}
        
        {/* Resize Handler Element */}
        <div 
          onMouseDown={startResize}
          className="absolute top-0 right-0 bottom-0 w-1 bg-slate-850 hover:bg-blue-600/70 cursor-col-resize z-50 transition"
        />
      </div>

      {/* Mobile Floating Drawer controls */}
      <div className="md:hidden absolute top-4 left-4 z-30">
        <Sheet>
          <SheetTrigger>
            <button className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
              <Filter className="h-4 w-4 text-slate-500" />
              <span>GIS Console</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-slate-900 border-slate-800 p-0 overflow-y-auto">
            <SheetHeader className="p-4 border-b border-slate-800">
              <SheetTitle className="text-white">GIS intelligence console</SheetTitle>
              <SheetDescription className="text-slate-500">Configure map filters and layers.</SheetDescription>
            </SheetHeader>
            {desktopSidebar}
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Google Maps Content Panel */}
      <div className="flex-grow relative h-full flex flex-col">
        <div className="flex-grow relative h-full">
          <MapView height="h-full" />
        </div>

        {/* Floating Property Preview Detail Card overlay */}
        <AnimatePresence>
          {store.selectedPropertyId && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl z-30 flex flex-col gap-3 font-sans text-slate-900 overflow-hidden"
            >
              {(() => {
                const prop = mockProperties.find(p => p.id === store.selectedPropertyId);
                if (!prop) return null;
                const { schoolDist, hospitalDist } = getProximityMetrics(prop);
                const isSaved = store.savedPropertyIds.includes(prop.id);
                const isCompared = store.comparedPropertyIds.includes(prop.id);

                return (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold font-mono tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">
                          {prop.property_type}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 mt-1 font-display max-w-[240px] leading-snug">{prop.title}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wide">
                          {mockLocalities.find(l => l.id === prop.locality_id)?.name || 'Coimbatore'} &bull; {prop.area_sqft} SqFt
                        </p>
                      </div>
                      <button 
                        onClick={() => store.setFilters({ selectedPropertyId: null })}
                        className="text-slate-400 hover:text-slate-600 rounded-lg p-1 bg-slate-50 border border-slate-200/50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Google Street View or Property Image Preview */}
                    {(prop.images && prop.images.length > 0) || (store.mapsApiKey && prop.latitude && prop.longitude) ? (
                      <div className="w-full h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group">
                        {prop.images && prop.images.length > 0 ? (
                          <img 
                            src={prop.images[0]} 
                            alt={`Photo of ${prop.title}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <img 
                            src={`https://maps.googleapis.com/maps/api/streetview?size=400x150&location=${prop.latitude},${prop.longitude}&fov=90&heading=235&pitch=10&key=${store.mapsApiKey}`}
                            alt={`Street view of ${prop.title}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[8px] font-mono px-2 py-0.5 rounded backdrop-blur">
                          {prop.images && prop.images.length > 0 ? "PROPERTY ACQUISITION PHOTO" : "STREET VIEW LIVE FEED"}
                        </span>
                      </div>
                    ) : null}

                    {/* AI explanation and metrics summary */}
                    <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-2.5 rounded-xl font-medium">
                      {prop.ai_description}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-mono block">Investment analysis</span>
                        <span className="text-[11px] font-bold text-slate-800 block mt-0.5">Grade {prop.ai_investment_rating?.split('|')[0]?.replace('Grade:', '').trim() || 'B'}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-mono block">Transit distance</span>
                        <span className="text-[11px] font-bold text-slate-800 block mt-0.5">School: {schoolDist} &bull; Hosp: {hospitalDist}</span>
                      </div>
                    </div>

                    {/* Drive time computation if workplace commute search is active */}
                    {store.commuteDestination && prop.latitude && prop.longitude && (
                      <div className="bg-emerald-500/10 border border-emerald-500/25 p-2 rounded-xl flex justify-between items-center text-xs text-emerald-800 font-semibold">
                        <span className="flex items-center gap-1.5"><Navigation className="h-4 w-4 text-emerald-600" /> Commute drive duration:</span>
                        <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
                          {(() => {
                            let destLat = 11.0254;
                            let destLng = 77.0028;
                            const normDest = store.commuteDestination.toLowerCase();
                            if (normDest.includes('chil')) { destLat = 11.0829; destLng = 77.0257; }
                            else if (normDest.includes('tidel')) { destLat = 11.0276; destLng = 77.0305; }
                            else if (normDest.includes('junction')) { destLat = 10.9978; destLng = 76.9634; }
                            
                            const dist = calculateDistance(prop.latitude, prop.longitude, destLat, destLng);
                            return `${(dist * 2.5).toFixed(0)} Mins`;
                          })()}
                        </span>
                      </div>
                    )}

                    {/* Value index */}
                    <div className="flex justify-between items-baseline mt-1 border-t border-slate-100 pt-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide font-display">Listing Valuation</span>
                      <span className="text-sm font-mono font-extrabold text-slate-900">
                        {prop.price >= 10000000 ? `${(prop.price / 10000000).toFixed(2)} Cr` : `${(prop.price / 100000).toFixed(0)} L`}
                      </span>
                    </div>

                    {/* Actions HUD panel */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                      <button 
                        onClick={() => {
                          if (isSaved) store.unsaveProperty(prop.id);
                          else store.saveProperty(prop.id);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                          isSaved 
                            ? 'bg-rose-50 border-rose-200 text-rose-600' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>

                      <button 
                        onClick={() => store.toggleComparedProperty(prop.id)}
                        className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                          isCompared 
                            ? 'bg-blue-50 border-blue-200 text-blue-600' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                        <span>{isCompared ? 'Compared' : 'Compare'}</span>
                      </button>

                      <Link 
                        to={`/property/${prop.id}`}
                        className="py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition text-center flex items-center justify-center"
                      >
                        Analyze &rarr;
                      </Link>
                    </div>

                    {/* Saved folder selection dropdown when property is saved */}
                    {isSaved && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Save to:</span>
                        <select 
                          onChange={(e) => store.addPropertyToCollection(prop.id, e.target.value)}
                          defaultValue=""
                          className="flex-grow bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 rounded px-1.5 py-0.5 outline-none"
                        >
                          <option value="" disabled>Select Collection Folder</option>
                          {Object.keys(store.savedCollections).map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>
                    )}

                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Slide HUD overlays */}
        {comparisonHUD}

      </div>
    </div>
  );
};
