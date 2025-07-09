import Auth from "../mongoModel/authModel.js";
import crypto from "crypto";

const generate_client_id = () => {
    return crypto.randomBytes(16).toString('hex');
};

const find_auth_by_org_id = async (org_id) => {
    try {
        const result = await Auth.findOne({ org_id });
        return result;
    } catch (error) {
        throw new Error(`Failed to find auth by org_id: ${error.message}`);
    }
};

const save_auth_token_in_db = async (name, redirection_url, org_id) => {
    try {
        // Check if record with org_id already exists
        const existingAuth = await find_auth_by_org_id(org_id);
        
        if (existingAuth) {
            return {
                isNew: false,
                client_id: existingAuth.client_id,
                redirection_url: existingAuth.redirection_url,
                name: existingAuth.name
            };
        }
        
        // Generate a new client_id
        const client_id = generate_client_id();
        
        await Auth.create({
            name,
            client_id,
            redirection_url,
            org_id
        });
        
        return {
            isNew: true,
            client_id,
            redirection_url,
            name
        };
    } catch (error) {
        throw new Error(`Failed to save auth token: ${error.message}`);
    }
};

const verify_auth_token = async (client_id, redirection_url) => {
    try {
        const result = await Auth.findOne({
            client_id: client_id,
            redirection_url: redirection_url
        });
        return result;
    } catch (error) {
        throw new Error(`Failed to verify auth token: ${error.message}`);
    }
};

export default {
    save_auth_token_in_db,
    verify_auth_token,
    find_auth_by_org_id,
    generate_client_id
};
