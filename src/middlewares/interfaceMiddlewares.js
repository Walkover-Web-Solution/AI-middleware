import jwt from 'jsonwebtoken';
import responseTypeService from '../db_services/responseTypeService.js';
import ConfigurationServices from '../db_services/ConfigurationServices.js';

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
const sendDataMiddleware = async (req, res, next) => { // todo pending
  const {
    org_id,
    slugName,
    threadId,
    message,
  } = req.body;
  const { userId } = req.profile;
  const { botId: chatBotId } = req.params;
  let channelId = chatBotId + userId;
  if (threadId?.trim()) { channelId = chatBotId + threadId; }

  const {
    bridges,
    success
  } = await ConfigurationServices.getBridgeBySlugname(org_id, slugName);

  // let responseTypes = '';
  // const responseTypesJson = bridges?.responseRef?.responseTypes || {}
  // bridges?.responseIds?.forEach((responseId, i) => {
  //   const responseComponents = {
  //     responseId: responseId,
  //     ...responseTypesJson[responseId]?.components
  //   }
  //   responseTypes += ` ${i + 1}. ${JSON.stringify(responseComponents)} // description:- ${responseTypesJson[responseId].description},  \n`;
  // });
  const actions = []
  Object.keys(bridges.actions || {}).forEach((actionId) => {
    const { description, type, variable } = bridges.actions[actionId]
    actions.push({ actionId, description, type, variable })
  })

  if (!success) return res.status(400).json({ message: 'some error occured' });
  req.chatbot = true;
  req.body = {
    org_id,
    bridge_id: bridges?._id?.toString(),
    service: 'openai',
    user: message,
    thread_id: threadId,
    variables: { ...req.body.interfaceContextData, message, actions, ...req.profile.variables },
    RTLayer: true,
    template_id: process.env.TEMPLATE_ID,

    rtlOptions: {
      channel: channelId,
      ttl: 1,
    },
  };
  return next();
};

export { chatBotTokenDecode, chatBotAuth, sendDataMiddleware };