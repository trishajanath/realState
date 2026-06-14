import { create } from 'zustand';

interface MapFilterState {
  priceMin: number;
  priceMax: number;
  propertyType: string;
  listingType: string;
  amenityCategories: string[];
  searchQuery: string;
  showHeatmap: boolean;
  activeOverlay: 'price' | 'investment' | 'safety' | 'none';
  
  // Extended store properties
  savedPropertyIds: string[];
  savedCollections: Record<string, string[]>;
  selectedPropertyId: string | null;
  selectedLocalityId: string | null;
  commuteDestination: string;
  commuteMaxTime: number; // in minutes
  activeHeatmap: 'price' | 'investment' | 'safety' | 'amenity' | 'none';
  newProjectsFilter: 'all' | 'pre-launch' | 'under-construction' | 'ready';
  comparedPropertyIds: string[];
  toggleComparedProperty: (id: string) => void;
  clearComparedProperties: () => void;
  
  useMockFallback: boolean;
  mapsApiKey: string | null;

  // Property-first filter states
  bedrooms: number | 'All';
  bathrooms: number | 'All';
  areaMin: number;
  areaMax: number;
  builder: string;
  propertyStatus: 'all' | 'pre-launch' | 'under-construction' | 'ready';
  sortBy: 'price-asc' | 'price-desc' | 'investment' | 'yield' | 'newest';
  showLocalityBoundaries: boolean;
  newProjectsAge: string;
  
  setFilters: (filters: Partial<Omit<MapFilterState, 'setFilters' | 'toggleAmenity' | 'saveProperty' | 'unsaveProperty' | 'createCollection' | 'addPropertyToCollection' | 'removePropertyFromCollection' | 'toggleComparedProperty' | 'clearComparedProperties'>>) => void;
  toggleAmenity: (category: string) => void;
  saveProperty: (id: string) => void;
  unsaveProperty: (id: string) => void;
  createCollection: (name: string) => void;
  addPropertyToCollection: (id: string, collection: string) => void;
  removePropertyFromCollection: (id: string, collection: string) => void;
}

export const useMapFilterStore = create<MapFilterState>((set) => ({
  priceMin: 0,
  priceMax: 100000000, // 10 Cr default max
  propertyType: 'All',
  listingType: 'All',
  amenityCategories: [],
  searchQuery: '',
  showHeatmap: false,
  activeOverlay: 'none',

  // Default extended values
  savedPropertyIds: [],
  savedCollections: {
    "Investment Opportunities": [],
    "Family Homes": [],
    "Plots Under ₹50L": []
  },
  comparedPropertyIds: [],
  selectedPropertyId: null,
  selectedLocalityId: null,
  commuteDestination: '',
  commuteMaxTime: 45, // default 45 mins
  activeHeatmap: 'none',
  newProjectsFilter: 'all',
  newProjectsAge: 'all',
  useMockFallback: false,
  mapsApiKey: null,

  // Initial property-first filters values
  bedrooms: 'All',
  bathrooms: 'All',
  areaMin: 0,
  areaMax: 10000,
  builder: 'All',
  propertyStatus: 'all',
  sortBy: 'price-asc',
  showLocalityBoundaries: false,

  setFilters: (newFilters) => set((state) => ({ ...state, ...newFilters })),
  
  toggleAmenity: (category) =>
    set((state) => {
      const active = state.amenityCategories.includes(category);
      const updated = active
        ? state.amenityCategories.filter((item) => item !== category)
        : [...state.amenityCategories, category];
      return { ...state, amenityCategories: updated };
    }),

  saveProperty: (id) =>
    set((state) => {
      if (state.savedPropertyIds.includes(id)) return state;
      return { ...state, savedPropertyIds: [...state.savedPropertyIds, id] };
    }),

  unsaveProperty: (id) =>
    set((state) => {
      const updatedCollections = { ...state.savedCollections };
      Object.keys(updatedCollections).forEach((key) => {
        updatedCollections[key] = updatedCollections[key].filter((pid) => pid !== id);
      });
      return {
        ...state,
        savedPropertyIds: state.savedPropertyIds.filter((pid) => pid !== id),
        savedCollections: updatedCollections
      };
    }),

  createCollection: (name) =>
    set((state) => {
      if (state.savedCollections[name]) return state;
      return {
        ...state,
        savedCollections: { ...state.savedCollections, [name]: [] }
      };
    }),

  addPropertyToCollection: (id, collection) =>
    set((state) => {
      const currentList = state.savedCollections[collection] || [];
      if (currentList.includes(id)) return state;
      
      // Also ensure it is marked as saved generally
      const savedIds = state.savedPropertyIds.includes(id) 
        ? state.savedPropertyIds 
        : [...state.savedPropertyIds, id];

      return {
        ...state,
        savedPropertyIds: savedIds,
        savedCollections: {
          ...state.savedCollections,
          [collection]: [...currentList, id]
        }
      };
    }),

  removePropertyFromCollection: (id, collection) =>
    set((state) => {
      const currentList = state.savedCollections[collection] || [];
      return {
        ...state,
        savedCollections: {
          ...state.savedCollections,
          [collection]: currentList.filter((pid) => pid !== id)
        }
      };
    }),

  toggleComparedProperty: (id) =>
    set((state) => {
      const isCompared = state.comparedPropertyIds.includes(id);
      let updated = [];
      if (isCompared) {
        updated = state.comparedPropertyIds.filter((pid) => pid !== id);
      } else {
        if (state.comparedPropertyIds.length >= 4) {
          // Limit to 4 properties
          return state;
        }
        updated = [...state.comparedPropertyIds, id];
      }
      return { ...state, comparedPropertyIds: updated };
    }),

  clearComparedProperties: () => set({ comparedPropertyIds: [] }),
}));

if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {
    console.warn("Google Maps authentication failed. Engaging interactive Vector SVG backup.");
    useMapFilterStore.getState().setFilters({ useMockFallback: true });
  };
}

