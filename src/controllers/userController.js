import jwt from "jsonwebtoken";

function generateAuthToken(user, org) {
    const token = jwt.sign({
        user,
        org
    }, process.env.SecretKey);
    return token;
}

const createUser = async (req, res) => {
    const { userId, orgId, orgName, userName } = req.body;
    const token = generateAuthToken({ id: userId, name: userName || '' }, { id: orgId, name: orgName || '' })
    res.status(200).json({ token });
}

const switchUser = async (req, res) => {
    const { orgId, orgName } = req.body;
    const { user } = req.profile
    const token = generateAuthToken(user, { id: orgId, name: orgName || '' })
    res.status(200).json({ token });
}

export {
    createUser,
    switchUser
}