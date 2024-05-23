import jwt from "jsonwebtoken";

function generateAuthToken(user, org) {

    const token = jwt.sign({
        user,
        org
    }, process.env.SecretKey);
    return token;

}

const userOrgLocalToken = async (req, res) => {
    if (process.env.ENVIROMENT !== 'local')  res.status(404).send()
        const { userId, orgId, orgName, userName } = req.body;
        const token = generateAuthToken({ id: userId, name: userName || '' }, { id: orgId, name: orgName || '' })
        res.status(200).json({ token });
}

const switchUserOrgLocal = async (req, res) => {
    if (process.env.ENVIROMENT !== 'local')  res.status(404).send()
        const { orgId, orgName } = req.body;
        const { user } = req.profile
        const token = generateAuthToken(user, { id: orgId, name: orgName || '' })
        res.status(200).json({ token });
}

export {
    userOrgLocalToken,
    switchUserOrgLocal
}