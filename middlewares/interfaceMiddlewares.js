import jwt from 'jsonwebtoken';
import responseTypeService from '../src/db_services/responseTypeService.js';

const chatBotTokenDecode = async (req, res, next) => {
  const token = req?.get('Authorization');
  if (!token) {
    return res.status(498).json({ message: 'invalid token' });
  }
  try {
    const decodedToken = jwt.decode(token);
    let orgToken;
    if (decodedToken) {
      const {chatBot :orgTokenFromDb} = await responseTypeService.getAll(decodedToken?.org_id)
      orgToken = orgTokenFromDb?.orgAcessToken;
      if (orgToken) {
        const checkToken = jwt.verify(token, orgToken);
        if (checkToken) {
          req.chatBot = checkToken;
          return next();
        }
        return res.status(404).json({ message: 'unauthorized user' });
      }
    }
    return res.status(401).json({ message: 'unauthorized user 1', token });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'unauthorized user ', token });
  }
};
const chatBotAuth = async (req, res, next) => { // todo pending
  let token = req?.get('Authorization');
  token = token.split(' ')?.[1] || token;
  if (!token) {
    return res.status(498).json({ message: 'invalid token' });
  }
  try {
    const decodedToken = jwt.decode(token);
    if (decodedToken) {
      const checkToken = jwt.verify(token, process.env.JWT_TOKEN_SECRET);
      if (checkToken) {
        req.profile = checkToken;
        console.log(checkToken)
        req.body.org_id = checkToken?.org_id;
        if (!checkToken.user) req.profile.viewOnly = true;
        return next();
      }
    }
    return res.status(401).json({ message: 'unauthorized user' });
  } catch (err) {
    return res.status(401).json({ message: 'unauthorized user' });
  }
};

export { chatBotTokenDecode, chatBotAuth };
