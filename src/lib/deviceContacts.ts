import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ID_MAP_KEY = '@cardvault/device_contact_ids';
const SYNCED_AT_KEY = '@cardvault/contacts_synced_at';

type ConvexContact = {
  _id: string;
  firstName: string;
  lastName: string;
  designation?: string;
  company?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
};

// ─── ID map helpers ───────────────────────────────────────────────────────────

async function loadIdMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(ID_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveIdMap(map: Record<string, string>) {
  await AsyncStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
}

// ─── Build a Contacts.Contact from a Convex contact ──────────────────────────

function toDeviceContact(c: ConvexContact): any {
  const contact: any = {
    contactType: Contacts.ContactTypes.Person,
    firstName:   c.firstName,
    lastName:    c.lastName,
    jobTitle:    c.designation,
    company:     c.company,
  };

  if (Platform.OS !== 'ios') {
    contact.note = `CardVault:${c._id}`;
  }

  if (c.email) {
    contact.emails = [{ email: c.email, label: 'work', id: '0' }];
  }

  const phones: any[] = [];
  if (c.phone)  phones.push({ number: c.phone,  label: 'work',   id: '0' });
  if (c.mobile) phones.push({ number: c.mobile, label: 'mobile', id: '1' });
  if (phones.length) contact.phoneNumbers = phones;

  if (c.website) {
    contact.urls = [{ url: c.website, label: 'work', id: '0' }];
  }

  if (c.address) {
    contact.addresses = [{
      street:  c.address,
      label:   'work',
      id:      '0',
      city:    '',
      region:  '',
      country: '',
      postalCode: '',
    }];
  }

  return contact;
}

// ─── Request permission ───────────────────────────────────────────────────────

export async function requestContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Push a single contact to the device ─────────────────────────────────────

export async function pushContactToDevice(c: ConvexContact): Promise<boolean> {
  try {
    const granted = await requestContactsPermission();
    if (!granted) return false;

    const idMap = await loadIdMap();
    const deviceId = idMap[c._id];

    if (deviceId) {
      // Update existing device contact
      await Contacts.updateContactAsync({ ...toDeviceContact(c), id: deviceId });
    } else {
      // Create new device contact and record its ID
      const newId = await Contacts.addContactAsync(toDeviceContact(c));
      idMap[c._id] = newId;
      await saveIdMap(idMap);
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Bulk sync all Convex contacts to the device (new device) ────────────────

export async function syncAllToDevice(contacts: ConvexContact[]): Promise<void> {
  const granted = await requestContactsPermission();
  if (!granted) return;

  const idMap = await loadIdMap();
  const alreadySynced = new Set<string>();

  if (Platform.OS === 'ios') {
    // On iOS, accessing the note field is restricted by Apple and crashes the app.
    // We fetch contacts with names, emails, and phones to construct a lookup map.
    const existing = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.Emails,
        Contacts.Fields.PhoneNumbers,
      ],
    });

    // Create a lookup for existing contacts by name/email/phone
    const existingMap = new Map<string, string>(); // key -> device ID
    for (const dc of existing.data) {
      if (!dc.id) continue;
      const nameKey = `${dc.firstName ?? ''}|${dc.lastName ?? ''}`.toLowerCase().trim();
      if (nameKey && nameKey !== '|') {
        existingMap.set(`name:${nameKey}`, dc.id);
      }
      if (dc.emails) {
        for (const emailObj of dc.emails) {
          if (emailObj.email) {
            existingMap.set(`email:${emailObj.email.toLowerCase().trim()}`, dc.id);
          }
        }
      }
      if (dc.phoneNumbers) {
        for (const phoneObj of dc.phoneNumbers) {
          if (phoneObj.number) {
            const cleanPhone = phoneObj.number.replace(/\D/g, '');
            if (cleanPhone) {
              existingMap.set(`phone:${cleanPhone}`, dc.id);
            }
          }
        }
      }
    }

    for (const c of contacts) {
      // 1. Check idMap (AsyncStorage mapping)
      if (idMap[c._id]) {
        alreadySynced.add(c._id);
        continue;
      }

      // 2. Check for matches in existing device contacts to prevent duplicates
      let matchedDeviceId: string | undefined;

      if (c.email) {
        matchedDeviceId = existingMap.get(`email:${c.email.toLowerCase().trim()}`);
      }
      if (!matchedDeviceId && (c.phone || c.mobile)) {
        const cleanPhone = (c.phone || c.mobile || '').replace(/\D/g, '');
        if (cleanPhone) {
          matchedDeviceId = existingMap.get(`phone:${cleanPhone}`);
        }
      }
      if (!matchedDeviceId) {
        const nameKey = `${c.firstName ?? ''}|${c.lastName ?? ''}`.toLowerCase().trim();
        if (nameKey && nameKey !== '|') {
          matchedDeviceId = existingMap.get(`name:${nameKey}`);
        }
      }

      if (matchedDeviceId) {
        // Contact is already on the device, map it
        idMap[c._id] = matchedDeviceId;
        alreadySynced.add(c._id);
      }
    }
  } else {
    // On Android, we can safely use the note field
    const existing = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Note] });
    for (const dc of existing.data) {
      const match = dc.note?.match(/^CardVault:(.+)$/);
      if (match) alreadySynced.add(match[1]);
    }
  }

  for (const c of contacts) {
    if (alreadySynced.has(c._id)) continue; // already on device
    try {
      const newId = await Contacts.addContactAsync(toDeviceContact(c));
      idMap[c._id] = newId;
    } catch {
      // skip individual failures silently
    }
  }

  await saveIdMap(idMap);
  await AsyncStorage.setItem(SYNCED_AT_KEY, Date.now().toString());
}

// ─── Check if a full sync has been done on this device ───────────────────────

export async function hasBeenSynced(): Promise<boolean> {
  const val = await AsyncStorage.getItem(SYNCED_AT_KEY);
  return val !== null;
}
