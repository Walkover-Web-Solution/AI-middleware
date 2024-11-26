import Thread from '../mongoModel/threadModel.js';

async function createThread(data) {
    const thread = new Thread(data);
    return await thread.save();
}

async function getThreads(org_id, thread_id) {
    return await Thread.find({ org_id, thread_id });
}


export {
    createThread,
    getThreads
}