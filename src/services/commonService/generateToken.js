const jwt = require("jsonwebtoken");

const generateToken = async (req, res) => {
  try {
    const { bridge_id } = req.params;

    const payload = {
      org_id: process.env.ORG_ID,
      project_id: process.env.PROJECT_ID,
      user_id: bridge_id
    };
    const secretKey = process.env.Access_key;
    const token = jwt.sign(payload, secretKey);
    res.status(200).json({ success : true, token });

  } catch (error) {
    console.error("Error generating token:", error);
    res.status(400).json({success : false, message: 'Failed to generate token' });
  }
};

module.exports = {generateToken};
