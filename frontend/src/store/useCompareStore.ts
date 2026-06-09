import { create } from 'zustand';

interface CompareState {
  selectedIds: string[];
  addId: (id: string) => void;
  removeId: (id: string) => void;
  clear: () => void;
  isCompared: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  selectedIds: [],
  addId: (id: string) => {
    const { selectedIds } = get();
    if (selectedIds.includes(id)) return;
    if (selectedIds.length >= 4) {
      alert("You can compare a maximum of 4 properties at once.");
      return;
    }
    set({ selectedIds: [...selectedIds, id] });
  },
  removeId: (id: string) => {
    set({ selectedIds: get().selectedIds.filter((item) => item !== id) });
  },
  clear: () => set({ selectedIds: [] }),
  isCompared: (id: string) => get().selectedIds.includes(id),
}));
