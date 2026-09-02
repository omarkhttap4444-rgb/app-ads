type ContactProfile = {
  phone?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  is_contact_phone_visible?: boolean | null;
  is_contact_whatsapp_visible?: boolean | null;
};

export function visibleSellerContacts(profile: ContactProfile | null | undefined) {
  return {
    phone: profile?.is_contact_phone_visible === true
      ? profile.contact_phone || profile.phone || null : null,
    // A visible telephone number is never consent to enable WhatsApp.
    whatsapp: profile?.is_contact_whatsapp_visible === true
      ? profile.contact_whatsapp || null : null,
  };
}

export function formatWhatsAppNumber(phone: string | null | undefined, isSaudi: boolean) {
  const clean = (phone ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (!clean) return '';
  if (clean.startsWith('20') || clean.startsWith('966')) return clean;
  if (clean.startsWith('1') && clean.length === 10) return `20${clean}`;
  if (clean.startsWith('5') && clean.length === 9) return `966${clean}`;
  return `${isSaudi ? '966' : '20'}${clean}`;
}
