import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();
const middleware = async (req, res, next) => {
  const token = req?.get('Authorization');
  // console.log("token=>", token);
  if (!token) {
    return res.status(498).json({
      message: 'invalid token'
    });
  }
  try {
    const decodedToken = jwt.decode(token);
    if (decodedToken) {
      const checkToken = jwt.verify(token, process.env.SecretKey);
      // console.log("checkToken=>", checkToken);
      if (checkToken) {
        req.profile = checkToken;
        req.body.org_id = checkToken?.org?.id;
        return next();
      }
      return res.status(404).json({
        message: 'unauthorized user'
      });
    }
    console.log("decodedToken=>", decodedToken);
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