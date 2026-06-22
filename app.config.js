const variant = process.env.APP_VARIANT ?? 'consumer';
const isEnterprise = variant === 'enterprise';

const consumer = {
  name: 'CardVault',
  slug: 'cardvault',
  scheme: 'cardvault',
  ios: {
    bundleIdentifier: 'com.cardvault.ios',
    googleServicesFile: './GoogleService-Info.plist',
  },
  android: {
    package: 'com.cardvault.android',
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0F172A',
    },
  },
  splash: {
    backgroundColor: '#0F172A',
    image: './assets/splash.png',
    resizeMode: 'contain',
  },
  icon: './assets/icon.png',
  notificationColor: '#6366F1',
};

const enterprise = {
  name: 'CardVault Teams',
  slug: 'cardvault-enterprise',
  scheme: 'cardvault-enterprise',
  ios: {
    bundleIdentifier: 'com.cardvault.enterprise',
    googleServicesFile: './GoogleService-Info.plist',
  },
  android: {
    package: 'com.cardvault.enterprise',
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon-enterprise.png',
      backgroundColor: '#0A0905',
    },
  },
  splash: {
    backgroundColor: '#0A0905',
    image: './assets/splash-enterprise.png',
    resizeMode: 'contain',
  },
  icon: './assets/icon-enterprise.png',
  notificationColor: '#D4AF37',
};

const active = isEnterprise ? enterprise : consumer;

export default {
  expo: {
    name: active.name,
    slug: active.slug,
    scheme: active.scheme,
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    assetBundlePatterns: ['**/*'],
    icon: active.icon,

    ios: {
      supportsTablet: true,
      bundleIdentifier: active.ios.bundleIdentifier,
      googleServicesFile: active.ios.googleServicesFile,
      infoPlist: {
        NSCameraUsageDescription: `${active.name} needs camera access to scan business cards.`,
        NSPhotoLibraryUsageDescription: `${active.name} needs photo library access to save and import business card images.`,
        NSCalendarsUsageDescription: `${active.name} uses your calendar to link contacts to events where you met them.`,
        NSMicrophoneUsageDescription: `${active.name} needs microphone access to record voice notes.`,
        NSFaceIDUsageDescription: `${active.name} uses Face ID to securely lock your contacts.`,
        NSContactsUsageDescription: `${active.name} syncs your scanned business cards to your device contacts.`,
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      googleServicesFile: active.android.googleServicesFile,
      package: active.android.package,
      adaptiveIcon: active.android.adaptiveIcon,
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'com.googleusercontent.apps.295671462958-isg76jc0rjt3tl40n3r5l8cq46ke4r9k',
              host: 'oauth2redirect',
              pathPrefix: '/google',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: active.scheme, host: 'auth' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: active.scheme, host: 'stripe' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: active.scheme, host: 'upgrade-success' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: active.scheme, host: 'upgrade-cancel' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'READ_CALENDAR',
        'WRITE_CALENDAR',
        'RECORD_AUDIO',
        'USE_BIOMETRIC',
        'USE_FINGERPRINT',
        'VIBRATE',
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.USE_BIOMETRIC',
        'android.permission.USE_FINGERPRINT',
        'READ_CONTACTS',
        'WRITE_CONTACTS',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      ],
    },

    web: {
      bundler: 'metro',
      favicon: './assets/favicon.png',
    },

    plugins: [
      [
        'expo-build-properties',
        { ios: { useFrameworks: 'static' } },
      ],
      './plugins/withModularHeaders',
      'expo-router',
      '@react-native-google-signin/google-signin',
      'expo-secure-store',
      [
        'expo-splash-screen',
        {
          backgroundColor: active.splash.backgroundColor,
          image: active.splash.image,
          resizeMode: active.splash.resizeMode,
        },
      ],
      [
        'expo-camera',
        { cameraPermission: `${active.name} needs camera access to scan business cards.` },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: active.notificationColor,
        },
      ],
      [
        'expo-local-authentication',
        { faceIDPermission: `${active.name} uses Face ID to protect your contacts.` },
      ],
      'expo-audio',
      '@react-native-firebase/app',
      '@react-native-firebase/crashlytics',
      '@react-native-firebase/auth',
    ],

    experiments: { typedRoutes: true },

    extra: {
      appVariant: variant,
      router: {},
      eas: {
        projectId: '122beacb-9b7b-41bd-91cc-0efc20f2b5eb',
      },
    },

    owner: 'rzubairi',
  },
};
