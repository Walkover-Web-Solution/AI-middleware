import jwt from 'jsonwebtoken';
import { getOrganizationById } from '../services/proxyService.js';
import { encryptString } from '../services/utils/utilityService.js';
import { createOrGetUser } from '../utils/proxyUtils.js';

const GtwyEmbeddecodeToken = async (req, res, next) => {
    const token = req?.get('Authorization');
    if (!token) {
      return res.status(498).json({ message: 'invalid token' });
    }
    try {
      const decodedToken = jwt.decode(token);
      if(!decodedToken.user_id){
        return res.status(401).json({ message: 'unauthorized user, user id not provided' });
      }
      if (decodedToken) { 
        // const orgTokenFromDb = await orgDbServices.find(decodedToken.org_id);
        const orgTokenFromDb = await getOrganizationById(decodedToken?.org_id);
        const orgToken = orgTokenFromDb?.meta?.gtwyAccessToken;
        if (orgToken) {
          const checkToken = jwt.verify(token, orgToken);
          if (checkToken) {
            if (checkToken.user_id) checkToken.user_id = encryptString(checkToken.user_id);
            const {proxyResponse, name, email} = await createOrGetUser(checkToken, decodedToken, orgTokenFromDb)
            req.Embed = {
              ...checkToken,
              email: email,
              name: name, 
              org_name: orgTokenFromDb?.name,
              org_id: proxyResponse.data.company.id,
              folder_id : decodedToken.folder_id,
              user_id: proxyResponse.data.user.id
            };
            req.profile = {
              user:{
                id: proxyResponse.data.user.id,
                name: name
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

export { GtwyEmbeddecodeToken };