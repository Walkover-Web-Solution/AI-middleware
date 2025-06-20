import Auth from "../mongoModel/authModel.js";

const save_auth_token_in_db = async (client_id, redirection_url, org_id, refresh_token) => {
    try {
        const refresh_token_expires_at = new Date();
        refresh_token_expires_at.setDate(refresh_token_expires_at.getDate() + 30); // 30 days expiry

        await Auth.create({
            client_id,
            redirection_url,
            org_id,
            refresh_token,
            refresh_token_expires_at
        });
        return true;
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
    verify_auth_token
};
