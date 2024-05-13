

const createChatBot = async (req, res) => {
    try {
        let {  org_id } = req.body;
       
        return res.status(200).json({ org_id });
        // return res.status(400).json(result);
    } catch (error) {
        console.log("common error=>", error);
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}
const updateChatBot = async (req, res) => {
    try {
        let {  org_id } = req.body;
       
        return res.status(200).json({ org_id });
        // return res.status(400).json(result);
    } catch (error) {
        console.log("common error=>", error);
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}
const deleteChatBot = async (req, res) => {
    try {
        let {  org_id } = req.body;
       
        return res.status(200).json({ org_id });
        // return res.status(400).json(result);
    } catch (error) {
        console.log("common error=>", error);
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}
const getAllChatBot = async (req, res) => {
    try {
        let {  org_id } = req.body;
       
        return res.status(200).json({ org_id });
        // return res.status(400).json(result);
    } catch (error) {
        console.log("common error=>", error);
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}


module.exports = {
    createChatBot,
    updateChatBot,
    deleteChatBot,
    getAllChatBot,
}