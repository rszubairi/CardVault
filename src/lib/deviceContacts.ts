import * as Contacts from 'expo-contacts';
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

function toDeviceContact(c: ConvexContact): Contacts.Contact {
  const contact: Contacts.Contact = {
    contactType: Contacts.ContactTypes.Person,
    firstName:   c.firstName,
    lastName:    c.lastName,
    jobTitle:    c.designation,
    company:     c.company,
    note:        `CardVault:${c._id}`,
  };

  if (c.email) {
    contact.emails = [{ email: c.email, label: 'work', id: '0' }];
  }

  const phones: Contacts.PhoneNumber[] = [];
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

  // Collect CardVault IDs already written to device contacts via the note field
  const existing = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Note] });
  const alreadySynced = new Set<string>();
  for (const dc of existing.data) {
    const match = dc.note?.match(/^CardVault:(.+)$/);
    if (match) alreadySynced.add(match[1]);
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
