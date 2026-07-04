import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const UPDATED = 'July 4, 2026';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: [
      'Account data: your name, email address, and profile photo provided when you sign in with Google or LinkedIn.',
      'Contact data: business card images you scan, and the contact details extracted from them (name, company, title, email, phone, address, LinkedIn URL).',
      'Usage data: which features you use, scan counts, follow-up activity, and interaction history — used to improve the product.',
      'Device data: push notification token, device platform (iOS/Android), and app version.',
      'Camera, microphone, and calendar access: used only when you actively use the scan, voice note, or event-linking features. We do not record or store audio or video streams.',
      'Device contacts: if you enable "Sync to Phone", scanned cards are written to your local contacts app. This data stays on your device.',
      'Biometric data: we do not collect biometric data. Face ID / fingerprint authentication is handled entirely by your device OS and never transmitted to us.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      'To operate the CardVault service — storing, retrieving, and syncing your contacts across devices.',
      'To send push notifications you configure (follow-up reminders, org access changes).',
      'To process payments via Stripe for Pro and Enterprise subscriptions.',
      'To improve OCR and AI extraction accuracy using anonymised scan data.',
      'We do not sell your personal information or contact data to any third party.',
    ],
  },
  {
    title: '3. Data Storage & Security',
    body: [
      'Your data is stored in Convex, a cloud database with encryption at rest (AES-256) and in transit (TLS 1.3).',
      'Optional PIN encryption: if you enable the PIN lock, sensitive contact fields are encrypted client-side on your device before upload. The encryption key is derived from your PIN and never leaves your device.',
      'Payment details are handled exclusively by Stripe and are never stored on CardVault servers.',
    ],
  },
  {
    title: '4. Sharing of Information',
    body: [
      'We share data only with the following service providers, strictly to operate the product:',
      '• Convex — cloud database',
      '• Stripe — payment processing',
      '• Expo / Firebase — push notifications',
      '• Google — sign-in and OCR services',
      'We may disclose data to law enforcement when legally required.',
      'We do not share data with advertisers or data brokers.',
    ],
  },
  {
    title: '5. Enterprise Plans',
    body: [
      'Within Enterprise organizations, contacts you explicitly mark as "shared" are visible to other members of your organization.',
      'Organization admins can view team activity logs (who scanned, exported, or deleted contacts) and can restrict member permissions (export, delete, edit).',
      'If an admin removes you from an organization, your access is revoked and shared org contacts are automatically deleted from your device.',
      'The org admin cannot access your private (non-shared) contacts.',
    ],
  },
  {
    title: '6. Data Retention',
    body: [
      'We retain your data for as long as your account is active.',
      'If you delete your account, all associated contact data is permanently deleted within 30 days, except where retention is required by applicable law.',
      'You can export your contacts at any time from the Export screen before deleting your account.',
    ],
  },
  {
    title: '7. Your Rights',
    body: [
      'You have the right to access, correct, or delete your personal data at any time.',
      'You can export your contacts as a CSV or vCard from the app.',
      'To delete your account or request a data export, email privacy@cardvault.app. We respond within 30 days.',
      'If you are in the EEA or UK, you may also lodge a complaint with your local data protection authority.',
    ],
  },
  {
    title: '8. Children',
    body: [
      'CardVault is not directed at children under 13. We do not knowingly collect personal information from children. If we discover we have inadvertently collected data from a child, we will delete it promptly.',
    ],
  },
  {
    title: '9. Changes to This Policy',
    body: [
      'We may update this policy periodically. We will notify you of material changes via an in-app notice or email at least 14 days before they take effect. Continued use of the app after that date constitutes acceptance of the updated policy.',
    ],
  },
  {
    title: '10. Contact',
    body: [
      'Questions or privacy requests? Email us at privacy@cardvault.app.',
    ],
  },
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#94A3B8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: {UPDATED}</Text>

        <Text style={styles.intro}>
          CardVault is built around the principle that your contact data is yours. This policy explains what we collect, why, and how you can control it.
        </Text>

        {SECTIONS.map(({ title, body }) => (
          <View key={title} style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {body.map((line, i) => (
              <Text key={i} style={styles.sectionBody}>{line}</Text>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={styles.emailLink}
          onPress={() => Linking.openURL('mailto:privacy@cardvault.app')}
        >
          <Ionicons name="mail-outline" size={15} color="#6366F1" style={{ marginRight: 6 }} />
          <Text style={styles.emailText}>privacy@cardvault.app</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          &copy; {new Date().getFullYear()} CardVault. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },

  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },

  updated: { fontSize: 12, color: '#475569', marginBottom: 16 },

  intro: {
    fontSize:        14,
    color:           '#94A3B8',
    lineHeight:      22,
    marginBottom:    28,
    paddingBottom:   20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },

  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#E2E8F0', marginBottom: 8 },
  sectionBody:  { fontSize: 13, color: '#94A3B8', lineHeight: 21, marginBottom: 5 },

  emailLink: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderRadius:   10,
    borderWidth:    1,
    borderColor:    'rgba(99,102,241,0.2)',
    alignSelf:      'flex-start',
  },
  emailText: { color: '#818CF8', fontSize: 13, fontWeight: '600' },

  footer: { fontSize: 11, color: '#334155', textAlign: 'center' },
});
