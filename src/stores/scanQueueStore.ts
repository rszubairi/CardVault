import { create } from 'zustand';

export type ScanQueueStatus = 'processing' | 'saved' | 'duplicate' | 'needs_review' | 'error';

export interface ScanQueueItem {
  id: string;
  imageUri: string;
  status: ScanQueueStatus;
  contactName?: string;
  contactId?: string;
  message?: string;
  createdAt: number;
}

const MAX_ITEMS = 30;

interface ScanQueueState {
  items: ScanQueueItem[];
  addItem: (imageUri: string) => string;
  updateItem: (id: string, patch: Partial<ScanQueueItem>) => void;
  dismissItem: (id: string) => void;
  clearResolved: () => void;
}

export const useScanQueueStore = create<ScanQueueState>((set) => ({
  items: [],

  addItem: (imageUri) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      items: [
        { id, imageUri, status: 'processing', createdAt: Date.now() },
        ...state.items,
      ].slice(0, MAX_ITEMS),
    }));
    return id;
  },

  updateItem: (id, patch) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })),

  dismissItem: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  clearResolved: () =>
    set((state) => ({ items: state.items.filter((item) => item.status === 'processing') })),
}));
