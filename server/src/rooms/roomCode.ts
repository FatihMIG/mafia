const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // excludes ambiguous 0/O, 1/I/L

function randomCode(length = 4): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

export function generateUniqueRoomCode(exists: (code: string) => boolean): string {
  let code = randomCode();
  let attempts = 0;
  while (exists(code) && attempts < 50) {
    code = randomCode();
    attempts++;
  }
  return code;
}
