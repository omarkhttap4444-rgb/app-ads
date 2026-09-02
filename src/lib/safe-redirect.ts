/** Only same-origin absolute paths may be used after authentication. */
export function safeInternalRedirect(value: string | null | undefined): string {
  const base = 'https://redirect.invalid';
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  // Browsers normalize backslashes and control characters before URL parsing.
  if (/[\\\u0000-\u0020\u007f]/.test(value)) return '/';
  try {
    let path = value.split(/[?#]/, 1)[0];
    for (let i = 0; i < 5; i++) {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
      if (i === 4) return '/';
    }
    if (/[\\\u0000-\u001f\u007f]/.test(path) || path.startsWith('//')) return '/';
    const decodedUrl = new URL(path, base);
    const url = new URL(value, base);
    if (url.origin !== base || decodedUrl.origin !== base ||
        url.pathname.startsWith('//') || decodedUrl.pathname.startsWith('//')) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
