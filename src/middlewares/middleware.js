import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import axios from "axios"; // Added for making HTTP requests
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
      name: responseData.data[0].name
    },
    org: {
      id: responseData.data[0].currentCompany.id,
      name: responseData.data[0].currentCompany.name
    }
  };
};

const middleware = async (req, res, next) => {
  try {
    if (req.headers['proxy_auth_token']) {
      req.profile = await makeDataIfProxyTokenGiven(req);
    } else {
      const token = req.get('Authorization');
      if (!token) {
        return res.status(401).json({ message: 'invalid token' });
      }
      req.profile = jwt.verify(token, process.env.SecretKey);
    }

    req.profile.org.id = req.profile.org.id.toString();
    req.body.org_id = req.profile.org.id;
    return next();
  } catch (err) {
    console.error("middleware error =>", err);
    return res.status(401).json({ message: 'unauthorized user' });
  }
};

export default middleware;