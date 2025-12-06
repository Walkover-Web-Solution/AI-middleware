import { storeInCache } from "../cache_service/index.js";
import { updateProxyDetails, getProxyDetails, removeClientUser } from "../services/proxy.service.js";
import { generateAuthToken } from "../services/utils/utility.service.js";
import {
    switchUserOrgLocalBodySchema,
    updateUserDetailsBodySchema,
    removeUsersFromOrgBodySchema
} from "../validation/joi_validation/userOrgLocal.validation.js";

const userOrgLocalToken = async (req, res, next) => {
  const { user, org, exp, iat, ...extra } = req.profile;
  const token = generateAuthToken(user, org, extra);
  res.locals = { data: { token }, success: true };
  req.statusCode = 200;
  return next();
}

const switchUserOrgLocal = async (req, res, next) => {
  // Validate request body
  const validatedBody = await switchUserOrgLocalBodySchema.validateAsync(req.body);
  const { orgId, orgName } = validatedBody;
  const { user, org, exp, iat, ...extra } = req.profile;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const remainingLifetime = Number.isFinite(exp) ? Math.max(exp - nowInSeconds, 0) : null;
  const expiresInOptions = Number.isFinite(remainingLifetime)
    ? { expiresInSeconds: Math.max(remainingLifetime, 1) }
    : {};
  const token = generateAuthToken(
    user,
    { id: orgId, name: orgName || '' },
    extra,
    expiresInOptions
  );
  res.locals = { data: { token }, success: true };
  req.statusCode = 200;
  return next();
}

const updateUserDetails = async (req, res, next) => {
  // Validate request body
  const validatedBody = await updateUserDetailsBodySchema.validateAsync(req.body);
  const { company_id, company, user_id, user } = validatedBody;
  const isCompanyUpdate = company_id && company;
  const updateObject = isCompanyUpdate
    ? { company_id, company: { "meta": company?.meta } }
    : { user_id, Cuser: { "meta": user?.meta } };

  const data = await updateProxyDetails(updateObject);

  if (isCompanyUpdate) {
    await storeInCache(company_id, data?.data?.company);
  } else {
    await storeInCache(user_id, data?.data?.user);
  }

  res.locals = {
    message: isCompanyUpdate ? "Company details updated successfully" : "User details updated successfully",
    data,
    success: true
  };
  req.statusCode = 200;
  return next();
};

const removeUsersFromOrg = async (req, res, next) => {
  // Validate request body
  const validatedBody = await removeUsersFromOrgBodySchema.validateAsync(req.body);
  const userId = validatedBody.user_id;
  const companyId = req.profile.org.id;
  const featureId = `${process.env.PROXY_USER_REFERENCE_ID}`;

  const user_detail = await getProxyDetails({
    company_id: companyId,
    pageNo: 1,
    itemsPerPage: 1
  });

  const ownerId = user_detail.data.data[0].id;
  if (userId === ownerId) {
    throw new Error('You cannot remove the owner of the organization');
  }

  const response = await removeClientUser(userId, companyId, featureId);

  res.locals = { data: response.data.message, success: true };
  req.statusCode = 200;
  return next();
}

export {
  userOrgLocalToken,
  switchUserOrgLocal,
  updateUserDetails,
  removeUsersFromOrg
}
