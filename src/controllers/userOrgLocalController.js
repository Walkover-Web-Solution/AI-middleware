import jwt from "jsonwebtoken";

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
    // if (process.env.ENVIROMENT !== 'local') return res.status(404).send();

    const PUBLIC_REFERENCEID = req.headers?.['reference-id']
    const { company_id, company } = req.body;
    const updateObject = {
        company_id: company_id,
        company: company,
    };
    try {
        const apiUrl = `https://routes.msg91.com/${PUBLIC_REFERENCEID}/updateDetails`;
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                proxy_auth_token: req.headers['proxy_auth_token'],
                Authkey: process.env.ADMIN_API_KEY
            },
            body: updateObject 
       });

    if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}, error: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json({ message: "User details updated successfully", data });
    } catch (error) {
        console.error("Error updating user details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export {
    userOrgLocalToken,
    switchUserOrgLocal,
    updateUserDetails
}