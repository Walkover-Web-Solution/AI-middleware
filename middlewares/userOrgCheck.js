import { getUserOrgMapping, switchOrganization } from '../services/proxyService.js';

async function userOrgAccessCheck(req, res, next) {
  const { params, profile } = req;
  const checkOrgId = profile.org.id;
  const orgId = params['orgId'];

  if(orgId === undefined) return res.status(403).send('Sorry, Either the field is missing or You are not authorized to access this flow!');
  
  if (orgId !== checkOrgId?.toString()) {
    try {
      const isValidUserOrgMapping = await getUserOrgMapping(profile.user.id, orgId);
      const proxyToken = req.get('proxy-auth-token');
      
      if (isValidUserOrgMapping && proxyToken) {
        await switchOrganization({ company_ref_id: orgId }, proxyToken);
        req.profile.org.id = orgId;
        return next();
      }
    } catch (err) {
      return res.status(403).send({message: 'Sorry, Either the field is missing or You are not authorized to access this flow!', error: err?.message});
    }
    return res.status(403).send('Sorry, Either the field is missing or You are not authorized to access this flow!');
  }

  next();
}

export default userOrgAccessCheck;
