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



const save_auth_token_in_db_controller = async (req, res) => {
    try {
        const { client_id, redirection_url } = req.body;
        const org_id = req.profile.org.id;
        
        await auth_service.save_auth_token_in_db(client_id, redirection_url, org_id);
        
        return res.status(200).json({ 
            success: true, 
            message: "Auth token saved successfully" 
        });
    } catch (e) {
        return res.status(400).json({ 
            success: false, 
            message: `Error saving auth token: ${e.message}` 
        });
    }
};

const verify_auth_token_controller = async (req, res) => {
    try {
        const { client_id, redirection_url } = req.body;
        const user_id = req.profile.user.id;
        
        const result = await auth_service.verify_auth_token(client_id, redirection_url);
        
        const data = {
            company_id: result.org_id,
            user_id : user_id
        };

        const accessToken = await createProxyToken({
            ...data
        });

        const refreshToken = jwt.sign(
            { ...data },
            process.env.SecretKey,
            { expiresIn: '3d' }
        );
        
        return res.status(200).json({ 
            success: true, 
            message: "Auth token verified successfully",
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: 259200 // 3 days in seconds
        });
    } catch (e) {
        return res.status(400).json({ 
            success: false, 
            message: `Error verifying auth token: ${e.message}` 
        });
    }
};



export {
    CreateAuthToken,
    save_auth_token_in_db_controller,
    verify_auth_token_controller
}