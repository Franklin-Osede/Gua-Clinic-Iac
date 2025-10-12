import CryptoJS from "crypto-js";

const SECRET_KEY = CryptoJS.enc.Base64.parse(import.meta.env.VITE_AES_KEY);

export const encryptData = (data: string) => {
  const IV = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return IV.concat(encrypted.ciphertext).toString(CryptoJS.enc.Base64);
};

export const decryptData = (encryptedData: string) => {
  try {
    const encryptedBytes = CryptoJS.enc.Base64.parse(encryptedData);
    const iv = CryptoJS.lib.WordArray.create(
      encryptedBytes.words.slice(0, 4),
      16,
    );
    const ciphertext = CryptoJS.lib.WordArray.create(
      encryptedBytes.words.slice(4),
    );

    const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, SECRET_KEY, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) throw new Error("Invalid decryption output");

    return JSON.parse(decryptedText);
  } catch (error) {
    throw new Error("Decryption failed");
  }
};
