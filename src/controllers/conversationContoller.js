const chatbotDbService = require('../db_services/conversationDbService');

const getAllThreads = async (bridge_id,org_id) => {
    try {
        const chats = await chatbotDbService.findAllThreads(bridge_id,org_id);
        return { success: true, data: chats };
    } catch (err) {
        console.log("getall threads=>",err)
        return { success: false, message: err.message }
    }
};
const getThread = async (thread_id, org_id,bridge_id) => {
    try {
        const chats = await chatbotDbService.find(org_id, thread_id,bridge_id);
        return { success: true, data: chats };
    } catch (err) {
        console.log(err)
        return { success: false, message: err.message }
    }
};
const savehistory = async (thread_id, userMessage, botMessage, org_id, bridge_id,model_name,type,messageBy,userRole="user") => {
    try {
        let chatToSave = [{
            thread_id: thread_id,
            org_id: org_id,
            model_name:model_name,
            message: userMessage || "",
            message_by: userRole,
            type:type,
            bridge_id: bridge_id,
        }];
        if (botMessage) {
            chatToSave.push({
                thread_id: thread_id,
                org_id: org_id,
                model_name:model_name,
                message: messageBy!="tool_calls"?botMessage:"",
                message_by: messageBy,
                type:type,
                bridge_id: bridge_id,
                function:messageBy==="tool_calls"?botMessage:{}
            });
        }
        if(userRole=="tool"){
        const {success}=await chatbotDbService.deleteLastThread(org_id, thread_id,bridge_id);
        chatToSave=chatToSave.slice(-1);
        console.log("hey deleted")
        if(!success){
            // return { success:true,message: "successfully deleted last chat and saved bot response!" }
            return { success:false,message: "failed to delete last chat!" }
        }
        }
        console.log("chatToSave", chatToSave)
        const result=await chatbotDbService.createBulk(chatToSave);
        console.log(result);
        return { success:true,message: "successfully saved chat history" }

    } catch (error) {
        console.log("saveconversation error=>",error)
        return { success:false,message: error.message }

    }



}

module.exports = {
    getAllThreads,
    savehistory,
    getThread
};
