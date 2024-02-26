const axios = require('axios')

const sendRequest =async (url, data,method,header)=>{
    try {
    const options={url:url,data:data,method:method,header:header}
    const response=await axios(options);
    return response
} catch (error) {
        console.log("sendRequest error=>",error);
        return
}
}

module.exports={sendRequest}