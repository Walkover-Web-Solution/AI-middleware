import jwt from 'jsonwebtoken';
import responseTypeService from '../db_services/responseTypeService.js';

const chatBotTokenDecode = async (req, res, next) => {
  const token = req?.get('Authorization');
  if (!token) {
    return res.status(498).json({ message: 'invalid token' });
  }
  try {
    const decodedToken = jwt.decode(token);
    let orgToken;
    if (decodedToken) {
      const { chatBot: orgTokenFromDb } = await responseTypeService.getAll(decodedToken?.org_id)
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
  token = token?.split(' ')?.[1] || token;
  if (!token) {
    return res.status(498).json({ message: 'invalid token' });
  }
  try {
    const decodedToken = jwt.decode(token);
    if (decodedToken) {
      let checkToken = jwt.verify(token, process.env.CHATBOTSECRETKEY);
      if (checkToken) {

        checkToken.org_id = checkToken.org_id.toString()
        req.profile = checkToken;
        req.body.org_id = checkToken?.org_id?.toString();
        if (!checkToken.user) req.profile.viewOnly = true;
        return next();
      }
    }
    return res.status(401).json({ message: 'unauthorized user' });
  } catch (e) {
    return res.status(401).json({ message: 'unauthorized user', error: e });
  }
};

export { chatBotTokenDecode, chatBotAuth };