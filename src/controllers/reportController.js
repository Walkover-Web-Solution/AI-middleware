import get_data_from_pg from '../db_services/reportDbservice.js';
async function getWeeklyreports(req,res, next) {
    const org_ids = req.body.org_ids
    const data = await get_data_from_pg(org_ids);
    res.locals = { data, success: true };
    req.statusCode = 200;
    return next();

}


export {
    getWeeklyreports
}