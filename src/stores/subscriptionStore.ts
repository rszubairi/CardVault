import { create } from 'zustand';
import { SubscriptionPlan, SubscriptionStatus } from '../types';

interface SubscriptionState {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  scanCount: number;
  scanLimit: number;
  isPaywallVisible: boolean;

  setPlan: (plan: SubscriptionPlan) => void;
  setStatus: (status: SubscriptionStatus) => void;
  setScanCount: (count: number) => void;
  incrementScanCount: () => void;
  showPaywall: () => void;
  hidePaywall: () => void;
  isPro: () => boolean;
  hasScansRemaining: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  plan: 'free',
  status: 'active',
  scanCount: 0,
  scanLimit: 50,
  isPaywallVisible: false,

  setPlan: (plan) => set({ plan }),
  setStatus: (status) => set({ status }),
  setScanCount: (scanCount) => set({ scanCount }),

  incrementScanCount: () =>
    set((state) => {
      const newCount = state.scanCount + 1;
      const shouldShowPaywall =
        state.plan === 'free' && newCount >= state.scanLimit;
      return {
        scanCount: newCount,
        isPaywallVisible: shouldShowPaywall,
      };
    }),

  showPaywall: () => set({ isPaywallVisible: true }),
  hidePaywall: () => set({ isPaywallVisible: false }),

  isPro: () => {
    const { plan } = get();
    return plan === 'personal_pro' || plan === 'enterprise';
  },

  hasScansRemaining: () => {
    const { plan, scanCount, scanLimit } = get();
    if (plan !== 'free') return true;
    return scanCount < scanLimit;
  },
}));
