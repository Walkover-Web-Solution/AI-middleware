import axios from "axios";

export const getWidgetInfo = async (helloId) => {
  return await axios
    .post(
      "https://api.phone91.com/widget-info/",
      {
        user_data: {},
        is_anon: false
      },
      {
        headers: {
          authorization: helloId
        }
      }
    )
    .then((response) => response.data);
};

export const getAnonymousClientId = async (helloId) => {
  return await axios
    .post("https://api.phone91.com/anonymous-client-details/", "", {
      headers: {
        authorization: helloId
      }
    })
    .then((response) => response.data.data);
};

export const getSocketJwt = async (helloId, anonymousClientId, isAnonymous) => {
  return await axios
    .get("https://api.phone91.com/jwt-token/", {
      params: {
        is_anon: isAnonymous
      },
      headers: {
        authorization: `${helloId}:${anonymousClientId?.uuid}`
      }
    })
    .then((response) => response.data.data);
};

export const getChannelList = async (helloId, thread_id) => {
  return await axios
    .post(
      "https://api.phone91.com/v2/pubnub-channels/list/",
      {
        unique_id: thread_id,
        user_data: {
          unique_id: thread_id
        },
        is_anon: false
      },
      {
        headers: {
          accept: "application/json",
          authorization: `${helloId}`
        }
      }
    )
    .then((response) => response.data);
};
