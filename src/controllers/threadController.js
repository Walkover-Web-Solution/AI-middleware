// controllers/threadController.js
import { createThread, getThreads } from '../services/threadService.js';
import { generateIdentifier } from '../services/utils/utilityService.js';

// Create a new thread
async function createThreadController(req, res, next) {
    const { name = "", thread_id, subThreadId } = req.body;
    const { org_id } = req.profile;
    const sub_thread_id = subThreadId || generateIdentifier()
    if (!thread_id || !org_id || !sub_thread_id) {
        throw new Error('All fields are required');
    }
    const thread = await createThread({
        display_name: name || sub_thread_id,
        thread_id,
        org_id: org_id.toString(),
        sub_thread_id
    });
    res.locals = {
        thread,
        success: true
    };
    req.statusCode = 201;
    return next();
}

// Get all threads
async function getAllThreadsController(req, res, next) {
    const { thread_id } = req.params;
    const org_id = req?.profile?.org_id || req?.profile?.org?.id
    const threads = await getThreads(org_id, thread_id);
    res.locals = { threads, success: true };
    req.statusCode = 200;
    return next();
}



export {
    createThreadController,
    getAllThreadsController
}