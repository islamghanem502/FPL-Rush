const crypto = require('crypto');

const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// Same API/behaviour as nanoid's customAlphabet, kept dependency-free for the
// current backend. Rejection sampling avoids modulo bias in the code space.
const customAlphabet = (alphabet, size) => () => {
    let value = '';
    const maxByte = 256 - (256 % alphabet.length);
    while (value.length < size) {
        const bytes = crypto.randomBytes(size * 2);
        for (const byte of bytes) {
            if (byte >= maxByte) continue;
            value += alphabet[byte % alphabet.length];
            if (value.length === size) break;
        }
    }
    return value;
};

const getSecret = () => {
    const secret = process.env.INVITE_CODE_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error('INVITE_CODE_SECRET or JWT_SECRET must be configured');
    return secret;
};

const getEncryptionKey = () => crypto
    .createHash('sha256')
    .update(getSecret())
    .digest();

const normalizeInviteCode = (value) => String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const createInviteCode = () => {
    return customAlphabet(INVITE_ALPHABET, 6)();
};

const hashInviteCode = (code) => crypto
    .createHmac('sha256', getSecret())
    .update(normalizeInviteCode(code))
    .digest('hex');

const encryptInviteCode = (code) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
};

const decryptInviteCode = (ciphertext) => {
    if (!ciphertext) return null;
    const [ivValue, tagValue, encryptedValue] = ciphertext.split('.');
    if (!ivValue || !tagValue || !encryptedValue) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    return Buffer.concat([
        decipher.update(Buffer.from(encryptedValue, 'base64url')),
        decipher.final()
    ]).toString('utf8');
};

const createInviteFields = () => {
    const inviteCode = createInviteCode();
    return {
        inviteCode,
        inviteCodeHash: hashInviteCode(inviteCode),
        inviteCodeCiphertext: encryptInviteCode(inviteCode),
        inviteCodeLast4: normalizeInviteCode(inviteCode).slice(-4)
    };
};

module.exports = {
    customAlphabet,
    INVITE_ALPHABET,
    normalizeInviteCode,
    hashInviteCode,
    decryptInviteCode,
    createInviteFields
};
