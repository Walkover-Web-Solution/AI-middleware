const {chats}= require("./chat");
const _ = require('lodash');
const configurationService= require("../../db_services/ConfigurationServices");
// const ModelsConfig = require("../../configs/modelConfiguration");
const functionCall= async (configuration,apikey,bridge,tools_call,outputConfig,l=0)=>{
    try {
        console.log("tools_call=>",tools_call);
        
        const apiEndpoints=new Set(bridge.api_endpoints);
        const apiName = tools_call?.function?.name;
        console.log("apiName",apiName);
        console.log("apiEndpoints",apiEndpoints,"bridge",bridge.api_endpoints);
        if(apiEndpoints.has(apiName)){
            const apiInfo = bridge?.api_call[apiName];
            const axios=await fetchAxios(apiInfo);
            const arguments = JSON.parse(tools_call.function.arguments);
            console.log("arguments",arguments);
            const apiResponse=await axiosWork(arguments,axios);

            const funcResponseData={
                tool_call_id: tools_call.id,
                role: "tool",
                name: apiName,
                content: JSON.stringify(apiResponse),
            }
            configuration["messages"].push({ role: "assistant", content: null, tool_calls: [tools_call] })
            configuration["messages"].push(funcResponseData);
            console.log("configuration",configuration);
            console.log(configuration.messages);
            const openAIResponse=await chats(configuration,apikey);
            const modelResponse = _.get(openAIResponse, "modelResponse", {});
            console.log("modelResponse",modelResponse);
            if(!openAIResponse?.success){
                console.log("openAIResponse errror",openAIResponse);
                return {success:false,error:openAIResponse?.error}
            }
            if(!_.get(modelResponse, outputConfig.message) && l<=3){
                console.log("l",l);
                return await functionCall(configuration,apikey,bridge,_.get(modelResponse, outputConfig.tools)[0],outputConfig,l+1);
            }
            console.log(openAIResponse);
            return openAIResponse;
        }
        return {success:false,error:"endpoint does not exist"}


    } catch (error) {
        console.log("function call error:",error);
        return {success:false,error:error.message}
    }
}



const fetchAxios=async (apiInfo)=>{
    const apiCall=await configurationService.getApiCallById(apiInfo.apiObjectID);
    return apiCall.apiCall.axios
}

const axiosWork = async (data, axiosFunction) => {
	const axios = axiosFunction;
	let axiosCall = "";
	//converting to code
	axiosCall = eval(axios);

	let responseAxios = "";
	try {
		responseAxios = await axiosCall(data);
		console.log("response of axios" + responseAxios.data);
	} catch (err) {
		console.error("error" + err);
        return {success:false};
	}
	return responseAxios?.data;
};

const checkFields = async ()=>{
    const parseResponse = response;
	const values = parseResponse.function_call.arguments;
	// const required_fields = parseResponse.act.required_parameters;
	let notPresent = [];
	for (let i = 0; i < required_fields.length; i++) {
		if (
			!values.hasOwnProperty(required_fields[i]) ||
			(values.hasOwnProperty(required_fields[i]) &&
				values[required_fields[i]] == "")
		) {
			notPresent.push(required_fields[i]);
		}
	}
	return notPresent;
} 
module.exports={functionCall}