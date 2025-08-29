export function selectTable(range) {
    // const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
    // const startDate = new Date(Date.UTC(new Date(startTime).getUTCFullYear(), new Date(startTime).getUTCMonth(), new Date(startTime).getUTCDate(), new Date(startTime).getUTCHours(), new Date(startTime).getUTCMinutes(), new Date(startTime).getUTCSeconds()));
    // const endDate = new Date(Date.UTC(new Date(endTime).getUTCFullYear(), new Date(endTime).getUTCMonth(), new Date(endTime).getUTCDate(), new Date(endTime).getUTCHours(), new Date(endTime).getUTCMinutes(), new Date(endTime).getUTCSeconds()));

    if (range === 1 || range === 2 || range === 3 || range === 4 || range === 5) {
        return 'fifteen_minute_data';
    } else {
        return 'daily_data';
    }
}

export function selectBucket(range) {
    if (range === 1) {
        return "time_bucket('15 minutes', created_at) AS created_at";
    } else if(range === 2 || range === 3 || range === 4 || range === 5){
        return "time_bucket('1 hour', created_at) AS created_at";
    } else {
        return "created_at::date AS created_at";
    }
}

export function buildWhereClause(params, values, factor, range) {
    const conditions = [];

    if (params.org_id !== null && params.org_id !== undefined) {
        values.push(params.org_id);
        conditions.push(`org_id = '${params.org_id}'`);
    }
    if (params.bridge_id !== null && params.bridge_id !== undefined) {
        values.push(params.bridge_id);
        conditions.push(`bridge_id = '${params.bridge_id}'`);
    }
    if (params.version_id !== null && params.version_id !== undefined) {
        values.push(params.version_id);
        conditions.push(`version_id = '${params.version_id}'`);
    }
    if (params.apikey_id !== null && params.apikey_id !== undefined) {
        values.push(params.apikey_id);
        conditions.push(`apikey_id = '${params.apikey_id}'`);
    }
    if (params.thread_id !== null && params.thread_id !== undefined) {
        values.push(params.thread_id);
        conditions.push(`thread_id = '${params.thread_id}'`);
    }
    if (params.service !== null && params.service !== undefined) {
        values.push(params.service);
        conditions.push(`service = '${params.service}'`);
    }
    if (params.model !== null && params.model !== undefined) {
        values.push(params.model);
        conditions.push(`model = '${params.model}'`);
    }

    let query = 'WHERE ' + conditions.join(' AND ');
    if (range) {
        if(range == 1){
            query += ` AND created_at >= NOW() - INTERVAL '1 hour'`;
        }else if(range == 2){
            query += ` AND created_at >= NOW() - INTERVAL '3 hours'`;
        }else if(range == 3){
            query += ` AND created_at >= NOW() - INTERVAL '6 hours'`;
        }else if(range == 4){
            query += ` AND created_at >= NOW() - INTERVAL '12 hours'`;
        }else if(range == 5){
            query += ` AND created_at >= NOW() - INTERVAL '1 day'`;
        }else if(range == 6){
            query += ` AND created_at >= NOW() - INTERVAL '2 days'`;
        }else if(range == 7){
            query += ` AND created_at >= NOW() - INTERVAL '7 days'`;
        }else if(range == 8){
            query += ` AND created_at >= NOW() - INTERVAL '14 days'`;
        }else if(range == 9){
            query += ` AND created_at >= NOW() - INTERVAL '30 days'`;
        }
    }
    if (factor) {
        query += ` GROUP BY ${factor}`;
    }
    return query;
}