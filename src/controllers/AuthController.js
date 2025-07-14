import { generateIdentifier } from "../services/utils/utilityService.js";
import { getOrganizationById, updateOrganizationData, createProxyToken } from "../services/proxyService.js";
import auth_service from "../db_services/auth_service.js";
import jwt from 'jsonwebtoken';

const CreateAuthToken = async (req, res) => {
    const org_id =  req.profile.org.id
    const auth_token = generateIdentifier(14);
    const data = await getOrganizationById(org_id)
    if(!data?.meta?.auth_token) await updateOrganizationData(org_id,  {
        meta: {
          ...data?.meta,
          auth_token,
        },
      },
    );
    res.status(200).json({ auth_token: data?.meta?.auth_token || auth_token });
}



const save_auth_token_in_db_controller = async (req, res, next) => {
    const { name, redirection_url } = req.body;
    const org_id = req.profile.org.id;
    
    const result = await auth_service.save_auth_token_in_db(name, redirection_url, org_id);
    res.locals = {
        success: true, 
        message: "Auth token saved successfully",
        result
    }
    req.statusCode = 201;
    return next();
};

const get_auth_token_in_db_controller = async (req, res, next) => {
    const org_id = req.profile.org.id;
    
    const result = await auth_service.find_auth_by_org_id(org_id);
    
    res.locals = {
        success: true, 
        message: "Auth token found successfully",
        result
    }
    req.statusCode = 200;
    return next();

};


const verify_auth_token_controller = async (req, res) => {
    const { client_id, redirection_url, state } = req.body;
    const {user, org} = req.profile;
    
    await auth_service.verify_auth_token(client_id, redirection_url);
    
    const data = {
        company_id: org.id,
        user_id : user.id
    };

    const accessToken = await createProxyToken({
        ...data
    });

    const refreshToken = jwt.sign(
        { ...data },
        process.env.SecretKey
    );
    
    return res.redirect(301, `${redirection_url}?access_token=${accessToken}&refresh_token=${refreshToken}&state=${state}`);
};



const refresh_token_controller = async (req, res, next) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        throw new Error('Refresh token is required');
    }

    const decoded = jwt.verify(refresh_token, process.env.SecretKey);
    
    const accessToken = await createProxyToken({
        company_id: decoded.company_id,
        user_id: decoded.user_id
    });

    res.locals = {
        success: true,
        message: 'Access token refreshed successfully',
        access_token: accessToken
    }
    req.statusCode = 200;
    return next();
};

const get_client_info_controller = async (req, res, next) => {
    const { client_id } = req.query;

    if (!client_id) {
        throw new Error('Client id is required');
    }

    const result = await auth_service.find_auth_by_client_id(client_id);

    res.locals = {
        success: true,
        message: 'Client info found successfully',
        result
    }
    req.statusCode = 200;
    return next();
};

export {
    CreateAuthToken,
    save_auth_token_in_db_controller,
    verify_auth_token_controller,
    refresh_token_controller,
    get_client_info_controller,
    get_auth_token_in_db_controller
}