import configurationModel from "../../mongoModel/configuration.js";
import apiCallModel from "../../mongoModel/apiCall.js";
import ChatBotModel from "../../mongoModel/chatBotModel.js";
const createBridges = async configuration => {
  try {
    const result = await new configurationModel({
      ...configuration
    }).save();
    return {
      success: true,
      bridge: result
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const getAllBridges = async org_id => {
  try {
    const bridges = await configurationModel.find({
      org_id: org_id
    }, {
      bridge_id: 1,
      _id: 1,
      name: 1,
      service: 1,
      org_id: 1,
      "configuration.model": 1,
      "configuration.prompt": 1,
      "configuration.input": 1
    });
    return {
      success: true,
      bridges: bridges
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const updateBridges = async (bridge_id, configuration, org_id, apikey) => {
  try {
    const bridges = await configurationModel.findOneAndUpdate({
      _id: bridge_id,
      org_id: org_id
    }, {
      configuration: configuration,
      name: configuration?.name,
      service: configuration?.service,
      apikey: apikey
    }, {
      new: true,
      projection: {
        "is_api_call": 0,
        "created_at": 0,
        "api_endpoints": 0,
        "__v": 0,
        "bridge_id": 0
      }
    }).lean();
    return {
      success: true,
      message: "bridge updated successfully",
      bridges
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const updateBridgeType = async (bridge_id, org_id, bridgeType) => {
  try {
    const bridges = await configurationModel.findOneAndUpdate({
      _id: bridge_id,
      org_id: org_id
    }, {
      bridgeType: bridgeType
    }, {
      new: true
    });
    return {
      success: true,
      message: "bridge type updated successfully",
      bridges: bridges
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong in updating bridge type!!"
    };
  }
};
const getBridges = async bridge_id => {
  try {
    const bridges = await configurationModel.findOne({
      _id: bridge_id
    });
    return {
      success: true,
      bridges: bridges
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const getBridgesWithSelectedData = async bridge_id => {
  try {
    const bridges = await configurationModel.findOne({
      _id: bridge_id
    }, {
      "is_api_call": 0,
      "created_at": 0,
      "api_endpoints": 0,
      "__v": 0,
      "bridge_id": 0
    }).lean();
    return {
      success: true,
      bridges: bridges
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const getBridgesByName = async (name, org_id) => {
  try {
    const bridges = await configurationModel.findOne({
      name: name,
      org_id: org_id
    });
    return {
      success: true,
      bridges: bridges
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const deleteBridge = async (bridge_id, org_id) => {
  try {
    const bridges = await configurationModel.findOneAndDelete({
      _id: bridge_id,
      org_id: org_id
    });
    return {
      success: true,
      bridges: bridges
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const updateToolsCalls = async (bridge_id, org_id, configuration, api_endpoints, api_call) => {
  try {
    const bridges = await configurationModel.findOneAndUpdate({
      _id: bridge_id,
      org_id: org_id
    }, {
      configuration: configuration,
      api_endpoints: api_endpoints,
      api_call: api_call,
      is_api_call: true
    });
    return {
      success: true,
      message: "bridge updated successfully"
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const getApiCallById = async apiId => {
  try {
    const apiCall = await apiCallModel.findById(apiId);
    return {
      success: true,
      apiCall: apiCall
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const addResponseIdinBridge = async (bridgeId, orgId, responseId, responseRefId) => {
  try {
    const bridges = await configurationModel.findOneAndUpdate({
      _id: bridgeId
    }, {
      $addToSet: {
        responseIds: responseId
      },
      $set: {
        responseRef: responseRefId
      }
    }, {
      new: true
    });
    return {
      success: true,
      bridges: bridges
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};

// get bridge with slugname
const getBridgeBySlugname = async (orgId, slugName) => {
  try {
    console.log(orgId, slugName);
    const bridges = await configurationModel.findOne({
      slugName: slugName,
      org_id: orgId
    }).populate('responseRef');
    return {
      success: true,
      bridges: bridges
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const removeResponseIdinBridge = async (bridgeId, orgId, responseId) => {
    try {
        const bridges = await configurationModel.findOneAndUpdate({ _id: bridgeId }, {
            $pull: {
                responseIds: responseId,
            }
        }, { new: true });
        return { success: true, bridges: bridges };
    } catch (error) {
        console.log("error:", error);
        return { success: false, error: "something went wrong!!" }
    }

}


const findChatbotOfBridge = async (orgId, bridgeId) => {
  try {
    const bridges = await ChatBotModel.find({
      orgId: orgId,
      bridge: bridgeId
    });
    return {
      success: true,
      bridges: bridges
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
export default {
  createBridges,
  getAllBridges,
  getBridges,
  updateBridges,
  getBridgesByName,
  deleteBridge,
  updateToolsCalls,
  getApiCallById,
  getBridgesWithSelectedData,
  addResponseIdinBridge,
  removeResponseIdinBridge,
  getBridgeBySlugname,
  findChatbotOfBridge,
  updateBridgeType
};