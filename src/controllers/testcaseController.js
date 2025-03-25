import testcaseSevice from "../db_services/testcaseDbservice.js"
import { convertAIConversation } from "../services/utils/utilityService.js";
async function getTestcases(req,res, next) {
    const bridge_id = req.query.bridge_id;
    const result = await testcaseSevice.getAllTestCases(bridge_id);
    res.locals = {
        success: true,
        result
    };
    req.statusCode = 200;
    return next();
}

async function saveTestcases(req,res, next) {
    const {bridge_id, type, conversation, expected, matching_type } = req.body;
    convertAIConversation(conversation);
    const data = {
        bridge_id,
        type,
        conversation,
        expected,
        matching_type
    }
    const result = await testcaseSevice.saveTestCase(data);
    res.locals = {
        success: true,
        result
    };
    req.statusCode = 200;
    return next();
}

async function updateTestcases(req, res, next) {
    const { _id: id, bridge_id, type, conversation, expected } = req.body;
    const data = { id };

    if (bridge_id !== undefined) data.bridge_id = bridge_id;
    if (type !== undefined) data.type = type;
    if (conversation !== undefined) data.conversation = conversation;
    if (expected !== undefined) data.expected = expected;

    const result = await testcaseSevice.updateTestCaseById(id, data);
    res.locals = {
        success: true,
        result
    };
    req.statusCode = 200;
    return next();
}

async function deleteTestcases(req, res, next) {
    
    const { id } = req.body;
    const result = await testcaseSevice.deleteTestCaseById(id);
    res.locals = {
        result
    };
    req.statusCode = 200;
    return next();

}

export {
    getTestcases,
    saveTestcases,
    updateTestcases,
    deleteTestcases
}