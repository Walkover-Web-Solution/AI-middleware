import jwt from "jsonwebtoken";
import axios from "axios";
import { storeInCache } from "../cache_service/index.js";
import { createProxyToken } from "../services/proxyService.js";

function generateAuthToken(user, org) {

    const token = jwt.sign({
        user,
        org
    }, process.env.SecretKey);
    return token;

}

const userOrgLocalToken = async (req, res) => {
    if (process.env.ENVIROMENT !== 'local') res.status(404).send()
    const { userId, orgId, orgName, userName } = req.body;
    const token = generateAuthToken({ id: userId, name: userName || '' }, { id: orgId, name: orgName || '' })
    res.status(200).json({ token });
}

const switchUserOrgLocal = async (req, res) => {
    if (process.env.ENVIROMENT !== 'local') res.status(404).send()
    const { orgId, orgName } = req.body;
    const { user } = req.profile
    const token = generateAuthToken(user, { id: orgId, name: orgName || '' })
    res.status(200).json({ token });
}

const updateUserDetails = async (req, res) => {
    const PUBLIC_REFERENCEID = process.env.PROXY_USER_REFERENCE_ID;
    const { company_id, company, user_id, user } = req.body;
    
    // Determine the type of update
    const isCompanyUpdate = company_id && company;
    const isUserUpdate = user_id && user;

    if (!isCompanyUpdate && !isUserUpdate) {
        return res.status(400).json({ message: "Please provide both ID and data for either company or user update" });
    }

    // Prepare update object based on type
    const updateObject = isCompanyUpdate
        ? { company_id, company: { "meta": company?.meta } }
        : { user_id, Cuser: { "meta": user?.meta } };

    try {
        const apiUrl = `https://routes.msg91.com/api/${PUBLIC_REFERENCEID}/updateDetails`;
        const response = await axios.put(apiUrl, updateObject, {
            headers: {
                Authkey: process.env.PROXY_ADMIN_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        const data = response.data;

        // Cache based on type
        if (isCompanyUpdate) {
            await storeInCache(company_id, data?.data?.company);
        } else {
            await storeInCache(user_id, data?.data?.user);
        }

        res.status(200).json({
            message: isCompanyUpdate ? "Company details updated successfully" : "User details updated successfully",
            data
        });

    } catch (error) {
        console.error("Error updating details:", error);
        res.status(404).json({ message: "Something went wrong" });
    }
};
const embedUser = async (req, res) => {
    const { name: embeduser_name, email: embeduser_email } = req.isGtwyUser ? {} : req.Embed;
    //   const projectSettings = await projects_db_service.findFields(project_id, 'settings');
    const embedDetails = !req.isGtwyUser ?
        {
            user_id: req.Embed.user_id,
            company_id: req?.Embed?.org_id,
            company_name: req.Embed.org_name,
            tokenType: 'embed',
            embeduser_name, embeduser_email
        }
        : {
            company_id: req.company_id,
            company_name: req.company_name,
            user_id: req.user_id
        };
    const response = {
        ...(req?.Embed || {}),
        ...(req.Embed?.user_id ? { user_id: req.Embed.user_id } : {}),
        token: await createProxyToken(embedDetails),
      };
    res.locals = { data: response, success: true };
    req.statusCode = 200;
    return next();
  };
            
const removeUsersFromOrg = async (req, res, next) => {
  try {
    const userId = req.body.user_id;
    const companyId = req.profile.org.id;
    const featureId = `${process.env.PROXY_USER_REFERENCE_ID}`;
    const user_detail = await axios.get(`${process.env.PROXY_BASE_URL}/${process.env.PUBLIC_REFERENCEID}/getDetails`, {
        params: {
            company_id: companyId,
            pageNo: 1,
            itemsPerPage : 1
        },
        headers: {
            authkey: process.env.PROXY_ADMIN_TOKEN
        }
    });
    const ownerId = user_detail.data.data.data[0].id;
    if (userId === ownerId) {
        throw new Error('You cannot remove the owner of the organization');
    }

    const response = await axios.post(
      `${process.env.PROXY_BASE_URL}/clientUsers/${userId}/remove?feature_id=${featureId}&company_id=${companyId}`,
      null,
      {
        headers: {
          'Content-Type': 'application/json',
          Authkey: process.env.PROXY_ADMIN_TOKEN,
        },
      },
    );

    res.locals = { data: response.data.data.message, success: true };
    req.statusCode = 200;
    return next();
  } catch (error) {
    console.error('Error in Removing Users: ', error.message);
    throw error; // Re-throw the error for the caller to handle
  }
}

export {
    userOrgLocalToken,
    switchUserOrgLocal,
    updateUserDetails,
    embedUser,
    removeUsersFromOrg
}