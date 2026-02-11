import CryptoJS from 'crypto-js';

export const AesCbc = {
    encrypt: (text, key, iv) => {
        const keyHex = CryptoJS.enc.Utf8.parse(key);
        const ivHex = CryptoJS.enc.Utf8.parse(iv);
        
        const encrypted = CryptoJS.AES.encrypt(text, keyHex, {
            iv: ivHex,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7 
        });

        return encrypted.toString();
    },

    decrypt: (cipherText, key, iv) => {
        const keyHex = CryptoJS.enc.Utf8.parse(key);
        const ivHex = CryptoJS.enc.Utf8.parse(iv);

        const decrypted = CryptoJS.AES.decrypt(cipherText, keyHex, {
            iv: ivHex,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return decrypted.toString(CryptoJS.enc.Utf8);
    }
};