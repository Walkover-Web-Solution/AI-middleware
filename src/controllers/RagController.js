
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

export const create_vectors = async (req, res, next) => {
    // TO DO: implement create_vectors logic
    res.locals = {}
    req.statusCode = 200;
    return next();
};

export const get_vectors_and_text = async (req, res, next) => {
    // TO DO: implement get_vectors_and_text logic
    res.locals = {}
    req.statusCode = 200;
    return next();
};

export const get_all_docs = async (req, res, next) => {
    // TO DO: implement get_all_docs logic
    res.locals = {}
    req.statusCode = 200;
    return next();
};

export const delete_doc = async (req, res, next) => {
    // TO DO: implement delete_doc logic
    res.locals = {}
    req.statusCode = 200;
    return next();
};

