export function sanitizeNickname(raw: string): string {
  return raw.trim().slice(0, 20) || "Anonymous";
}

export function sanitizeChatText(raw: string): string {
  return raw.trim().slice(0, 280);
}

export function sanitizeRoomCode(raw: string): string {
  return raw.trim().toUpperCase().slice(0, 8);
}
