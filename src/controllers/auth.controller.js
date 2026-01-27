import { generateIdentifier } from "../services/utils/utility.service.js";
import { getOrganizationById, updateOrganizationData, createProxyToken } from "../services/proxy.service.js";
import auth_service from "../db_services/auth.service.js";
import jwt from "jsonwebtoken";

const createAuthToken = async (req, res, next) => {
  const org_id = req.profile.org.id;
  const auth_token = generateIdentifier(14);
  const data = await getOrganizationById(org_id);
  if (!data?.meta?.auth_token)
    await updateOrganizationData(org_id, {
      meta: {
        ...data?.meta,
        auth_token,
      },
    });
  res.locals = { auth_token: data?.meta?.auth_token || auth_token };
  req.statusCode = 200;
  return next();
};

const saveAuthTokenInDbController = async (req, res, next) => {
  const { name, redirection_url } = req.body;
  const org_id = req.profile.org.id;

  const result = await auth_service.saveAuthTokenInDb(name, redirection_url, org_id);
  res.locals = {
    success: true,
    message: "Auth token saved successfully",
    result,
  };
  req.statusCode = 201;
  return next();
};

const getAuthTokenInDbController = async (req, res, next) => {
  const org_id = req.profile.org.id;

  const result = await auth_service.findAuthByOrgId(org_id);

  res.locals = {
    success: true,
    message: "Auth token found successfully",
    result,
  };
  req.statusCode = 200;
  return next();
};

const verifyAuthTokenController = async (req, res) => {
  const { client_id, redirection_url, state } = req.body;
  const { user, org } = req.profile;

  await auth_service.verifyAuthToken(client_id, redirection_url);

  const data = {
    company_id: org.id,
    user_id: user.id,
  };

  const accessToken = await createProxyToken({
    ...data,
  });

  const refreshToken = jwt.sign({ ...data }, process.env.SecretKey);

  return res.redirect(
    301,
    `${redirection_url}?access_token=${accessToken}&refresh_token=${refreshToken}&state=${state}`
  );
};

const getClientInfoController = async (req, res, next) => {
  const { client_id } = req.query;

  if (!client_id) {
    throw new Error("Client id is required");
  }

  const result = await auth_service.findAuthByClientId(client_id);

  res.locals = {
    success: true,
    message: "Client info found successfully",
    result,
  };
  req.statusCode = 200;
  return next();
};

export {
  createAuthToken,
  saveAuthTokenInDbController,
  verifyAuthTokenController,
  getClientInfoController,
  getAuthTokenInDbController,
};
