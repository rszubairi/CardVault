import { create } from 'zustand';
import { Contact } from '../types';

interface ContactState {
  contacts: Contact[];
  selectedContact: Contact | null;
  searchQuery: string;
  activeTag: string | null;

  setContacts: (contacts: Contact[]) => void;
  upsertContact: (contact: Contact) => void;
  removeContact: (id: string) => void;
  setSelectedContact: (contact: Contact | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveTag: (tag: string | null) => void;
}

export const useContactStore = create<ContactState>((set) => ({
  contacts: [],
  selectedContact: null,
  searchQuery: '',
  activeTag: null,

  setContacts: (contacts) =>
    set({ contacts }),

  upsertContact: (contact) =>
    set((state) => {
      const idx = state.contacts.findIndex((c) => c._id === contact._id);
      if (idx >= 0) {
        const updated = [...state.contacts];
        updated[idx] = contact;
        return { contacts: updated };
      }
      return { contacts: [contact, ...state.contacts] };
    }),

  removeContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c._id !== id),
    })),

  setSelectedContact: (selectedContact) =>
    set({ selectedContact }),

  setSearchQuery: (searchQuery) =>
    set({ searchQuery }),

  setActiveTag: (activeTag) =>
    set({ activeTag }),
}));
