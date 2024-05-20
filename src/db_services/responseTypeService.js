import responseTypeModel from "../../mongoModel/responseTypeModel.js";
import defaultResponseJson from "../services/utils/defaultResponseConfig.js";
const create = async orgId => {
  try {
    const temp = await responseTypeModel.create({
      orgId: orgId,
      responseTypes: defaultResponseJson
    });
    console.log('Document created:', temp);
    return {
      success: true,
      chatBot: temp
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to create response in org "
    };
  }
};

const getAll = async (orgId) => {
  try {
    const temp = await responseTypeModel.findOne({
      orgId: orgId,
    });
    console.log('Document found:', temp);
    return { success: true, chatBot: temp };
  } catch (error) {
    return { success: false, error: "Failed to create response in org " };
  }
};

const addResponseTypes = async (orgId, responseId, responseJson) => {
  try {
    const temp = await responseTypeModel.findOneAndUpdate({
      orgId: orgId
    }, {
      $set: {
        [`responseTypes.${responseId}`]: responseJson
      }
    }, {
      new: true
    });
    console.log('Document created:', temp);
    return temp._id;
  } catch (error) {
    return {
      success: false,
      error: "Failed to add response in org "
    };
  }
};

const createOrgToken = async (orgId, token) => {
  try {
    const orgData = await responseTypeModel.findOneAndUpdate({
      orgId: orgId
    }, {
      $set: {
        orgAcessToken :  token
      }
    }, {
      new: true
    });
   return {success : true , orgData }
  } catch (error) {
    return {
      success: false,
      error: error?.message
    };
  }
};

export default {
  create,
  addResponseTypes,
  getAll,
  createOrgToken
};