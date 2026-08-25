const crypto = require('crypto');

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
    const raw = crypto.randomBytes(12).toString('hex').toUpperCase();
    return raw.match(/.{1,6}/g).join('-');
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
    normalizeInviteCode,
    hashInviteCode,
    decryptInviteCode,
    createInviteFields
};
