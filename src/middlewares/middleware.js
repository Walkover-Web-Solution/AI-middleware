import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import axios from "axios"; // Added for making HTTP requests
import { createOrFindUserAndCompany, getOrganizationById } from "../services/proxyService.js";
import { encryptString, generateIdentifier } from "../services/utils/utilityService.js";
dotenv.config();

const makeDataIfProxyTokenGiven = async (req) => {
  const headers = {
    'proxy_auth_token': req.headers.proxy_auth_token
  };
  const response = await axios.get("https://routes.msg91.com/api/c/getDetails", { headers });

  if (response.status !== 200 || !response.data) {
    throw new Error("Invalid token");
  }

  const responseData = response.data;
  return {
    ip: "9.255.0.55",
    user: {
      id: responseData.data[0].id,
      name: responseData.data[0].name,
      meta: responseData.data[0].meta
    },
    org: {
      id: responseData.data[0].currentCompany.id,
      name: responseData.data[0].currentCompany.name
    }
  };
};

const middleware = async (req, res, next) => {
  try {
    if (req.get('Authorization')) {
      const token = req.get('Authorization');
      if (!token) {
        return res.status(401).json({ message: 'invalid token' });
      }
      req.profile = jwt.verify(token, process.env.SecretKey);
    }
    else if (req.headers['proxy_auth_token']) {
      req.profile = await makeDataIfProxyTokenGiven(req);
    }

    req.profile.org.id = req.profile.org.id.toString();
    req.body.org_id = req.profile.org.id;
    req.IsEmbedUser = req.profile.user.meta?.type || false
    return next();
  } catch (err) {
    console.error("middleware error =>", err);
    return res.status(401).json({ message: 'unauthorized user' });
  }
};


const combine_middleware = async (req, res, next) => {
  try {
    let token = req.get('Authorization');
    token = token?.split(' ')?.[1] || token;
    if (token) {
      try {
        const decodedToken = jwt.decode(token);
        if (decodedToken) {
          // Check for middleware authorization
          let middlewareToken = jwt.verify(token, process.env.SecretKey);
          if (middlewareToken) {
            middlewareToken.org_id = middlewareToken.org.id.toString();
            req.profile = middlewareToken;
            req.body.org_id = middlewareToken?.org.id?.toString();
            return next();
          }
        }
      } catch (e) {
        console.error("Middleware token verification failed", e);
        // Check for chatbot authorization if middleware verification fails
        try {
          let chatbotToken = jwt.verify(token, process.env.CHATBOTSECRETKEY);
          if (chatbotToken) {
            chatbotToken.org_id = chatbotToken.org_id.toString();
            req.profile = chatbotToken;
            req.body.org_id = chatbotToken?.org_id?.toString();
            if (!chatbotToken.user) req.profile.viewOnly = true;
            return next();
          }
        } catch (e) {
          console.error("Chatbot token verification failed", e);
        }
      }
    }

    if (req.headers['proxy_auth_token']) {
      try {
        req.profile = await makeDataIfProxyTokenGiven(req);
        req.profile.org.id = req.profile.org.id.toString();
        req.body.org_id = req.profile.org.id;
        return next();
      } catch (e) {
        console.error("Proxy token verification failed", e);
      }
    }

    return res.status(401).json({ message: 'unauthorized user' });
  } catch (e) {
    console.error("middleware error =>",e);
    return res.status(401).json({ message: 'unauthorized user' });
  }
};

const EmbeddecodeToken = async (req, res, next) => {
  const token = req?.get('Authorization');
  if (!token) {
    return res.status(498).json({ message: 'invalid token' });
  }
  try {
    const decodedToken = jwt.decode(token);
    if (decodedToken) {
      // const orgTokenFromDb = await orgDbServices.find(decodedToken.org_id);
      const orgTokenFromDb = await getOrganizationById(decodedToken?.org_id);
      const orgToken = orgTokenFromDb?.meta?.auth_token;
      if (orgToken) {
        const checkToken = jwt.verify(token, orgToken);
        if (checkToken) {
          if (checkToken.user_id) checkToken.user_id = encryptString(checkToken.user_id);
          const userDetails = {
            name: generateIdentifier(14, 'emb', false),
            email: `${decodedToken.org_id}${checkToken.user_id}@gtwy.ai`,
            meta: { type: 'embed' },
          };
          const orgDetials = {
            name: orgTokenFromDb?.name,
            is_readable: true,
            meta: {
              status: '2', // here 2 indicates that user is guest in this org and on visiting viasocket normally, this org should not be visible to users whose status is '2' with the org.
            },
          };
          const proxyObject = {
            feature_id: process.env.PROXY_USER_REFERENCE_ID,
            Cuser: userDetails,
            company: orgDetials,
            role_id: 2
          };
          const proxyResponse = await createOrFindUserAndCompany(proxyObject); // proxy api call
          req.Embed = {
            ...checkToken,
            user_id: proxyResponse.data.user.id,
            org_name: orgTokenFromDb?.name,
            org_id: proxyResponse.data.company.id,
          };
          req.profile = {
            user:{
              id: proxyResponse.data.user.id,
              name: ""
            },
            org:{
              id:proxyResponse.data.company.id,
              name:orgTokenFromDb?.name
            }
          }
          req.IsEmbedUser = true
          return next();
        }
        return res.status(404).json({ message: 'unauthorized user' });
      }
    }
    return res.status(401).json({ message: 'unauthorized user ' });
  } catch (err) {
    return res.status(401).json({ message: 'unauthorized user ', err });
  }
};
const InternalAuth = async (req, res, next)=>{
  return next()
}
const ReturnAuth = async (req, res, next)=>{
  return res.status(400).json({ message: 'unauthorized user ', auth: req.get('Authorization')});
}
export { middleware, combine_middleware, EmbeddecodeToken, InternalAuth, ReturnAuth };
