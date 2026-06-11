import { Contact } from '../types';

interface MessageContext {
  contact: Contact;
  senderName: string;
  eventName?: string;
}

export function generateWhatsAppIntro({ contact, senderName, eventName }: MessageContext): string {
  const firstName = contact.firstName;
  const meetContext = eventName ? `at ${eventName}` : 'recently';
  const company = contact.company ? `\n\nI see you're with ${contact.company} — ` : '';
  const companyNote = contact.company
    ? `would love to explore how we might collaborate.`
    : 'looking forward to staying connected.';

  return `Hi ${firstName},

Great meeting you ${meetContext}! ${company ? company + companyNote : companyNote}

Looking forward to keeping in touch.

Best regards,
${senderName}`;
}

export function generateLinkedInNote({ contact, senderName, eventName }: MessageContext): string {
  const firstName = contact.firstName;
  const meetContext = eventName ? `at ${eventName}` : 'recently';

  return `Hi ${firstName}, great meeting you ${meetContext}! Would love to stay connected and explore opportunities together. Regards, ${senderName}`;
}

export function generateFollowUpMessage(contact: Contact, senderName: string): string {
  const days = contact.metDate
    ? Math.floor((Date.now() - contact.metDate) / (1000 * 60 * 60 * 24))
    : 7;

  return `Hi ${contact.firstName},

Hope you're doing well! It was great connecting with you ${days > 1 ? `${days} days ago` : 'recently'}.

Wanted to follow up and see if there's anything I can help with, or if there's an opportunity for us to work together.

Best,
${senderName}`;
}
