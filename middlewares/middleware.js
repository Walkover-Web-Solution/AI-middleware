const dotenv = require('dotenv')
const jwt = require("jsonwebtoken")


dotenv.config();
const middleware = async (req, res, next) => {

  const token = req?.get('Authorization');
  if (!token) {
    return res.status(498).json({ message: 'invalid token' });
  }
  try {
    const decodedToken = jwt.decode(token);
    if (decodedToken) {
        const checkToken = jwt.verify(token, process.env.SecretKey);
        if (checkToken) {
          req.profile = checkToken;
          req.body.org_id=checkToken?.org?.id
          return next();
        }
        return res.status(404).json({ message: 'unauthorized user' });
      }

    return res.status(401).json({ message: 'unauthorized user ' });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'unauthorized user ' });
  }
};

module.exports =  middleware 
