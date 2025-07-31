import {get_data_from_pg, get_data_for_daily_report, get_latency_report_data} from '../db_services/reportDbservice.js';
import { getallOrgs } from '../utils/proxyUtils.js';



async function getDailyreports(req,res, next) {
    const org_ids = req.body.org_ids
    const data = await get_data_for_daily_report(org_ids);
    res.locals = { data, success: true };
    req.statusCode = 200;
    return next();
}

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


export {
    getWeeklyreports,
    getDailyreports,
    getMonthlyreports
}