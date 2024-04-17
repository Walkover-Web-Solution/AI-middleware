const jwt = require("jsonwebtoken");

const generateToken = (bridge_id) => {
  try {
    const payload = {
      org_id: process.env.ORG_ID,
      project_id: process.env.PROJECT_ID,
      user_id: bridge_id
    };
    const secretKey = process.env.Access_key;
    return jwt.sign(payload, secretKey);
  } catch (error) {
    console.error("Error generating token:", error);
    throw new Error('Failed to generate token');
  }
};

module.exports = { generateToken };
