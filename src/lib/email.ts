const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

/**
 * Accepts Unicode e-mail input and converts only the domain part to its DNS-safe
 * ASCII representation. The local part remains untouched because it belongs to
 * the user's mailbox identity.
 */
export function normalizeEmail(value: string) {
  const email = value.trim().normalize("NFC");

  if (!emailPattern.test(email)) return null;

  const separatorIndex = email.lastIndexOf("@");
  const localPart = email.slice(0, separatorIndex);
  const domain = email.slice(separatorIndex + 1);

  try {
    const normalizedDomain = new URL(`https://${domain}`).hostname;
    return normalizedDomain ? `${localPart}@${normalizedDomain}` : null;
  } catch {
    return null;
  }
}

export function hasUnsupportedUnicodeLocalPart(email: string) {
  const localPart = email.slice(0, email.lastIndexOf("@"));
  return /[^\x21-\x7E]/.test(localPart);
}
