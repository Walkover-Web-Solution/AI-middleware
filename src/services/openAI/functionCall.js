import { chats } from "./chat.js";
import _ from 'lodash';
import configurationService from "../../db_services/ConfigurationServices.js";
import RTLayer from 'rtlayer-node';
import axios from "axios";

const rtlayer = new RTLayer.default(process.env.RTLAYER_AUTH)
const functionCall= async (configuration,apikey,bridge,tools_call,outputConfig,l=0,rtlLayer=false,body={},playground=false)=>{
    try {
        
        const apiEndpoints=new Set(bridge.api_endpoints);
        const apiName = tools_call?.function?.name;
        //("apiEndpoints",apiEndpoints,"bridge",bridge.api_endpoints);
        if(apiEndpoints.has(apiName)){
            const apiInfo = bridge?.api_call[apiName];
            const axios=await fetchAxios(apiInfo);
            const args = JSON.parse(tools_call.function.arguments ||"{}");
            const apiResponse=await axiosWork(args,axios);

            const funcResponseData={
                tool_call_id: tools_call.id,
                role: "tool",
                name: apiName,
                content: JSON.stringify(apiResponse),
            }
            configuration["messages"].push({ role: "assistant", content: null, tool_calls: [tools_call] })
            configuration["messages"].push(funcResponseData);
            // //("configuration",configuration);
            // //(configuration.messages,": messages","\n tools call:",tools_call);
            //rtlayer going to gpt
            if(rtlLayer && !playground){
            rtlayer.message({
                body,
                message: "Going to GPT",
                function_call:false,
                success: true
            },body.rtlOptions).then((data) => {
                // eslint-disable-next-line no-console
                console.log("RTLayer message sent", data);
            }).catch((error) => {
                console.error("RTLayer message not sent", error);
            });
        }
            const openAIResponse=await chats(configuration,apikey);
            const modelResponse = _.get(openAIResponse, "modelResponse", {});
            //("modelResponse",modelResponse);
            if(!openAIResponse?.success){
                //("openAIResponse errror",openAIResponse);
                return {success:false,error:openAIResponse?.error}
            }
            if(!_.get(modelResponse, outputConfig.message) && l<=3){
                //("l",l);
                if(rtlLayer && !playground){
                    rtlayer.message({
                        ...body,
                        message: "sending the next fuction call",
                        function_call:true,
                        success: true
                    },body.rtlOptions).then((data) => {
                        // eslint-disable-next-line no-console
                        console.log("RTLayer message sent", data);
                    }).catch((error) => {
                        console.error("RTLayer message not sent", error);
                    });
                }
                return await functionCall(configuration,apikey,bridge,_.get(modelResponse, outputConfig.tools)[0],outputConfig,l+1);
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

const axiosWork = async (data, axiosFunction) => {
    // Dynamically create a function using new Function()
    const createFunction = new Function('axios','data', axiosFunction);
    try {
        const axiosCall =await createFunction(axios,{});
        return axiosCall.data;
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