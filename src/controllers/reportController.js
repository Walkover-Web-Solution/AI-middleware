import { get_latency_report_data, get_message_data } from '../db_services/reportDbservice.js';
import { getallOrgs } from '../utils/proxyUtils.js';



async function getMonthlyreports(req,res, next) {
    const orgResp = await getallOrgs();
    let orgIds = [];
    if (Array.isArray(orgResp?.data?.data)) {
        orgIds = orgResp.data.data.map(org => String(org.id));
    }
    const data = await get_latency_report_data(orgIds, 'monthly');
    res.locals = { data, success: true };
    req.statusCode = 200;
    return next();
}

async function getWeeklyreports(req,res, next) {
    const orgResp = await getallOrgs();
    let orgIds = [];
    if (Array.isArray(orgResp?.data?.data)) {
        orgIds = orgResp.data.data.map(org => String(org.id));
    }
    const data = await get_latency_report_data(orgIds, 'weekly');
    if (res) {
        res.locals = { data, success: true };
        req.statusCode = 200;
        return next();
    }
    return data;
}


async function getMessageData(req, res, next) {
    try {
        const { message_id } = req.body;
        
        if (!message_id) {
            res.locals = { 
                error: 'message_id is required', 
                success: false 
            };
            req.statusCode = 400;
            return next();
        }
        
        const data = await get_message_data(message_id);
        res.locals = { data, success: true };
        req.statusCode = 200;
        return next();
    } catch (error) {
        res.locals = { 
            error: error.message, 
            success: false 
        };
        req.statusCode = 500;
        return next();
    }
}

export {
    getWeeklyreports,
    getMonthlyreports,
    getMessageData
}
