const responseTypeModel = require("../../mongoModel/responseTypeModel");
const defaultResponseJson = require("../services/utils/defaultResponseConfig")
const create = async (orgId) => {
    try {
        const temp = await responseTypeModel.create({
            orgId: orgId,
            responseTypes :  defaultResponseJson
        });
        console.log('Document created:', temp);
        return { success: true, chatBot: temp  };
    } catch (error) {
        return { success: false, error: "Failed to create response in org " };
    }
};
const addResponseTypes = async (orgId , responseId , responseJson) => {
    try {
        const temp = await responseTypeModel.findOneAndUpdate({
            orgId: orgId ,
        },{
            $set : {
                [`responseTypes.${responseId}`] : responseJson
            }
        }, { new: true});

        console.log('Document created:', temp);
        return temp._id 
    } catch (error) {
        return { success: false, error: "Failed to add response in org " };
    }
};
module.exports = {
    create,
    addResponseTypes
};