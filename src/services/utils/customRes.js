import { sendRequest } from "./request.js";
import RTLayer from 'rtlayer-node';

class ResponseSender {
  constructor(auth) {
    this.rtlayer = new RTLayer.default(auth);
  }

  async sendResponse(method, data, reqBody, headers) {
    switch (method) {
      case 'webhook':
        await sendRequest(reqBody.configuration?.webhook, 
        { ...reqBody, ...data }, 
        'POST', 
        headers);
        break;
      case 'rtlayer':
        await this.rtlayer.message(
          { ...reqBody, ...data },
          {}
        );
        break;
      default:
        throw new Error('Invalid method');
    }
  }
}

export { 
    ResponseSender
}