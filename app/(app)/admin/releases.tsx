import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../src/stores/authStore';
import { Doc, Id } from '../../../convex/_generated/dataModel';

type Release = Doc<'appReleases'>;

type ReleaseType = 'major' | 'minor';
type Platform    = 'ios' | 'android' | 'both';
type Edition     = 'personal' | 'enterprise' | 'all';

// ─── Form modal ───────────────────────────────────────────────────────────────

interface FormState {
  version:      string;
  releaseType:  ReleaseType;
  platform:     Platform;
  edition:      Edition;
  releaseNotes: string;
  iosUrl:       string;
  androidUrl:   string;
}

const DEFAULT_FORM: FormState = {
  version:      '',
  releaseType:  'minor',
  platform:     'both',
  edition:      'all',
  releaseNotes: '',
  iosUrl:       '',
  androidUrl:   '',
};

function SegmentedPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-slate-400 text-xs mb-2 ml-1">{label}</Text>
      <View className="flex-row gap-x-2">
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 py-2 rounded-xl items-center border ${
              value === opt.value
                ? 'bg-primary-500 border-primary-500'
                : 'bg-surface-700 border-surface-600'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                value === opt.value ? 'text-white' : 'text-slate-400'
              }`}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ReleaseFormModal({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: FormState;
  onClose: () => void;
  onSave:  (form: FormState) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) setForm(initial);
  }, [visible]);

  const set = (key: keyof FormState) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.version.trim()) {
      Alert.alert('Version required', 'Please enter a version number (e.g. 1.2.0).');
      return;
    }
    if (!form.releaseNotes.trim()) {
      Alert.alert('Release notes required', 'Please add release notes.');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save release.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-surface-900">
        {/* Header */}
        <View className="flex-row items-center px-5 pt-12 pb-4 border-b border-surface-700">
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <Text className="text-slate-50 text-lg font-semibold ml-4 flex-1">
            {initial.version ? 'Edit Release' : 'New Release'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color="#6366F1" />
              : <Text className="text-primary-400 text-base font-semibold">Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
          {/* Version */}
          <View className="mb-4">
            <Text className="text-slate-400 text-xs mb-2 ml-1">Version Number</Text>
            <View className="flex-row items-center bg-surface-700 rounded-xl px-4 py-3 border border-surface-600">
              <TextInput
                value={form.version}
                onChangeText={set('version')}
                placeholder="e.g. 1.2.0"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                className="flex-1 text-slate-100 text-base"
                style={{ color: '#f1f5f9' }}
              />
            </View>
          </View>

          <SegmentedPicker
            label="Release Type"
            options={[
              { label: 'Minor (optional)', value: 'minor' },
              { label: 'Major (required)', value: 'major' },
            ]}
            value={form.releaseType}
            onChange={(v) => setForm((f) => ({ ...f, releaseType: v }))}
          />

          {form.releaseType === 'major' && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-400 text-xs leading-5">
                Major releases force users to update before they can continue using the app. Use only for breaking changes.
              </Text>
            </View>
          )}

          <SegmentedPicker
            label="Platform"
            options={[
              { label: 'iOS', value: 'ios' },
              { label: 'Android', value: 'android' },
              { label: 'Both', value: 'both' },
            ]}
            value={form.platform}
            onChange={(v) => setForm((f) => ({ ...f, platform: v }))}
          />

          <SegmentedPicker
            label="Edition"
            options={[
              { label: 'Personal', value: 'personal' },
              { label: 'Enterprise', value: 'enterprise' },
              { label: 'All', value: 'all' },
            ]}
            value={form.edition}
            onChange={(v) => setForm((f) => ({ ...f, edition: v }))}
          />

          {/* Store URLs */}
          <View className="mb-4">
            <Text className="text-slate-400 text-xs mb-2 ml-1">App Store URL (iOS)</Text>
            <View className="flex-row items-center bg-surface-700 rounded-xl px-4 py-3 border border-surface-600">
              <TextInput
                value={form.iosUrl}
                onChangeText={set('iosUrl')}
                placeholder="https://apps.apple.com/..."
                placeholderTextColor="#475569"
                autoCapitalize="none"
                keyboardType="url"
                className="flex-1 text-slate-100 text-sm"
                style={{ color: '#f1f5f9' }}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-slate-400 text-xs mb-2 ml-1">Play Store URL (Android)</Text>
            <View className="flex-row items-center bg-surface-700 rounded-xl px-4 py-3 border border-surface-600">
              <TextInput
                value={form.androidUrl}
                onChangeText={set('androidUrl')}
                placeholder="https://play.google.com/store/apps/..."
                placeholderTextColor="#475569"
                autoCapitalize="none"
                keyboardType="url"
                className="flex-1 text-slate-100 text-sm"
                style={{ color: '#f1f5f9' }}
              />
            </View>
          </View>

          {/* Release notes */}
          <View className="mb-8">
            <Text className="text-slate-400 text-xs mb-2 ml-1">Release Notes</Text>
            <View className="bg-surface-700 rounded-xl px-4 py-3 border border-surface-600">
              <TextInput
                value={form.releaseNotes}
                onChangeText={set('releaseNotes')}
                placeholder="Describe what's new in this release…"
                placeholderTextColor="#475569"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                className="text-slate-100 text-sm"
                style={{ color: '#f1f5f9', minHeight: 140 }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Release card ──────────────────────────────────────────────────────────────

function ReleaseCard({
  release,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  release:     Release;
  onEdit:      () => void;
  onPublish:   () => void;
  onUnpublish: () => void;
  onDelete:    () => void;
}) {
  const isMajor = release.releaseType === 'major';

  return (
    <View className="bg-surface-800 border border-surface-700 rounded-2xl p-4 mb-3">
      <View className="flex-row items-start mb-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-x-2 mb-1">
            <Text className="text-slate-50 text-base font-semibold">v{release.version}</Text>
            <View className={`px-2 py-0.5 rounded-full ${isMajor ? 'bg-red-500/20' : 'bg-primary-500/20'}`}>
              <Text className={`text-xs font-medium ${isMajor ? 'text-red-400' : 'text-primary-400'}`}>
                {isMajor ? 'Major' : 'Minor'}
              </Text>
            </View>
            <View className={`px-2 py-0.5 rounded-full ${release.isPublished ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
              <Text className={`text-xs font-medium ${release.isPublished ? 'text-emerald-400' : 'text-slate-400'}`}>
                {release.isPublished ? 'Published' : 'Draft'}
              </Text>
            </View>
          </View>
          <Text className="text-slate-500 text-xs">
            {release.platform} · {release.edition} ·{' '}
            {new Date(release.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <Text className="text-slate-300 text-sm leading-5 mb-4" numberOfLines={3}>
        {release.releaseNotes}
      </Text>

      {/* Actions */}
      <View className="flex-row gap-x-2">
        <TouchableOpacity
          onPress={onEdit}
          className="flex-row items-center gap-x-1 px-3 py-2 bg-surface-700 rounded-xl"
        >
          <Ionicons name="pencil-outline" size={14} color="#94a3b8" />
          <Text className="text-slate-400 text-xs">Edit</Text>
        </TouchableOpacity>

        {release.isPublished ? (
          <TouchableOpacity
            onPress={onUnpublish}
            className="flex-row items-center gap-x-1 px-3 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20"
          >
            <Ionicons name="eye-off-outline" size={14} color="#F59E0B" />
            <Text className="text-amber-400 text-xs">Unpublish</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onPublish}
            className="flex-row items-center gap-x-1 px-3 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20"
          >
            <Ionicons name="globe-outline" size={14} color="#10B981" />
            <Text className="text-emerald-400 text-xs">Publish</Text>
          </TouchableOpacity>
        )}

        {!release.isPublished && (
          <TouchableOpacity
            onPress={onDelete}
            className="flex-row items-center gap-x-1 px-3 py-2 bg-red-500/10 rounded-xl border border-red-500/20"
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
            <Text className="text-red-400 text-xs">Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AdminReleasesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const createReleaseMutation    = useMutation(api.releases.createRelease);
  const updateReleaseMutation    = useMutation(api.releases.updateRelease);
  const publishReleaseMutation   = useMutation(api.releases.publishRelease);
  const unpublishReleaseMutation = useMutation(api.releases.unpublishRelease);
  const deleteReleaseMutation    = useMutation(api.releases.deleteRelease);

  const releases = useQuery(
    api.releases.listAllReleases,
    user?._id ? { adminUserId: user._id as any } : 'skip',
  );

  const [formVisible, setFormVisible]   = useState(false);
  const [editingId, setEditingId]       = useState<Id<'appReleases'> | null>(null);
  const [editingForm, setEditingForm]   = useState<FormState>(DEFAULT_FORM);
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');

  const filtered = (releases ?? []).filter((r) => {
    if (filterPublished === 'published') return r.isPublished;
    if (filterPublished === 'draft')     return !r.isPublished;
    return true;
  });

  const openCreate = () => {
    setEditingId(null);
    setEditingForm(DEFAULT_FORM);
    setFormVisible(true);
  };

  const openEdit = (release: Release) => {
    setEditingId(release._id);
    setEditingForm({
      version:      release.version,
      releaseType:  release.releaseType,
      platform:     release.platform,
      edition:      release.edition,
      releaseNotes: release.releaseNotes,
      iosUrl:       release.iosUrl ?? '',
      androidUrl:   release.androidUrl ?? '',
    });
    setFormVisible(true);
  };

  const handleSave = async (form: FormState) => {
    if (!user?._id) return;
    const payload = {
      version:      form.version.trim(),
      releaseType:  form.releaseType,
      platform:     form.platform,
      edition:      form.edition,
      releaseNotes: form.releaseNotes.trim(),
      iosUrl:       form.iosUrl.trim() || undefined,
      androidUrl:   form.androidUrl.trim() || undefined,
    };

    if (editingId) {
      await updateReleaseMutation({ adminUserId: user._id as any, releaseId: editingId, ...payload });
    } else {
      await createReleaseMutation({ adminUserId: user._id as any, ...payload });
    }
  };

  const handlePublish = (release: Release) => {
    if (!user?._id) return;
    Alert.alert(
      'Publish Release',
      `Publish v${release.version} for ${release.platform} (${release.edition})?\n\nUsers with older versions will see the update prompt.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: () =>
            publishReleaseMutation({ adminUserId: user._id as any, releaseId: release._id }).catch((e) =>
              Alert.alert('Error', e?.message),
            ),
        },
      ],
    );
  };

  const handleUnpublish = (release: Release) => {
    if (!user?._id) return;
    Alert.alert(
      'Unpublish Release',
      `Unpublish v${release.version}? Users will no longer see this update prompt.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpublish',
          style: 'destructive',
          onPress: () =>
            unpublishReleaseMutation({ adminUserId: user._id as any, releaseId: release._id }).catch((e) =>
              Alert.alert('Error', e?.message),
            ),
        },
      ],
    );
  };

  const handleDelete = (release: Release) => {
    if (!user?._id) return;
    Alert.alert(
      'Delete Draft',
      `Delete draft v${release.version}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteReleaseMutation({ adminUserId: user._id as any, releaseId: release._id }).catch((e) =>
              Alert.alert('Error', e?.message),
            ),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-surface-700">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={22} color="#94a3b8" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-slate-50 text-xl font-bold">Release Management</Text>
          <Text className="text-slate-500 text-xs mt-0.5">Super Admin</Text>
        </View>
        <TouchableOpacity
          onPress={openCreate}
          className="bg-primary-500 rounded-xl px-4 py-2 flex-row items-center gap-x-1"
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="text-white text-sm font-semibold">New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View className="flex-row px-5 pt-4 pb-2 gap-x-2">
        {(['all', 'published', 'draft'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilterPublished(f)}
            className={`px-4 py-1.5 rounded-full ${
              filterPublished === f ? 'bg-primary-500' : 'bg-surface-700'
            }`}
          >
            <Text
              className={`text-sm font-medium capitalize ${
                filterPublished === f ? 'text-white' : 'text-slate-400'
              }`}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 40 }}>
        {releases === undefined ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator color="#6366F1" />
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="rocket-outline" size={48} color="#334155" />
            <Text className="text-slate-500 text-base mt-4">No releases yet</Text>
            <Text className="text-slate-600 text-sm mt-1">Tap "New" to create your first release.</Text>
          </View>
        ) : (
          filtered.map((release) => (
            <ReleaseCard
              key={release._id}
              release={release}
              onEdit={() => openEdit(release)}
              onPublish={() => handlePublish(release)}
              onUnpublish={() => handleUnpublish(release)}
              onDelete={() => handleDelete(release)}
            />
          ))
        )}
      </ScrollView>

      <ReleaseFormModal
        visible={formVisible}
        initial={editingForm}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}
