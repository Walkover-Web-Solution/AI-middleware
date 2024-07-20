import { chats } from "./chat.js";
import _ from 'lodash';
import configurationService from "../../db_services/ConfigurationServices.js";
import { ResponseSender } from "../utils/customRes.js";
const responseSender = new ResponseSender();
import { callDBdash } from "../../db_services/dbdash.js";
import {runCode} from "../utils/runCode.cjs";

const functionCall= async (data)=>{
    try {
        let { configuration, apikey, bridge, tools_call, outputConfig, l=0, rtlLayer=false, body={}, playground=false, tools={},webhook,headers} = data;
        const apiEndpoints=new Set(bridge.api_endpoints);
        const apiName = tools_call?.function?.name;
        const apiInfo = bridge?.api_call[apiName];
        if(!playground){
        responseSender.sendResponse({
            rtlLayer : rtlLayer,
            webhook : webhook,
            data: { function_call: true, success: true, name: apiInfo},
            reqBody: body,
            headers: headers || {}
          });
        }

        // add here also
        //("apiEndpoints",apiEndpoints,"bridge",bridge.api_endpoints);
        if(apiEndpoints.has(apiName)){
            const axios=await fetchAxios(apiInfo);
            const args = JSON.parse(tools_call.function.arguments ||"{}");
            const apiResponse=await axiosWork(args,axios,data.variables,data.bridge_id);

            const funcResponseData={
                tool_call_id: tools_call.id,
                role: "tool",
                name: apiName,
                content: JSON.stringify(apiResponse),
            }
            tools[apiName]=JSON.stringify(apiResponse);
            configuration["messages"].push({ role: "assistant", content: null, tool_calls: [tools_call] })
            configuration["messages"].push(funcResponseData);
            //rtlayer going to gpt
            if(!playground){
              responseSender.sendResponse({
                rtlLayer,
                data: { function_call: false, success: true, message: "Going to GPT" },
                reqBody: body,
                headers: {}
              });
              
            }
            
            let openAIResponse=await chats(configuration,apikey);
            const modelResponse = _.get(openAIResponse, "modelResponse", {});
            openAIResponse["tools"]=tools;
            //("modelResponse",modelResponse);
            if(!openAIResponse?.success){
                //("openAIResponse errror",openAIResponse);
                return {success:false,error:openAIResponse?.error}
            }
            if(_.get(modelResponse, outputConfig.tools) && l<=3){
                //("l",l);
                if(!playground){
                      responseSender.sendResponse({
                        rtlLayer,
                        data: { function_call: true, success: true, message: "sending the next fuction call" },
                        reqBody: body,
                        headers: {}
                      });
                }

                data.l=data.l+1;
                data.tools_call= _.get(modelResponse, outputConfig.tools)[0];
                data.tools=tools;
                return await functionCall(data);
            }
            //(openAIResponse);
            return openAIResponse;
        }
        return {success:false,error:"endpoint does not exist"}

    } catch (error) {
        console.error("function call error:",error);
        return {success:false,error:error.message}
    }
}

const fetchAxios=async (apiInfo)=>{
    const apiCall=await configurationService.getApiCallById(apiInfo.apiObjectID);
    return apiCall.apiCall.axios
}

const axiosWork = async (data, axiosFunction,variable={},bridge_id="") => {
    // Dynamically create a function using new Function()
    const config = await callDBdash();
    if(bridge_id in config){
        config[bridge_id].forEach(args=>{data[args]=variable[args]})
    }
    const response = await runCode(axiosFunction, data)
    try {
        return response?.data
    } catch (err) {
        console.error("error", err.message);
        return { success: false };
    }
};

// const checkFields = async ()=>{
//     const parseResponse = response;
// 	const values = parseResponse.function_call.arguments;
// 	// const required_fields = parseResponse.act.required_parameters;
// 	let notPresent = [];
// 	for (let i = 0; i < required_fields.length; i++) {
// 		if (
// 			!values.hasOwnProperty(required_fields[i]) ||
// 			(values.hasOwnProperty(required_fields[i]) &&
// 				values[required_fields[i]] == "")
// 		) {
// 			notPresent.push(required_fields[i]);
// 		}
// 	}
// 	return notPresent;
// } 
export default functionCall;