import CryptoJS from "crypto-js";

export const createEncryptedStorage = (
  storage: Storage,
  encryptionKey: string,
) => ({
  getItem: (name: string) => {
    const value = storage.getItem(name);

    if (!value) {
      return null;
    }

    try {
      const bytes = CryptoJS.AES.decrypt(value, encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (_error) {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    const encrypted = CryptoJS.AES.encrypt(value, encryptionKey).toString();
    storage.setItem(name, encrypted);
  },
  removeItem: (name: string) => storage.removeItem(name),
});
