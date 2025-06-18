import Thread from '../mongoModel/threadModel.js';

async function createThread(data) {
    const existingThread = await Thread.findOne({ 
        thread_id: data.thread_id, 
        sub_thread_id: data.sub_thread_id,
        org_id: data?.org_id
    });
    
    if (!existingThread) {
        const thread = new Thread(data);
        return await thread.save();
    }
    
    return existingThread;
}

async function getThreads(org_id, thread_id) {
    return await Thread.find({ org_id, thread_id });
}

async function getDisplayName(sub_thread_id) {
    try {
      const thread = await Thread.findOne({ sub_thread_id });
      return thread?.display_name || thread?.sub_thread_id || null;
    } catch (err) {
      console.error("Error in getDisplayName:", err);
      return null;
    }
  }

export {
    createThread,
    getThreads,
    getDisplayName
}