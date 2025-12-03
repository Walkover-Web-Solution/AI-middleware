import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import ConfigurationServices from "../db_services/ConfigurationServices.js";

const generateToken = (payload, secret) => {
    return jwt.sign(payload, secret);
};

const loginPublicUser = async (req, res, next) => {
    const userInfo = req.profile?.user || {};
    const body = req.body;
    let userId = userInfo.id || body.user_id;
    const userEmail = userInfo.email;
    const isPublic = !userEmail;

    if (!userId) {
        const clientHost = req.ip; // Express uses req.ip
        if (clientHost) {
            userId = crypto.createHash('sha256').update(clientHost).digest('hex');
        } else {
            userId = uuidv4();
        }
    }

    const token = generateToken(
        { userId: userId, userEmail: userEmail, ispublic: isPublic },
        process.env.PUBLIC_CHATBOT_TOKEN
    );

    res.locals = {
        token: token,
        user_id: userId
    };
    req.statusCode = 200;
    return next();
};

const getAllAgents = async (req, res, next) => {
    const userEmail = req.profile?.userEmail || '';
    const result = await ConfigurationServices.getAllAgentsData(userEmail);

    res.locals = {
        success: true,
        data: result
    };
    req.statusCode = 200;
    return next();
};


const getAgent = async (req, res, next) => {
    const { slug_name } = req.params;
    const userEmail = req.profile?.userEmail || '';

    const agent = await ConfigurationServices.getAgentsData(slug_name, userEmail);

    res.locals = {
        success: true,
        data: agent
    };
    req.statusCode = 200;
    return next();
};

export default {
    loginPublicUser,
    getAllAgents,
    getAgent
};
