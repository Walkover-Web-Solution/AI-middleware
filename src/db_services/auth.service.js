import Auth from "../mongoModel/Auth.model.js";
import crypto from "crypto";

const generateClientId = () => {
  return crypto.randomBytes(16).toString("hex");
};

const findAuthByOrgId = async (org_id) => {
  try {
    const result = await Auth.findOne({ org_id });
    return result;
  } catch (error) {
    throw new Error(`Failed to find auth by org_id: ${error.message}`);
  }
};

const saveAuthTokenInDb = async (name, redirection_url, org_id) => {
  try {
    // Check if record with org_id already exists
    const existingAuth = await findAuthByOrgId(org_id);

    if (existingAuth) {
      return {
        isNew: false,
        client_id: existingAuth.client_id,
        redirection_url: existingAuth.redirection_url,
        name: existingAuth.name,
      };
    }

    // Generate a new client_id
    const client_id = generateClientId();

    await Auth.create({
      name,
      client_id,
      redirection_url,
      org_id,
    });

    return {
      isNew: true,
      client_id,
      redirection_url,
      name,
    };
  } catch (error) {
    throw new Error(`Failed to save auth token: ${error.message}`);
  }
};

const verifyAuthToken = async (client_id, redirection_url) => {
  try {
    const result = await Auth.findOne({
      client_id: client_id,
      redirection_url: redirection_url,
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to verify auth token: ${error.message}`);
  }
};

const findAuthByClientId = async (client_id) => {
  try {
    const result = await Auth.findOne({ client_id }, { name: 1, client_id: 1 });
    if (!result) {
      throw new Error(`Auth with client_id ${client_id} not found`);
    }
    return result;
  } catch (error) {
    throw new Error(`Failed to find auth by client_id: ${error.message}`);
  }
};

export default {
  saveAuthTokenInDb,
  verifyAuthToken,
  findAuthByOrgId,
  generateClientId,
  findAuthByClientId,
};
