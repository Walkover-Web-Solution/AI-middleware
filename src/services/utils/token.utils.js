// import jwt from "jsonwebtoken";

/**
 * Decodes a token using 'secret' and re-signs it with the environment SecretKey.
 * @param {string} token - The input JWT token.
 * @param {object} [signOptions] - Optional options for jwt.sign.
 * @returns {string} - The new JWT token.
 */
export const reissueToken = (token) => {
  if (!token) {
    throw new Error("Token is required for reissuing");
  }
  //   // 1. Decode with 'secret' as valid signature
  //   const decoded = jwt.verify(token, process.env.TEMP_SECRET);

  //   // 2. Prepare payload
  //   // We keep 'iat' and 'exp' if present, unless signOptions overrides them or we want to strip them.
  //   // "make sure the data should be same" implies keeping everything.
  //   // However, jwt.sign automatically adds 'iat'.
  //   // If 'iat' is in payload, it uses it.

  //  try {
  //     // Try to verify with TEMP_SECRET (will likely fail for MSG91 tokens)
  //     const decoded = jwt.verify(token, process.env.TEMP_SECRET);
  //     const { iat, exp, ...payload } = decoded;
  //     const secretKey = process.env.SecretKey;
  //     return jwt.sign(payload, secretKey, signOptions);

  //   } catch (error) {
  //     // Verification failed - decode without verification
  //     const decodedNoVerify = jwt.decode(token);
  //     const { iat, exp, ...payload } = decodedNoVerify;
  //     const secretKey = process.env.SecretKey;
  //     return jwt.sign(payload, secretKey, signOptions);
  //   }
};
