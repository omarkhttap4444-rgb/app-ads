export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

const COMMON_WEAK_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password1',
  'password123',
  'qwerty123',
  'admin123',
  'admin1234',
  '11111111',
  '00000000',
  'iloveyou',
  'welcome1',
  'souqphone',
  'souqphone123',
]);

/**
 * Enforces the unified Souq Phone password policy (8-72 chars, >=2 character classes, denylist).
 * Returns an Arabic error message when invalid, or `null` when valid.
 */
export function validateStrongPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `كلمة المرور يجب أن تكون ${PASSWORD_MIN_LENGTH} أحرف على الأقل.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `كلمة المرور يجب ألا تتجاوز ${PASSWORD_MAX_LENGTH} حرفاً.`;
  }
  if (COMMON_WEAK_PASSWORDS.has(password.trim().toLowerCase())) {
    return 'كلمة المرور ضعيفة وشائعة جداً. يرجى اختيار كلمة مرور أقوى.';
  }

  const hasLetter = /[A-Za-z\u0600-\u06FF]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9\u0600-\u06FF\s]/.test(password);
  const classes = Number(hasLetter) + Number(hasDigit) + Number(hasSymbol);

  if (classes < 2) {
    return 'كلمة المرور يجب أن تجمع بين نوعين على الأقل (حروف، أرقام، أو رموز).';
  }
  return null;
}

/**
 * Maps raw Supabase/network errors to safe Arabic messages without leaking internal details
 * or allowing account enumeration.
 */
export function mapStorefrontAuthError(
  err: unknown,
  context: 'login' | 'signup' | 'otp' | 'recovery',
): string {
  const raw =
    typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message?: unknown }).message ?? '')
      : typeof err === 'string'
        ? err
        : '';
  const lower = raw.toLowerCase();

  if (
    lower.includes('rate limit') ||
    lower.includes('too many') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('429')
  ) {
    return 'محاولات كثيرة جداً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.';
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('timeout')
  ) {
    return 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
  }

  if (context === 'login') {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }

  if (context === 'otp') {
    if (lower.includes('expired') || lower.includes('otp_expired')) {
      return 'رمز التحقق منتهي الصلاحية. يرجى طلب رمز جديد.';
    }
    return 'رمز التحقق غير صحيح أو منتهي الصلاحية.';
  }

  if (context === 'recovery') {
    if (lower.includes('same_password') || lower.includes('different from the old')) {
      return 'يجب أن تختلف كلمة المرور الجديدة عن كلمة المرور الحالية.';
    }
    return 'تعذر إتمام عملية استعادة كلمة المرور حالياً. يرجى المحاولة مرة أخرى.';
  }

  return 'تعذر إتمام الطلب حالياً. يرجى التحقق من البيانات والمحاولة مرة أخرى.';
}

/**
 * Validates that an IP string is a syntactically valid public IPv4 or IPv6 address
 * (rejecting loopback, private RFC1918, link-local, CGNAT, multicast, or SSRF path payloads).
 */
export function isValidPublicIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const trimmed = ip.trim();
  if (!trimmed || trimmed.length > 45) return false;

  // IPv4 validation
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(trimmed)) {
    const parts = trimmed.split('.').map((p) => Number(p));
    if (parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
      return false;
    }
    const [a, b, c] = parts;
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
    if (a === 169 && b === 254) return false; // Link-local
    if (a === 172 && b >= 16 && b <= 31) return false; // RFC1918
    if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
    if (a === 192 && b === 168) return false; // RFC1918
    if (a === 198 && (b === 18 || b === 19)) return false;
    if (a === 198 && b === 51 && c === 100) return false;
    if (a === 203 && b === 0 && c === 113) return false;
    if (a >= 224) return false; // Multicast & reserved
    return true;
  }

  // IPv6 validation (strict hex + colons only, no URL/path characters)
  if (/^[0-9a-fA-F:]+$/.test(trimmed) && trimmed.includes(':')) {
    const lower = trimmed.toLowerCase();
    if (
      lower === '::' ||
      lower === '::1' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe8') ||
      lower.startsWith('fe9') ||
      lower.startsWith('fea') ||
      lower.startsWith('feb') ||
      lower.startsWith('ff') ||
      lower.startsWith('::ffff:127.') ||
      lower.startsWith('::ffff:10.') ||
      lower.startsWith('::ffff:192.168.')
    ) {
      return false;
    }
    const groups = lower.split(':');
    if (groups.length < 3 || groups.length > 8) return false;
    return groups.every((g) => g.length <= 4);
  }

  return false;
}
