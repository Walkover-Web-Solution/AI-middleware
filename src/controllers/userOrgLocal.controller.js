import { storeInCache } from "../cache_service/index.js";
import { updateProxyDetails, getProxyDetails, removeClientUser, generateProxyAuthToken } from "../services/proxy.service.js";

const userOrgLocalToken = async (req, res, next) => {
  const token = await generateProxyAuthToken(req);
  res.locals = { data: { token }, success: true };
  req.statusCode = 200;
  return next();
};

const switchUserOrgLocal = async (req, res, next) => {
  const token = await generateProxyAuthToken(req);
  res.locals = { data: { token }, success: true };
  req.statusCode = 200;
  return next();
};

const updateUserDetails = async (req, res, next) => {
  const { company_id, company, user_id, user } = req.body;
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
  const { user_id: userId } = req.body;
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
