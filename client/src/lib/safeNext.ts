/** Only allow same-site relative paths in ?next=… (prevents open redirects). */
export function safeNext(value: string | null, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  return value
}
