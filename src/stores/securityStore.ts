import { create } from 'zustand';

interface SecurityState {
  biometricEnabled: boolean;
  isLocked:         boolean;
  backgroundedAt:   number | null;
  lockTimeout:      number; // seconds; 0 = lock immediately on background

  // PIN-based encryption
  encryptionEnabled: boolean;
  pinConfigured:     boolean;
  encryptionKey:     CryptoKey | null; // in-memory only; never persisted

  setBiometricEnabled:  (v: boolean)          => void;
  lock:                 ()                     => void;
  unlock:               ()                     => void;
  setBackgroundedAt:    (t: number | null)     => void;
  setLockTimeout:       (s: number)            => void;
  setEncryptionEnabled: (v: boolean)           => void;
  setPinConfigured:     (v: boolean)           => void;
  setEncryptionKey:     (key: CryptoKey | null) => void;
}

export const useSecurityStore = create<SecurityState>((set) => ({
  biometricEnabled:  false,
  isLocked:          false,
  backgroundedAt:    null,
  lockTimeout:       30,
  encryptionEnabled: false,
  pinConfigured:     false,
  encryptionKey:     null,

  setBiometricEnabled:  (biometricEnabled)  => set({ biometricEnabled }),
  lock:                 ()                  => set({ isLocked: true, encryptionKey: null }),
  unlock:               ()                  => set({ isLocked: false }),
  setBackgroundedAt:    (backgroundedAt)    => set({ backgroundedAt }),
  setLockTimeout:       (lockTimeout)       => set({ lockTimeout }),
  setEncryptionEnabled: (encryptionEnabled) => set({ encryptionEnabled }),
  setPinConfigured:     (pinConfigured)     => set({ pinConfigured }),
  setEncryptionKey:     (encryptionKey)     => set({ encryptionKey }),
}));
