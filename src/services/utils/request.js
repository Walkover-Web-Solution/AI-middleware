const axios = require('axios')

const sendRequest =async (url, data,method,header)=>{
    try {
    const options={url:url,data:data,method:method,header:header}
    console.log("send request=>",options);
    const response=await axios(options);
    console.log("api response call: ",response.data);
    return response
} catch (error) {
        console.log("sendRequest error=>",error);
        return
}
}

module.exports={sendRequest}