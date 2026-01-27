import axios from "axios";
const sendRequest = async (url, data, method, header) => {
  try {
    const options = {
      url: url,
      data: data,
      method: method,
      header: header
    };
    const response = await axios(options);
    return response;
  } catch (error) {
    console.error("sendRequest error=>", error);
    return;
  }
};
export { sendRequest };
