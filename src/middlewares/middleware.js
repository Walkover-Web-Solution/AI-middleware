import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();
const middleware = async (req, res, next) => {
  const token = req?.get('Authorization');
  if (!token) {
    return res.status(401).json({
      message: 'invalid token'
    });
  }
  try {
    const decodedToken = jwt.decode(token);
    if (decodedToken) {
      let checkToken = jwt.verify(token, process.env.SecretKey);
      if (checkToken) {
        checkToken.org.id = checkToken.org.id.toString()
        req.profile = checkToken;
        req.body.org_id = checkToken?.org?.id.toString();
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