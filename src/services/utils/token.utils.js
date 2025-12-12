import jwt from 'jsonwebtoken';

/**
 * Decodes a token using 'secret' and re-signs it with the environment SecretKey.
 * @param {string} token - The input JWT token.
 * @param {object} [signOptions] - Optional options for jwt.sign.
 * @returns {string} - The new JWT token.
 */
export const reissueToken = (token, signOptions = {}) => {
    if (!token) {
        throw new Error('Token is required for reissuing');
    }

    // 1. Decode with 'secret' as valid signature
    const decoded = jwt.verify(token, process.env.TEMP_SECRET);

    // 2. Prepare payload
    // We keep 'iat' and 'exp' if present, unless signOptions overrides them or we want to strip them.
    // "make sure the data should be same" implies keeping everything.
    // However, jwt.sign automatically adds 'iat'.
    // If 'iat' is in payload, it uses it.

    // The user secret is explicitly from env line 53, or fallback to the provided string.
    const secretKey = process.env.SecretKey;

    // 3. Sign with new secret
    // We pass data exactly. 
    return jwt.sign(decoded, secretKey, signOptions);
};
