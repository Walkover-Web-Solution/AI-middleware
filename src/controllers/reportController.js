import {get_data_from_pg, get_data_for_daily_report} from '../db_services/reportDbservice.js';

async function getWeeklyreports(req,res, next) {
    const org_ids = req.body.org_ids
    const data = await get_data_from_pg(org_ids);
    res.locals = { data, success: true };
    req.statusCode = 200;
    return next();

}

async function getDailyreports(req,res, next) {
    const org_ids = req.body.org_ids
    const data = await get_data_for_daily_report(org_ids);
    res.locals = { data, success: true };
    req.statusCode = 200;
    return next();
}


export {
    getWeeklyreports,
    getDailyreports
}