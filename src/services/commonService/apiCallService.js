import apiCallModel from "../../mongoModel/apiCall.js";
import common from "../../services/commonService/configServices.js";
const createsApi = async (req, res) => {
  try {
    const {
      id,
      payload,
      url,
      status,
      org_id,
      name = ""
    } = req.body;
    let desc = req.body.desc;
    const {
      bridge_id
    } = req.params;
    const endpoint = id;
    if (!desc || !id || !status || !bridge_id || !org_id) {
      return res.status(400).json({
        error: "Required details must not be empty!!",
        success: false
      });
    }
    desc = " functionName: (" + name +")" + desc;
    let axiosCode = "";
    if (status === "published" || status === "updated") {
      const body = payload?.body;
      let requiredParams = [];
      if (body) {
        const traversedBody = traverseBody(body)
        requiredParams = traversedBody?.requiredParams
        axiosCode = `async (params) => {const axios = require('axios'); try{
            let data=${JSON.stringify(body)};
            const paths=${JSON.stringify(traversedBody?.paths)};
            paths.forEach((path)=>{
                    const keys=path.split(".");
                    _.set(data,path,params[keys[keys.length-1]]);
            });
            const response = await axios({url:'${url}',method:'post',data:data,  headers: {'content-type': 'application/json' } }); return response;}catch(error){return error.response;}}`;
      }
      else {
        axiosCode = `async (params) => {const axios = require('axios');try{const response = await axios({url:'${url}',method:'get', headers: {'content-type': 'application/json' } }); return response;}catch(error){return error.response;}}`;
      }
      const apiId = await getApiId(org_id, bridge_id, endpoint);
      const response = await saveAPI(desc, url, org_id, bridge_id, apiId, "An API", axiosCode, requiredParams, id, [], true,name);
      if (!response.success) {
        return res.status(400).json({
          message: "something went wrong!",
          success: false,
          response
        });
      }
      const apiObjectID = response.apiObjectID;
      const openApiFormat = createOpenAPI(endpoint, desc, requiredParams);
      const result = await common.getAndUpdate(apiObjectID, bridge_id, org_id, openApiFormat.format, endpoint, requiredParams);
      if (result.success) {
        return res.status(200).json({
          message: "API saved successfully",
          success: true,
          activated: true,
          tools_call: result.tools_call
        });
      }
      return res.status(400).json(result);
    }
    else if(status==="delete" || status==="paused"){
      const result=await deleteApi(endpoint,org_id,bridge_id);
      if (result.success) {
        return res.status(200).json({
          message: "API deleted successfully",
          success: true,
          deleted: true,
          tools_call: result.tools_call
        });
      }
      return res.status(400).json(result);
    }
    return res.status(400).json({
      message: "Something went wrong!",
      success: false
    });
  } catch (error) {
    console.error("error in viasocket embed get api=>", error);
    return res.status(400).json({
      error: error,
      success: false
    });
  }
};
const saveAPI = async (apiDesc, curl, org_id, bridge_id, api_id, short_description = "An API", axios = "", required_fields = null, endpoint = "", optional_fields = [], activated = false,name = name) => {
  try {
    if (api_id) {
      const apiData = await apiCallModel.findById(api_id);
      // const old_endpoint=api.endpoint
      apiData.api_description = apiDesc;
      apiData.curl = curl;
      apiData.axios = axios;
      apiData.required_fields = required_fields;
      apiData.short_description = short_description;
      apiData.endpoint = endpoint;
      apiData.optional_fields = optional_fields;
      apiData.activated = activated;
      apiData.name = name;

      //saving updated fields in the db with same id
      const savedApi = await apiData.save();
      return {
        success: true,
        apiObjectID: api_id,
        required_fields: savedApi.required_fields,
        optional_fields: savedApi.optional_fields
      };
    }
    const apiData = {
      api_description: apiDesc,
      curl: curl,
      org_id: org_id,
      bridge_id: bridge_id,
      required_fields,
      activated,
      endpoint,
      axios
    };
    const newApi = await new apiCallModel(apiData).save();
    //saving newly created  fields in the db with same id
    return {
      success: true,
      apiObjectID: newApi.id
    };
  } catch (error) {
    console.error("error:", error);
    return {
      success: false,
      error: error
    };
  }
};
const createOpenAPI = (endpoint, desc, required_fields = []) => {
  try {
    let format = {
      "type": "function",
      "function": {
        "name": endpoint,
        "description": desc
      }
    };
    let parameters = {
      "type": "object",
      "properties": {
        // "location": {
        //     "type": "string",
        //     "description": "The city and state, e.g. San Francisco, CA",
        // },
        // "format": {
        //     "type": "string",
        //     "enum": ["celsius", "fahrenheit"],
        //     "description": "The temperature unit to use. Infer this from the users location.",
        // },
      },
      "required": required_fields,
    };
    let properties = {}
    for (const field of required_fields) {
      properties[field] = { "type": "string" }
    }
    if (required_fields.length > 0) {
      format.function["parameters"] = parameters;
      format.function.parameters.properties = properties;
    }
    return { success: true, format };
  } catch (error) {
    return { success: false, error: error };
  }

}
const deleteApi = async (endpoint, org_id, bridge_id) => {
  try {
    //delete by endpoint
    await apiCallModel.findOneAndDelete({ org_id, bridge_id, endpoint });
    const result = await common.getAndUpdate("", bridge_id, org_id, "", endpoint, {},"delete");
   return result
  } catch (error) {
    console.error("Delete API error=>",error);
    return { success: false, error: error };
  }
}


const getApiId=async(org_id,bridge_id,endpoint)=>{
  try {
    const apiCallData=await apiCallModel.findOne({org_id,bridge_id,endpoint});
    const apiId = apiCallData ? apiCallData.id : "";
    return apiId;
  } catch (error) {
    console.error("error:", error);
    return "";
  }
}
const traverseBody = (body, requiredParams = [],path="",paths=[]) => {
  for (const key in body) {
      if (typeof body[key] === 'object') {
          path=path+key+"."
          traverseBody(body[key], requiredParams,path,paths);
      } else if (body[key] === "your_value_here") {
        paths.push(path+key)
        requiredParams.push(key); // [?] it can repeat
      }
  }
  return {requiredParams,paths};
};
export default {
  createsApi
};