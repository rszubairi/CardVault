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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { parseVcf, parseCsv, deduplicateByEmail, ImportedContact } from '../../src/lib/importContacts';

type ImportState = 'idle' | 'picking' | 'parsing' | 'importing' | 'done';

interface ImportResult {
  total:    number;
  imported: number;
  skipped:  number;
}

export default function ImportScreen() {
  const router      = useRouter();
  const { user }    = useAuthStore();
  const createContact = useMutation(api.contacts.create);
  const existingContacts = useQuery(
    api.contacts.list,
    user ? { userId: user._id } : 'skip',
  );

  const [state,    setState]    = useState<ImportState>('idle');
  const [preview,  setPreview]  = useState<ImportedContact[] | null>(null);
  const [result,   setResult]   = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);

  const pickFile = async () => {
    setState('picking');
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/vcard', 'text/x-vcard',
               'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets?.[0]) {
        setState('idle');
        return;
      }

      const asset = res.assets[0];
      setFileName(asset.name);
      setState('parsing');

      const content = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      let parsed: ImportedContact[] = [];
      const lower = asset.name.toLowerCase();
      if (lower.endsWith('.vcf') || lower.endsWith('.vcard')) {
        parsed = parseVcf(content);
      } else if (lower.endsWith('.csv')) {
        parsed = parseCsv(content);
      } else {
        // Try VCF first, fall back to CSV
        if (content.includes('BEGIN:VCARD')) {
          parsed = parseVcf(content);
        } else {
          parsed = parseCsv(content);
        }
      }

      if (parsed.length === 0) {
        Alert.alert('No Contacts Found', 'Could not parse any contacts from this file. Make sure it is a valid CSV or VCF file.');
        setState('idle');
        return;
      }

      setPreview(parsed);
      setState('idle');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not read file.');
      setState('idle');
    }
  };

  const handleImport = async () => {
    if (!preview || !user || !existingContacts) return;
    setState('importing');

    const { toImport, skipped } = deduplicateByEmail(preview, existingContacts);
    let imported = 0;

    for (let i = 0; i < toImport.length; i++) {
      const c = toImport[i];
      setProgress(Math.round(((i + 1) / toImport.length) * 100));
      try {
        await createContact({
          userId:      user._id,
          firstName:   c.firstName,
          lastName:    c.lastName,
          designation: c.designation || undefined,
          company:     c.company     || undefined,
          email:       c.email       || undefined,
          phone:       c.phone       || undefined,
          mobile:      c.mobile      || undefined,
          website:     c.website     || undefined,
          address:     c.address     || undefined,
          linkedinUrl: c.linkedinUrl || undefined,
          tags:        c.tags ?? [],
          favorite:    false,
          source:      'import',
          isShared:    false,
        });
        imported++;
      } catch {
        // Skip contacts that fail (e.g., validation errors)
      }
    }

    setResult({ total: preview.length, imported, skipped: skipped + (toImport.length - imported) });
    setPreview(null);
    setState('done');
  };

  const reset = () => {
    setState('idle');
    setPreview(null);
    setResult(null);
    setFileName('');
    setProgress(0);
  };

  if (state === 'done' && result) {
    return (
      <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#94A3B8" />
          </TouchableOpacity>
          <Text className="text-slate-50 text-lg font-bold">Import Complete</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-emerald-900/40 rounded-full items-center justify-center mb-6">
            <Ionicons name="checkmark-circle" size={44} color="#10B981" />
          </View>
          <Text className="text-slate-50 text-xl font-bold mb-6">Import Successful</Text>
          <View className="w-full gap-3">
            <Card className="p-4 flex-row justify-between">
              <Text className="text-slate-400 text-sm">Total in file</Text>
              <Text className="text-slate-200 text-sm font-semibold">{result.total}</Text>
            </Card>
            <Card className="p-4 flex-row justify-between">
              <Text className="text-slate-400 text-sm">Imported</Text>
              <Text className="text-emerald-400 text-sm font-semibold">{result.imported}</Text>
            </Card>
            <Card className="p-4 flex-row justify-between">
              <Text className="text-slate-400 text-sm">Skipped (duplicates)</Text>
              <Text className="text-amber-400 text-sm font-semibold">{result.skipped}</Text>
            </Card>
          </View>
          <Button label="View Contacts" fullWidth className="mt-8" onPress={() => router.replace('/(app)/(tabs)contacts')} />
          <Button label="Import Another" variant="ghost" fullWidth className="mt-2" onPress={reset} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-slate-50 text-lg font-bold">Import Contacts</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Format guide */}
        <Card className="p-4 mb-6">
          <Text className="text-slate-300 text-sm font-semibold mb-3">Supported Formats</Text>
          {[
            { icon: 'person-circle-outline', label: 'VCF / vCard', desc: 'Exported from any Contacts app', color: '#10B981' },
            { icon: 'grid-outline',          label: 'CSV',          desc: 'Exported from Google Contacts, HubSpot, LinkedIn', color: '#3B82F6' },
          ].map(({ icon, label, desc, color }) => (
            <View key={label} className="flex-row items-center mb-2">
              <Ionicons name={icon as any} size={18} color={color} />
              <View className="ml-3">
                <Text className="text-slate-200 text-sm">{label}</Text>
                <Text className="text-slate-500 text-xs">{desc}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Importing progress */}
        {state === 'importing' && (
          <Card className="p-6 items-center mb-6">
            <ActivityIndicator color="#6366F1" size="large" />
            <Text className="text-slate-300 text-sm mt-3">
              Importing contactsâ€¦ {progress}%
            </Text>
            <View className="w-full bg-surface-700 rounded-full h-2 mt-4">
              <View
                className="bg-primary-500 rounded-full h-2"
                style={{ width: `${progress}%` }}
              />
            </View>
          </Card>
        )}

        {/* Parsing indicator */}
        {state === 'parsing' && (
          <Card className="p-6 items-center mb-6">
            <ActivityIndicator color="#6366F1" size="large" />
            <Text className="text-slate-300 text-sm mt-3">Reading fileâ€¦</Text>
          </Card>
        )}

        {/* Preview */}
        {preview && state === 'idle' && (
          <Card className="p-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-slate-300 text-sm font-semibold">Preview â€” {fileName}</Text>
              <Text className="text-primary-400 text-sm">{preview.length} contacts</Text>
            </View>
            {preview.slice(0, 5).map((c, i) => (
              <View key={i} className="py-2.5 border-b border-surface-700 last:border-0">
                <Text className="text-slate-200 text-sm">
                  {c.firstName} {c.lastName}
                </Text>
                {(c.company || c.email) && (
                  <Text className="text-slate-500 text-xs mt-0.5">
                    {[c.company, c.email].filter(Boolean).join(' Â· ')}
                  </Text>
                )}
              </View>
            ))}
            {preview.length > 5 && (
              <Text className="text-slate-500 text-xs mt-2 text-center">
                +{preview.length - 5} moreâ€¦
              </Text>
            )}
          </Card>
        )}

        {/* Actions */}
        {preview ? (
          <>
            <Button
              label={`Import ${preview.length} Contacts`}
              fullWidth
              onPress={handleImport}
              disabled={state === 'importing'}
            />
            <Button
              label="Choose Different File"
              variant="ghost"
              fullWidth
              onPress={reset}
              className="mt-2"
            />
          </>
        ) : (
          <Button
            label={state === 'picking' ? 'Openingâ€¦' : 'Choose File'}
            fullWidth
            loading={state === 'picking' || state === 'parsing'}
            onPress={pickFile}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

