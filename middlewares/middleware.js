import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();
const middleware = async (req, res, next) => {
  const token = req?.get('Authorization');
  console.log("token=>", token);
  if (!token) {
    return res.status(498).json({
      message: 'invalid token'
    });
  }
  try {
    const checkToken = jwt.verify(token, process.env.SecretKey);
    if (checkToken) {
      if (checkToken) {
        req.profile = checkToken;
        return next();
      }
      return res.status(404).json({
        message: 'unauthorized user'
      });
    }
    return res.status(401).json({
      message: 'unauthorized user '
    });
  } catch (err) {
    console.error("middleware eror=>", err);
    return res.status(401).json({
      message: 'unauthorized user '
    });
  }
};
export default middleware;