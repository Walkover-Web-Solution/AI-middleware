import Thread from '../mongoModel/threadModel.js';

async function createThread(data) {
    return await Thread.findOneAndUpdate(
        { thread_id: data.thread_id, sub_thread_id: data.sub_thread_id },
        data,
        { upsert: true, new: true }
    );
}

async function getThreads(org_id, thread_id) {
    return await Thread.find({ org_id, thread_id });
}


export {
    createThread,
    getThreads
}