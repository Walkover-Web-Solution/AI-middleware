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
        req.isChatbot = true;
        if (!checkToken.user) req.profile.viewOnly = true;
        return next();
      }
    }
    return res.status(401).json({ message: 'unauthorized user' });
  } catch (e) {
    return res.status(401).json({ message: 'unauthorized user', error: e });
  }
};

const publicChatbotAuth = async (req, res, next) => {
  try {
    let checkToken = false;
    const token = req.headers['Authorization'];
    if (token) {
      checkToken = jwt.decode(token, process.env.PUBLIC_CHATBOT_TOKEN, ['HS256']);
      if (checkToken) {
        req.chatBot = checkToken;
        req.chatBot.limiter_key = checkToken.userId;
        return next();
      }
    }
    return res.status(498).json({ message: 'invalid token' });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'unauthorized user' });
  }
};

const combinedAuthWithChatBotAndPublicChatbot = async (req, res, next) => {
      try {
        // Try public chatbot auth first
        const publicAuthResult = await publicChatbotAuth(req, res, () => {});
        if (publicAuthResult === undefined) {
          // If public auth succeeded, proceed
          return next();
        }
    
        // If public auth failed, try chatbot auth
        const chatBotAuthResult = await chatBotAuth(req, res, () => {});
        if (chatBotAuthResult === undefined) {
          // If chatbot auth succeeded, proceed
          return next();
        }
    
        // If both auth methods failed
        return res.status(401).json({ message: 'unauthorized user' });
      } catch (err) {
        return res.status(401).json({ message: 'unauthorized user', error: err });
      }
    };
    
    const combinedAuthWithChatBotTokenDecodeAndPublicChatbot = async (req, res, next) => {
      try {
        // Try public chatbot auth first
        const publicAuthResult = await publicChatbotAuth(req, res, () => {});
        if (publicAuthResult === undefined) {
          // If public auth succeeded, proceed
          return next();
        }
    
        // If public auth failed, try chatbot token decode
        const chatBotTokenResult = await chatBotTokenDecode(req, res, () => {});
        if (chatBotTokenResult === undefined) {
          // If chatbot token decode succeeded, proceed
          return next();
        }
    
        // If both auth methods failed
        return res.status(401).json({ message: 'unauthorized user' });
      } catch (err) {
        return res.status(401).json({ message: 'unauthorized user', error: err });
      }
    };
export { chatBotTokenDecode, chatBotAuth, publicChatbotAuth, combinedAuthWithChatBotAndPublicChatbot, combinedAuthWithChatBotTokenDecodeAndPublicChatbot };