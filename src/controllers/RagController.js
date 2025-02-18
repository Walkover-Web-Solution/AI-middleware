
import rag_parent_data from '../db_services/rag_parent_data.js';

export const GetAllDocuments = async (req, res, next) => {
        const orgId = req.Embed.org_id;
        const userId = req.Embed.user_id;
        const result = await rag_parent_data.getAll({
            'org_id': orgId.toString(),
            'user_id': userId.toString()
        });
        res.locals = {result,orgId, userId}
        req.statusCode = 200;
        return next();
}; 