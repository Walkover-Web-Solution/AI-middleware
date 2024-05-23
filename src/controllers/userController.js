import jwt from "jsonwebtoken";

function generateAuthToken(user, org) {

    const token = jwt.sign({
        user,
        org
    }, process.env.SecretKey);
    return token;

}

const createUser = async (req, res) => {
    if (process.env.ENVIROMENT === 'local') {
        const { userId, orgId, orgName, userName } = req.body;
        const token = generateAuthToken({ id: userId, name: userName || '' }, { id: orgId, name: orgName || '' })
        res.status(200).json({ token });
    } else {
        res.status(404).send()
    }
}

const switchUser = async (req, res) => {
    if (process.env.ENVIROMENT === 'local') {
        const { orgId, orgName } = req.body;
        const { user } = req.profile
        const token = generateAuthToken(user, { id: orgId, name: orgName || '' })
        res.status(200).json({ token });
    } else {
        res.status(404).send()
    }
}

export {
    createUser,
    switchUser
}