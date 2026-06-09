import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Building, Sparkles } from 'lucide-react';
import { mockLocalities, mockProperties } from '../../services/mockData';

export const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'locality' | 'property'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    // Check if query exactly matches a locality or property
    const matchedLoc = mockLocalities.find(
      (l) => l.name.toLowerCase() === query.toLowerCase()
    );
    if (matchedLoc) {
      navigate(`/locality/${matchedLoc.id}`);
      return;
    }

    const matchedProp = mockProperties.find(
      (p) => p.title.toLowerCase().includes(query.toLowerCase())
    );
    if (matchedProp) {
      navigate(`/property/${matchedProp.id}`);
      return;
    }

    // Default: go to map view with query parameter
    navigate(`/map?q=${encodeURIComponent(query)}`);
  };

  const filteredLocalities = mockLocalities.filter((loc) =>
    loc.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProperties = mockProperties.filter((prop) =>
    prop.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={dropdownRef}>
      <form
        onSubmit={handleSearchSubmit}
        className="glass rounded-2xl flex items-center p-1.5 shadow-lg border border-slate-200/80 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600"
      >
        {/* Filter Selection Dropdown */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="bg-transparent border-r border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
        >
          <option value="all">Search All</option>
          <option value="locality">Localities</option>
          <option value="property">Properties</option>
        </select>

        {/* Input */}
        <div className="relative flex-grow flex items-center px-4">
          <Search className="absolute left-4 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search locality, property project, or landmark..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full pl-6 bg-transparent border-none text-slate-800 text-sm placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Analyze</span>
        </button>
      </form>

      {/* Auto-suggestions dropdown */}
      {isOpen && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          {filterType !== 'property' && filteredLocalities.length > 0 && (
            <div className="p-2 border-b border-slate-100">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-3 py-1 block">Localities</span>
              {filteredLocalities.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setQuery(loc.name);
                    setIsOpen(false);
                    navigate(`/locality/${loc.id}`);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 rounded-lg flex items-center gap-2 text-slate-700 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-900">{loc.name}</span>
                  <span className="text-slate-400">({loc.city})</span>
                </button>
              ))}
            </div>
          )}

          {filterType !== 'locality' && filteredProperties.length > 0 && (
            <div className="p-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-3 py-1 block">Properties</span>
              {filteredProperties.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => {
                    setQuery(prop.title);
                    setIsOpen(false);
                    navigate(`/property/${prop.id}`);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 rounded-lg flex items-center gap-2 text-slate-700 transition-colors truncate"
                >
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-900 truncate">{prop.title}</span>
                </button>
              ))}
            </div>
          )}

          {filteredLocalities.length === 0 && filteredProperties.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching intelligence profiles found. Try "Peelamedu" or "Saravanampatti".
            </div>
          )}
        </div>
      )}
    </div>
  );
};
