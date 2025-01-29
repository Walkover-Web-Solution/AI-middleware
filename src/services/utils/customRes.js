import { sendRequest } from "./request.js";
import RTLayer from 'rtlayer-node';

class ResponseSender {
  constructor() {
    this.rtlayer = new RTLayer.default(process.env.RTLAYER_AUTH);
  }

  async sendResponse({ rtlLayer, webhook, data, reqBody, headers }) {
    const { rtlOptions, ...dataToSend } = reqBody || {};
    if (rtlLayer) {
      await this.rtlayer.message(
        { ...dataToSend, ...data },
        rtlOptions
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
