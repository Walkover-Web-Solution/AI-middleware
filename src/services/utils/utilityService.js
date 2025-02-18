import { nanoid, customAlphabet } from 'nanoid';
import crypto from 'crypto';

const alphabetSet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
// const basicAuthServices = require('../db_services/basic_auth_db_service.js')

// encryption decryption service
const algorithm = 'aes-256-cbc';
const secret_key = process.env.ENCRYPTION_SECRET_KEY;
const secret_iv = process.env.ENCRYPTION_SECRET_IV;

function generateIdentifier(length = 12, prefix = '', includeNumber = true) {
  const alphabet = includeNumber ? alphabetSet : alphabetSet.slice(0, alphabetSet.length - 10);
  if (alphabet) {
    const custom_nanoid = customAlphabet(alphabet, length);
    return `${prefix}${custom_nanoid()}`;
  }
  return `${prefix}${nanoid(length)}`;
}

function encrypt(text) {
  const { encryptionKey, iv } = generateEncryption();
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText) {
  const { encryptionKey, iv } = generateEncryption();
  const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher?.final('utf8');
  return decrypted;
}

function generateEncryption() {
  const encryptionKey = crypto
    .createHash('sha512')
    .update(secret_key)
    .digest('hex')
    .substring(0, 32);

  const iv = crypto
    .createHash('sha512')
    .update(secret_iv)
    .digest('hex')
    .substring(0, 16);

  return { encryptionKey, iv };
}



function generateIdForOpenAiFunctionCall(prefix = 'call_', length = 26) {
  // Define possible characters (lowercase, uppercase, digits)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomId = '';
  
  // Randomly choose characters to form the ID
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomId += characters[randomIndex];
  }
  
  // Return the ID with the prefix
  return prefix + randomId;
}

function encryptString(input) {
  input = input?.toString();
  const specialCharMap = { '!': 'A', '@': 'B', '#': 'C', $: 'D', '%': 'E', '^': 'F', '&': 'G', '*': 'H', '(': 'I', ')': 'J', '-': 'K', _: 'L', '=': 'M', '+': 'N', '[': 'O', ']': 'P', '{': 'Q', '}': 'R', ';': 'S', ':': 'T', '\'': 'U', '"': 'V', ',': 'W', '.': 'X', '/': 'Y', '?': 'Z', '<': 'AA', '>': 'AAA', '|': 'LLL' };
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const specialChars = Object.keys(specialCharMap).map(escapeRegExp).join('');
  const regex = new RegExp(`[${specialChars}]`, 'g');
  return input.toUpperCase().replace(regex, (match) => specialCharMap[match] || match);
}

function objectToQueryParams(obj) {
  return Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

export {
  generateIdentifier,
  encrypt,
  decrypt,
  generateIdForOpenAiFunctionCall,
  encryptString,
  objectToQueryParams
};
