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
    console.error("error:", error);
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
      "configuration.input": 1,
      bridgeType: 1
    });
    return {
      success: true,
      bridges: bridges
    };
  } catch (error) {
    console.error("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const updateBridges = async (bridge_id, configuration, org_id, apikey, bridgeType, slugName) => {
  try {
    // Check if slugName is being updated and if it is unique
    if (slugName) {
      const existingBridge = await configurationModel.findOne({
        slugName: slugName,
        org_id: org_id,
        _id: { $ne: bridge_id } // Exclude the current bridge from the check
      });

      if (existingBridge) {
        throw new Error("slugName must be unique");
      }
    }

    const bridges = await configurationModel.findOneAndUpdate({
      _id: bridge_id,
      org_id: org_id
    }, {
      configuration: configuration,
      name: configuration?.name,
      service: configuration?.service,
      apikey: apikey,
      bridgeType: bridgeType,
      slugName: slugName
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

    throw new Error(error?.message || "some error occured");
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
    console.error("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const getBridgesBySlugNameAndName = async (slugName, name, org_id) => {
  try {
    const bridges = await configurationModel.findOne({
      org_id: org_id,
      $or: [
        { slugName: slugName },
        { name: name }
      ]
    });
    return {
      success: true,
      bridges: bridges
    };
  } catch (error) {
    console.error("error:", error);
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
    console.error("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};
const updateToolsCalls = async (bridge_id, org_id, configuration, api_endpoints, api_call) => {
  try {
    await configurationModel.findOneAndUpdate({
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
    console.error("error:", error);
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
    console.error("error:", error);
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

// add action  or update the previous action in bridge

const addActionInBridge = async (bridgeId,actionId,actionJson)=>
{
  try {
    const bridges = await configurationModel.findOneAndUpdate({_id:bridgeId },{
      $set : {
       [ `actions.${actionId}`] :  actionJson
      }
    },{new : true })
    return bridges 
    
  } catch (error) {
     throw new Error(error?.message)
  }
}

// remove action from bridge 

const removeActionInBridge = async (bridgeId , actionId )=>
{
  try {
    const bridges = await configurationModel.findOneAndUpdate({_id:bridgeId },{
      $unset : {
       [`actions.${actionId}`] :  ""
      }
    },{new : true })
    return bridges 
    
  } catch (error) {
    console.log(error)
     throw new Error(error?.message)
  }
}

// get bridge with slugname

const getBridgeIdBySlugname = async (orgId, slugName) => {
  try {
    const bridges = await configurationModel.findOne({
      slugName: slugName,
      org_id: orgId
    }).select({ _id: 1, slugName: 1 })
    return {
      success: true,
      bridgeId: bridges._id
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
}
const getBridgeBySlugname = async (orgId, slugName) => {
  try {
    const bridges = await configurationModel.findOne({
      slugName: slugName,
      org_id: orgId
    }).populate('responseRef').lean();
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
  deleteBridge,
  updateToolsCalls,
  getApiCallById,
  getBridgesWithSelectedData,
  addResponseIdinBridge,
  removeResponseIdinBridge,
  getBridgeBySlugname,
  findChatbotOfBridge,
  updateBridgeType,
  getBridgeIdBySlugname,
  getBridgesBySlugNameAndName,
  addActionInBridge,
  removeActionInBridge
};
