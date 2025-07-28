import configurationModel from "../mongoModel/configuration.js";
import versionModel from "../mongoModel/bridge_version.js";
import apiCallModel from "../mongoModel/apiCall.js";
import ChatBotModel from "../mongoModel/chatBotModel.js";
import templateModel from "../mongoModel/template.js";
import { ObjectId } from "mongodb";

const updateBridgeArchive = async (bridge_id, status) => {
  try {
    const updatedBridge = await configurationModel.findOneAndUpdate(
      {_id: bridge_id},
      { status: status },
      { new: true }
    );
    if (!updatedBridge) {
      return {
        success: false,
        error: "Bridge not found!",
      };
    }

    return {
      success: true,
      data: updatedBridge,
      message: updatedBridge.status ? "Bridge archived successfully!" : "Bridge unarchived successfully!",
    };
  } catch (error) {
    console.error("Error updating bridge status =>", error);
    return {
      success: false,
      error: "Something went wrong!!",
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

const addActionInBridge = async (bridgeId, actionId, actionJson, version_id) => {
  try {
    const model = version_id ? versionModel : configurationModel;
    const id_to_use = version_id ? version_id : bridgeId;
    
    const bridges = await model.findOneAndUpdate({ _id: id_to_use }, {
      $set: {
        [`actions.${actionId}`]: actionJson,
        is_drafted : true
      }
    }, { new: true }).lean();
    return bridges

  } catch (error) {
    throw new Error(error?.message)
  }
}

// remove action from bridge 

const removeActionInBridge = async (bridgeId, actionId, version_id) => {
  try {
    const model = version_id ? versionModel : configurationModel;
    const id_to_use = version_id ? version_id : bridgeId;
    const bridges = await model.findOneAndUpdate({ _id: id_to_use }, {
      $unset: {
        [`actions.${actionId}`]: "",
        is_drafted : true
      }
    }, { new: true }).lean()
    return bridges

  } catch (error) {
    console.log(error)
    throw new Error(error?.message)
  }
}

// get bridge with slugname

const getBridgeIdBySlugname = async (orgId, slugName) => {
  return await configurationModel.findOne({
    slugName: slugName,
    org_id: orgId
  }).select({ _id: 1, slugName: 1, starterQuestion: 1, IsstarterQuestionEnable: 1 }).lean()
     
}
const getBridgeBySlugname = async (orgId, slugName, versionId) => {
  try {
    const hello_id = await configurationModel.findOne({
      slugName: slugName,
      org_id: orgId,
    }).select({ hello_id: 1, 'configuration.model': 1, service: 1, apikey_object_id: 1 }).lean();

    const modelConfig = await versionModel.findOne({
      _id: new ObjectId(versionId)
    }).select({ 'configuration.model': 1, service: 1 , apikey_object_id: 1 }).lean();

    const model = versionId ?  modelConfig.configuration  : hello_id?.configuration 
    const service = versionId ?  modelConfig.service  : hello_id?.service 
    const apikey_object_id = versionId ?  modelConfig.apikey_object_id  : hello_id?.apikey_object_id 

    if (!hello_id) return false; 

    return {hello_id ,modelConfig:model, apikey_object_id, service};
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
const gettemplateById = async template_id =>{
  try {
    return await templateModel.findById(template_id)
  } catch (error) {
    console.error("template_id error=>",error);
    return null;
  }
}
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
    console.log(error)
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
};

const getBridgeNameById = async (bridge_id, org_id) => {
  try {
    const bridge = await configurationModel.findOne(
      { _id: bridge_id, org_id: org_id },
      { name: 1 }
    ).lean();
    if (!bridge) {
      return "";
    }
    return bridge.name
  } catch (error) {
    console.error("Error fetching bridge name =>", error);
    return ""
  }
};

const getBridgeByUrlSlugname = async (url_slugName) => {
  try {
    const hello_id = await configurationModel.findOne({
      "page_config.url_slugname": url_slugName,
    }).select({ _id: 1, name: 1, service: 1 });

    if (!hello_id) return false;

    return {
      _id: hello_id._id,
      name: hello_id.name,
      service: hello_id.service
    };
  } catch (error) {
    console.log('error:', error);
    return {
      success: false,
      error: 'something went wrong!!',
    };
  }
};


export default {
  deleteBridge,
  getApiCallById,
  getBridgesWithSelectedData,
  addResponseIdinBridge,
  removeResponseIdinBridge,
  getBridgeBySlugname,
  findChatbotOfBridge,
  updateBridgeArchive,
  getBridgeIdBySlugname,
  gettemplateById,
  addActionInBridge,
  removeActionInBridge,
  getBridges,
  getBridgeNameById,
  getBridgeByUrlSlugname
};
