const jwt = require("jsonwebtoken");

function generateToken(bridge_id) {
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
    return null;
  }
}

module.exports = { generateToken };
