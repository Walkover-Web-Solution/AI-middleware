import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const agentsAuth = async (req, res, next) => {
  try {
    const token = req.get("Authorization");
    if (!token) {
      return res.status(498).json({ message: "invalid token" });
    }

    const checkToken = jwt.verify(token, process.env.PUBLIC_CHATBOT_TOKEN, { algorithms: ["HS256"] });

    if (checkToken) {
      req.profile = checkToken;
      req.profile.limiter_key = checkToken.userId;
      return next();
    }

    return res.status(404).json({ message: "not valid user" });
  } catch (err) {
    console.error("middleware error =>", err);
    return res.status(401).json({ message: "unauthorized user" });
  }
};

export { agentsAuth };
