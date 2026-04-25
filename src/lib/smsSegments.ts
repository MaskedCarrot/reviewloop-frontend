const GSM_BASIC = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ" +
    "ÆæßÉ !#¤%&'()*+,-./0123456789:;<=>?¡" +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ" +
    "§¿abcdefghijklmnopqrstuvwxyzäöñüà" +
    '"'
);

export function isGsm7(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (!GSM_BASIC.has(c)) return false;
  }
  return true;
}

export function smsSegmentCount(text: string): number {
  if (!text) return 1;
  const n = text.length;
  if (isGsm7(text)) {
    if (n <= 160) return 1;
    return 1 + Math.max(0, Math.ceil((n - 160) / 153));
  }
  if (n <= 70) return 1;
  return 1 + Math.max(0, Math.ceil((n - 70) / 64));
}
