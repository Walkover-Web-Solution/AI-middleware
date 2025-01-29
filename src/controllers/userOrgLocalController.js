import jwt from "jsonwebtoken";
import axios from "axios";

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
    const PUBLIC_REFERENCEID = req.headers?.['reference-id'];
    const { company_id, company } = req.body;

    if (!company_id || !company) {
        return res.status(400).json({ message: "company_id and company are required." });
    }

    const updateObject = {
        company_id,
        company : {"meta":company?.meta}
    };

    try {
        const apiUrl = `https://routes.msg91.com/api/${PUBLIC_REFERENCEID}/updateDetails`;
        const response = await axios.put(apiUrl, updateObject, {
            headers: {
                Authkey: process.env.ADMIN_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        const data = response.data;
        res.status(200).json({ message: "User details updated successfully", data });
    } catch (error) {
        console.error("Error updating user details:", error);
        res.status(404).json({ message: "Something went wrong" });
    }
};

export {
    userOrgLocalToken,
    switchUserOrgLocal,
    updateUserDetails
}