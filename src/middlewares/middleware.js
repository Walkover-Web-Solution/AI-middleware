import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

import axios from "axios";

async function makeDataIfProxyTokenGiven(req) {
  let headers = {};
  if(req.header("proxy_auth_token")){
    headers['proxy_auth_token'] = req.header("proxy_auth_token")
  }
  let responseData = await axios.get("https://routes.msg91.com/api/c/getDetails", {
    headers
  });

  if (responseData.status != 200 || !responseData.data) {
    throw new Error("Invalid token");
  }
  responseData = responseData.data;
  var data = {
    ip: req.headers['x-forwarded-for'],
    user: {
      id: responseData.data[0].id,
    },
    org: {
      id: responseData.data[0].c_companies[0].id,
    }
  };
  return data;
}

const middleware = async (req, res, next) => {
  try {
    let checkToken 
    if (req.header("proxy_auth_token")) {
      checkToken = await makeDataIfProxyTokenGiven(req);

    } else {
      const token = req?.get('Authorization');
      if (!token) {
        return res.status(498).json({
          message: 'invalid token'
        });
      }

      checkToken = jwt.verify(token, process.env.SecretKey);
    }
    if (checkToken) {
      checkToken.org.id = checkToken.org.id.toString()
      req.profile = checkToken;
      req.body.org_id = checkToken?.org?.id.toString();
      return next();
    }
    return res.status(404).json({
      message: 'unauthorized user'
    });

  } catch (err) {
    console.error("middleware eror=>", err);
    return res.status(401).json({
      message: 'unauthorized user '
    });
  }
};
export default middleware;