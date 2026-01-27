import jwt from "jsonwebtoken";
import { storeInCache } from "../cache_service/index.js";

const logout = async (req, res, next) => {
  try {
    const token = req.get("Authorization");

    if (!token) {
      res.locals = { success: false, message: "No token provided" };
      req.statusCode = 400;
      return next();
    }

    const decoded = jwt.decode(token);

    if (!decoded || !decoded.exp) {
      res.locals = { success: false, message: "Invalid token format" };
      req.statusCode = 400;
      return next();
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTTL = decoded.exp - currentTime;

    if (remainingTTL > 0) {
      await storeInCache(`blacklist:${token}`, { revoked: true, revokedAt: new Date().toISOString() }, remainingTTL);
    }
    res.locals = { success: true, message: "Logged out successfully" };
    req.statusCode = 200;
    return next();
  } catch {
    res.locals = { success: false, message: "Logout failed" };
    req.statusCode = 500;
    return next();
  }
};

export default { logout };
