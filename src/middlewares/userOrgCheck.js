import { getUserOrgMapping, switchOrganization } from '../services/proxyService.js';
import ChatBotDbService from '../db_services/ChatBotDbService.js';
import configurationModel from '../mongoModel/configuration.js';

async function userOrgAccessCheck(req, res, next) {
  const { params,profile } = req;
  const checkOrgId = profile.org.id;
  let orgId;
  const toFind = ['bridge_id', 'botId', 'orgId'];
  try {
    for (let i = 0; i < toFind.length; i++) {
      if (!params.hasOwnProperty(toFind[i])) continue;
      if (toFind[i] === 'orgId') {
        orgId = params[toFind[i]];
        break;
      } else if (toFind[i] === 'bridge_id') {//testing pending
        orgId = await configurationModel.findOne({
          _id: params[toFind[i]]
        }, { org_id: 1 });
        break;
      } else if (toFind[i] === 'botId') { //testing pending
        orgId = (await ChatBotDbService.getOne(params[toFind[i]]))?.chatbot?.orgId;
        console.log(orgId);
        break;
      }
    }
    if (!orgId) return res.status(403).send('Sorry, Either the field is missing or You are not authorized to access this flow!');

    if (orgId !== checkOrgId?.toString()) {
      const isValidUserOrgMapping = await getUserOrgMapping(profile.user.id, orgId);
      //live pr proxy-auth-token or local pr proxy_auth_token
      const proxyToken = req.get('proxy-auth-token') || req.get('proxy_auth_token');

      if (!isValidUserOrgMapping || !proxyToken)
        return res.status(403).send('Sorry, Either the field is missing or You are not authorized to access this flow!');

      await switchOrganization({ company_ref_id: orgId }, proxyToken);
      req.profile.org.id = orgId;
    }
  } catch (err) {
    return res.status(403).send({ message: 'Sorry, Either the field is missing or You are not authorized to access this flow!', error: err?.message });
  }

  next();
}

export default userOrgAccessCheck;
