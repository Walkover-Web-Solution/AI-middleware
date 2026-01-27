import jwt from "jsonwebtoken";

/**
 * Decodes a token using 'secret' and re-signs it with the environment SecretKey.
 * @param {string} token - The input JWT token.
 * @param {object} [signOptions] - Optional options for jwt.sign.
 * @returns {string} - The new JWT token.
 */

export const reissueToken = (token, signOptions = {}) => {
  if (!token) {
    throw new Error("Token is required for reissuing");
  }
  const decoded = jwt.decode(token);
  // eslint-disable-next-line no-unused-vars
  const { iat, exp, ...payload } = decoded;
  const newToken = jwt.sign(payload, process.env.SecretKey, signOptions);
  return newToken;
};
