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
  setFilters: (filters: Partial<Omit<MapFilterState, 'setFilters' | 'toggleAmenity'>>) => void;
  toggleAmenity: (category: string) => void;
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
  setFilters: (newFilters) => set((state) => ({ ...state, ...newFilters })),
  toggleAmenity: (category) =>
    set((state) => {
      const active = state.amenityCategories.includes(category);
      const updated = active
        ? state.amenityCategories.filter((item) => item !== category)
        : [...state.amenityCategories, category];
      return { ...state, amenityCategories: updated };
    }),
}));
