import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { extractFromImage } from './ocr';
import { pushContactToDevice } from './deviceContacts';
import { useScanQueueStore } from '../stores/scanQueueStore';
import { useSubscriptionStore } from '../stores/subscriptionStore';

async function uploadImageToConvex(
  localUri: string,
  convex: ConvexReactClient,
): Promise<string | undefined> {
  try {
    const uploadUrl = await convex.mutation(api.contacts.generateUploadUrl, {});
    const response   = await fetch(localUri);
    const blob       = await response.blob();
    const upload     = await fetch(uploadUrl, {
      method:  'POST',
      headers: { 'Content-Type': blob.type || 'image/jpeg' },
      body:    blob,
    });
    if (!upload.ok) return undefined;
    const { storageId } = await upload.json();
    return storageId as string;
  } catch {
    return undefined;
  }
}

// Headless capture → OCR → AI review → duplicate check → save pipeline used by Express Mode.
// Runs independently of any screen so the camera can keep scanning the next card immediately.
export async function processExpressScan({
  id,
  imageUri,
  userId,
  convex,
  syncToPhone,
}: {
  id: string;
  imageUri: string;
  userId: Id<'users'>;
  convex: ConvexReactClient;
  syncToPhone: boolean;
}) {
  const { updateItem } = useScanQueueStore.getState();

  try {
    const [storageId, ocr] = await Promise.all([
      uploadImageToConvex(imageUri, convex),
      extractFromImage(imageUri),
    ]);

    let fields = {
      firstName:   ocr.firstName,
      lastName:    ocr.lastName,
      designation: ocr.designation,
      company:     ocr.company,
      email:       ocr.email,
      phone:       ocr.phone,
      mobile:      ocr.mobile,
      website:     ocr.website,
      linkedinUrl: ocr.linkedinUrl,
    };

    try {
      const corrections = await convex.action(api.ocr.reviewExtraction, {
        rawText:     ocr.rawText,
        firstName:   ocr.firstName,
        lastName:    ocr.lastName,
        designation: ocr.designation,
        company:     ocr.company,
        email:       ocr.email,
        phone:       ocr.phone,
      });
      if (corrections) {
        fields = {
          ...fields,
          ...(corrections.firstName   !== undefined ? { firstName:   corrections.firstName   ?? '' } : {}),
          ...(corrections.lastName    !== undefined ? { lastName:    corrections.lastName    ?? '' } : {}),
          ...(corrections.designation !== undefined ? { designation: corrections.designation ?? '' } : {}),
          ...(corrections.company     !== undefined ? { company:     corrections.company     ?? '' } : {}),
        };
      }
    } catch {
      // AI review failure is non-fatal — fall back to raw OCR fields
    }

    if (!fields.firstName) {
      updateItem(id, { status: 'needs_review', message: 'Could not detect a name — tap to fill in manually' });
      return;
    }

    if (fields.email || fields.phone) {
      const duplicate = await convex.query(api.contacts.findDuplicate, {
        userId,
        email: fields.email || undefined,
        phone: fields.phone || undefined,
      });
      if (duplicate) {
        updateItem(id, {
          status:      'duplicate',
          contactName: `${fields.firstName} ${fields.lastName ?? ''}`.trim(),
          contactId:   duplicate._id,
          message:     'Already in your contacts — tap to view',
        });
        return;
      }
    }

    if (!useSubscriptionStore.getState().hasScansRemaining()) {
      updateItem(id, { status: 'needs_review', message: 'Free scan limit reached — upgrade to save this card' });
      return;
    }

    const contactId = await convex.mutation(api.contacts.create, {
      userId,
      firstName:      fields.firstName,
      lastName:       fields.lastName || '',
      designation:    fields.designation || undefined,
      company:        fields.company || undefined,
      companyDomain:  ocr.companyDomain,
      country:        ocr.country,
      email:          fields.email || undefined,
      phone:          fields.phone || undefined,
      mobile:         fields.mobile || undefined,
      website:        fields.website || undefined,
      linkedinUrl:    fields.linkedinUrl || undefined,
      cardImageFront: storageId,
      tags:           [],
      favorite:       false,
      source:         'scan',
      ocrConfidence:  ocr.confidence,
      isShared:       false,
    });

    useSubscriptionStore.getState().incrementScanCount();

    if (syncToPhone) {
      pushContactToDevice({
        _id:         contactId,
        firstName:   fields.firstName,
        lastName:    fields.lastName,
        designation: fields.designation || undefined,
        company:     fields.company || undefined,
        email:       fields.email || undefined,
        phone:       fields.phone || undefined,
        mobile:      fields.mobile || undefined,
        website:     fields.website || undefined,
      });
    }

    updateItem(id, {
      status:      'saved',
      contactName: `${fields.firstName} ${fields.lastName ?? ''}`.trim(),
      contactId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not process this card';
    updateItem(id, { status: 'error', message });
  }
}
