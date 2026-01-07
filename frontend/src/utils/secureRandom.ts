// Secure random utilities for replacing secureRandom.random() in security-sensitive contexts
export const secureRandom = {
  // Generate a cryptographically secure random number between 0 and 1
  random: (): number => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  },

  // Generate a secure random ID
  id: (length: number = 9): string => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(36))
      .join("")
      .slice(0, length);
  },

  // Generate a secure UUID-like string
  uuid: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    array[6] = (array[6] & 0x0f) | 0x40; // Version 4
    array[8] = (array[8] & 0x3f) | 0x80; // Variant 10
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
  },
};
