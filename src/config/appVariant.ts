import Constants from 'expo-constants';

export type AppVariant = 'consumer' | 'enterprise';

export const APP_VARIANT: AppVariant =
  (Constants.expoConfig?.extra?.appVariant as AppVariant) ?? 'consumer';

export const isEnterprise = APP_VARIANT === 'enterprise';
export const isConsumer   = APP_VARIANT === 'consumer';
