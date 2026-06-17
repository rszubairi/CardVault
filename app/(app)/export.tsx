import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Card from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { exportVcf, exportCsv, exportXlsx, exportPdf } from '../../src/lib/export';
import type { Contact } from '../../src/types';

type ExportFormat = 'vcf' | 'csv' | 'xlsx' | 'pdf';

const FORMATS: { id: ExportFormat; label: string; ext: string; icon: string; desc: string; color: string }[] = [
  { id: 'vcf',  label: 'vCard',  ext: '.vcf',  icon: 'person-circle-outline', desc: 'Import into Contacts app on any device', color: '#10B981' },
  { id: 'csv',  label: 'CSV',    ext: '.csv',  icon: 'grid-outline',          desc: 'Spreadsheet-compatible, opens in Excel / Sheets', color: '#3B82F6' },
  { id: 'xlsx', label: 'Excel',  ext: '.xlsx', icon: 'document-text-outline', desc: 'Formatted Excel workbook with all fields', color: '#6366F1' },
  { id: 'pdf',  label: 'PDF',    ext: '.pdf',  icon: 'print-outline',         desc: 'Printable contact directory', color: '#F59E0B' },
];

export default function ExportScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();

  const contacts = useQuery(
    api.contacts.list,
    user ? { userId: user._id } : 'skip',
  );

  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (!contacts || contacts.length === 0) {
      Alert.alert('No Contacts', 'You have no contacts to export.');
      return;
    }
    setExporting(format);
    try {
      switch (format) {
        case 'vcf':  await exportVcf(contacts  as Contact[]); break;
        case 'csv':  await exportCsv(contacts  as Contact[]); break;
        case 'xlsx': await exportXlsx(contacts as Contact[]); break;
        case 'pdf':  await exportPdf(contacts  as Contact[]); break;
      }
    } catch (err: unknown) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : 'Could not export contacts.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-slate-50 text-lg font-bold">Export Contacts</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Count */}
        <Card className="p-4 mb-6 flex-row items-center">
          <View className="w-10 h-10 bg-primary-900/50 rounded-xl items-center justify-center mr-4">
            <Ionicons name="people" size={22} color="#6366F1" />
          </View>
          <View>
            {contacts === undefined ? (
              <ActivityIndicator color="#6366F1" />
            ) : (
              <>
                <Text className="text-slate-50 text-xl font-bold">{contacts.length}</Text>
                <Text className="text-slate-400 text-xs">contacts will be exported</Text>
              </>
            )}
          </View>
        </Card>

        <Text className="text-slate-400 text-xs uppercase tracking-widest mb-4 font-semibold">
          Choose Format
        </Text>

        {FORMATS.map(({ id, label, ext, icon, desc, color }) => {
          const busy = exporting === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => handleExport(id)}
              disabled={exporting !== null}
              className="mb-3"
            >
              <Card className="p-4 flex-row items-center">
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: color + '22' }}
                >
                  {busy ? (
                    <ActivityIndicator color={color} />
                  ) : (
                    <Ionicons name={icon as any} size={24} color={color} />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-slate-200 text-sm font-semibold">{label}</Text>
                    <Text className="text-slate-500 text-xs">{ext}</Text>
                  </View>
                  <Text className="text-slate-400 text-xs mt-0.5">{desc}</Text>
                </View>
                <Ionicons name="download-outline" size={20} color={exporting ? '#334155' : '#475569'} />
              </Card>
            </TouchableOpacity>
          );
        })}

        <Text className="text-slate-600 text-xs text-center mt-4">
          All fields are included in CSV and Excel exports.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

