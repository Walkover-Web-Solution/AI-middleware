import jwt from 'jsonwebtoken';
import responseTypeService from '../src/db_services/responseTypeService.js';
import ConfigurationServices from '../src/db_services/ConfigurationServices.js';

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
      const checkToken = jwt.verify(token, process.env.CHATBOTSECRETKEY);
      if (checkToken) {
        req.profile = checkToken;
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
const sendDataMiddleware = async (req, res, next) => { // todo pending
  const {
    org_id,
    slugName,
    threadId: initialThreadId,
    message,
  } = req.body;
  const { botId: chatBotId } = req.params;
  let threadId = initialThreadId;
  const {
    bridges,
    success
  } = await ConfigurationServices.getBridgeBySlugname(org_id, slugName);
  let responseTypes = '';
  const responseTypesJson = bridges?.responseRef?.responseTypes || {}
  Object.keys(responseTypesJson).forEach((responseId, i) => {
    const responseComponents = {
      responseId: responseId,
      ...responseTypesJson[responseId]?.components
    }
    responseTypes += ` ${i + 1}. ${JSON.stringify(responseComponents)} // description:- ${responseTypesJson[responseId].description},  \n`;
  });
  if (!success) return res.status(400).json({ message: 'some error occured' });
  if (threadId?.trim()) { threadId = chatBotId + threadId; } else { threadId = chatBotId};
  
  req.body = {
    org_id,
    bridge_id: bridges?._id?.toString(),
    service: 'openai',
    user: message,
    thread_id: threadId,
    variables: { ...req.body.interfaceContextData, responseTypes, message },
    apikey: process.env.GPT_KEY, 
    rtlOptions: {
      channel: threadId,
      ttl: 1,
    },
  };
  return next();
};

export { chatBotTokenDecode, chatBotAuth, sendDataMiddleware };