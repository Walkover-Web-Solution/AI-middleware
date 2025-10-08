import orchestratorDbService from '../db_services/orchestratorDbService.js';

async function getHistoryByOrchestratorId(req, res, next) {

    const { orchestrator_id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const { org_id } = req.body;

    //console.log(`Fetching history for org_id: ${org_id}, orchestrator_id: ${orchestrator_id}`);

    const result = await orchestratorDbService.getOrchestratorHistory(

        

        org_id,
        orchestrator_id, 
        parseInt(page, 10),
        parseInt(pageSize, 10)
    );

    res.locals = { ...result, success: true };
    req.statusCode = 200;
    return next();
}

export {
    getHistoryByOrchestratorId,
};
