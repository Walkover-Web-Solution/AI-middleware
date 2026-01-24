import jwt from "jsonwebtoken";
import { storeInCache } from "../cache_service/index.js";

const logout = async (req, res, next) => {
  try {
    const token = req.get("Authorization");

    console.log("=== LOGOUT CONTROLLER ===");
    console.log("Token received:", token ? "EXISTS" : "NULL");
    console.log("Token length:", token?.length);
    console.log("Token preview:", token?.substring(0, 50));

    if (!token) {
      console.log("ERROR: No token provided");
      res.locals = { success: false, message: "No token provided" };
      req.statusCode = 400;
      return next();
    }

    const decoded = jwt.decode(token);

    console.log("Decoded token:", decoded ? "SUCCESS" : "FAILED");
    console.log("Token exp:", decoded?.exp);

    if (!decoded || !decoded.exp) {
      console.log("ERROR: Invalid token format");
      res.locals = { success: false, message: "Invalid token format" };
      req.statusCode = 400;
      return next();
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTTL = decoded.exp - currentTime;

    console.log("Current time:", currentTime);
    console.log("Token expiry:", decoded.exp);
    console.log("Remaining TTL:", remainingTTL);

    if (remainingTTL > 0) {
      console.log("Storing in blacklist with TTL:", remainingTTL);
      await storeInCache(`blacklist:${token}`, { revoked: true, revokedAt: new Date().toISOString() }, remainingTTL);
      console.log("Successfully stored in blacklist");
    } else {
      console.log("Token already expired, not blacklisting");
    }

    console.log("Logout successful");
    console.log("hello");
    res.locals = { success: true, message: "Logged out successfully" };
    req.statusCode = 200;
    return next();
  } catch (error) {
    console.error("Logout error:", error);
    res.locals = { success: false, message: "Logout failed" };
    req.statusCode = 500;
    return next();
  }
};

export default { logout };
