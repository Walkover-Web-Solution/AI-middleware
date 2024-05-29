import { getUserOrgMapping, switchOrganization } from '../../services/proxyService.js';

async function userOrgAccessCheck(req, res, next) {
  const { params, profile } = req;
  const checkOrgId = profile.org.id;
  const orgId = params['orgId'];
  try {

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
