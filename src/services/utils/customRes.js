import { sendRequest } from "./request.js";
import RTLayer from 'rtlayer-node';

class ResponseSender {
  constructor() {
    this.rtlayer = new RTLayer.default(process.env.RTLAYER_AUTH);
  }

  async sendResponse({ rtlLayer, webhook, data, reqBody, headers }) {
    if (rtlLayer) {
      await this.rtlayer.message(
        { ...reqBody, ...data },
        {"id":"husain"}
      );
    }
    if (webhook) {
      await sendRequest(webhook, 
        { ...reqBody, ...data }, 
        'POST', 
        headers
      );
    }
    return;
  }
}

export { ResponseSender };
