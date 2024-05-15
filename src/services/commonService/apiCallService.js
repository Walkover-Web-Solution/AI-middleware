import { apiCallModel } from "../../../mongoModel/apiCall.js";
import common from "../../services/commonService/configServices.js";
const createsApi = async (req, res) => {
  try {
    const {
      id,
      payload,
      url,
      desc,
      status,
      org_id
    } = req.body;
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
    let axiosCode = "";
    if (status === "published" || status === "updated") {
      const body = payload?.body;
      let requiredParams = [];
      if (body) {
        const keys = Object.keys(body);
        keys.forEach((key, index) => {
          const value = body[key];
          if (value === "your_value_here") {
            requiredParams.push(key);
          }
        });
        const params = requiredParams.join();
        axiosCode = `async (data) => {const axios = require('axios'); const response = await axios({url:'${url}',method:'post',data: data,  headers: {'content-type': 'application/json' } }); return response; }`;
      }
      let apiId = "";
      const apiCallData = await apiCallModel.findOne({
        endpoint: endpoint,
        org_id,
        bridge_id
      });
      apiId = apiCallData ? apiCallData.id : "";
      const response = await saveAPI(desc, url, org_id, bridge_id, apiId, short_description = "An API", axiosCode, requiredParams, id, [], true);
      if (!response.success) {
        return res.status(400).json({
          message: "something went wrong!",
          success: false,
          response
        });
      }
      const apiObjectID = response.apiObjectID;
      const openApiFormat = createOpenAPI(endpoint, desc, requiredParams, []);
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
    return res.status(400).json({
      message: "Api is not published",
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
const saveAPI = async (apiDesc, curl, org_id, bridge_id, api_id, short_description = "An API", axios = "", required_fields = null, endpoint = "", optional_fields = [], activated = false) => {
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
    console.log("error:", error);
    return {
      success: false,
      error: error
    };
  }
};
const createOpenAPI = (endpoint, desc, required_fields = [], optional_fields = []) => {
  try {
    let format = {
      "type": "function",
      "function": {
        "name": endpoint,
        "description": desc,
        "parameters": {
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
          "required": required_fields
        }
      }
    };
    let properties = {};
    for (const field of required_fields) {
      properties[field] = {
        "type": "string"
      };
    }
    format.function.parameters.properties = properties;
    console.log("api call format", format);
    return {
      success: true,
      format
    };
  } catch (error) {
    return {
      success: false,
      error: error
    };
  }
};
export default {
  createsApi
};