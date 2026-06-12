import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Building, Sparkles, Navigation } from 'lucide-react';
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/Command';
import { mockLocalities, mockProperties, mockAmenities } from '../../services/mockData';

export const SearchCommand: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectLocality = (id: string) => {
    setIsOpen(false);
    navigate(`/locality/${id}`);
  };

  const handleSelectProperty = (id: string) => {
    setIsOpen(false);
    navigate(`/property/${id}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    const matchedLoc = mockLocalities.find(
      (l) => l.name.toLowerCase() === query.toLowerCase()
    );
    if (matchedLoc) {
      navigate(`/locality/${matchedLoc.id}`);
      return;
    }
    
    navigate(`/map?q=${encodeURIComponent(query)}`);
  };

  const filteredLocalities = mockLocalities.filter((loc) =>
    loc.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProperties = mockProperties.filter((prop) =>
    prop.title.toLowerCase().includes(query.toLowerCase())
  );

  const allAmenities = Object.entries(mockAmenities).flatMap(([locId, items]) =>
    items.map(item => ({ ...item, localityId: locId }))
  );
  const filteredAmenities = allAmenities.filter((amenity) =>
    amenity.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div ref={containerRef} className={`relative w-full max-w-2xl mx-auto z-30 ${className}`}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="flex items-center bg-white border border-slate-200/80 rounded-2xl shadow-lg hover:border-slate-300/80 transition-all p-1">
          <div className="flex items-center flex-grow px-3">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search locality, property project, or landmark..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full bg-transparent py-2.5 text-slate-800 text-xs font-semibold placeholder-slate-400 outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Analyze</span>
          </button>
        </div>
      </form>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-200">
          <Command>
            <CommandList>
              {filteredLocalities.length === 0 && filteredProperties.length === 0 && filteredAmenities.length === 0 && (
                <CommandEmpty>No intelligence matches found. Try searching "Peelamedu" or "Casagrand".</CommandEmpty>
              )}

              {filteredLocalities.length > 0 && (
                <CommandGroup heading="Localities">
                  {filteredLocalities.map((loc) => (
                    <CommandItem key={loc.id} onSelect={() => handleSelectLocality(loc.id)}>
                      <MapPin className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{loc.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono">NEIGHBORHOOD INTEL PROFILE</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {filteredProperties.length > 0 && (
                <CommandGroup heading="Properties">
                  {filteredProperties.map((prop) => (
                    <CommandItem key={prop.id} onSelect={() => handleSelectProperty(prop.id)}>
                      <Building className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 truncate max-w-[400px]">{prop.title}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{prop.property_type} &bull; GRADE {prop.ai_investment_rating?.split('|')[0]?.replace('Grade:', '').trim()}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {filteredAmenities.length > 0 && (
                <CommandGroup heading="Landmarks & Amenities">
                  {filteredAmenities.map((amenity) => (
                    <CommandItem key={amenity.id} onSelect={() => handleSelectLocality(amenity.localityId)}>
                      <Navigation className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{amenity.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono capitalize">{amenity.category} &bull; DENSITY POINT</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};
