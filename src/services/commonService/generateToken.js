import jwt from "jsonwebtoken";
const generateToken = ({ payload, accessKey }) => {
  try {
    return jwt.sign(payload, accessKey);
  } catch (error) {
    console.error("Error generating token:", error);
    throw new Error("Failed to generate token");
  }
};
export default {
  generateToken,
};
