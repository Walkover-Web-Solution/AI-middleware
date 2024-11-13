import axios from 'axios';

export const getWidgetInfo = async (helloId) => {
  return await axios.post(
    "https://api.phone91.com/widget-info/",
    {
      user_data: {},
      is_anon: false,
    },
    {
      headers: {
        authorization: helloId,
      },
    }
  ).then(response => response.data);
};

export const getAnonymousClientId = async (helloId) => {
  return await axios.post(
    "https://api.phone91.com/anonymous-client-details/",
    "",
    {
      headers: {
        authorization: helloId,
      },
    }
  ).then(response => response.data.data);
};

export const getSocketJwt = async (helloId, anonymousClientId,isAnonymous) => {
  return await axios.get("https://api.phone91.com/jwt-token/", {
    params: {
      is_anon: `${isAnonymous}`,
    },
    headers: {
      authorization: `${helloId}:${anonymousClientId?.uuid}`,
    },
  }).then(response => response.data.data.jwt_token);
};

export const getChannelList = async (helloId, anonymousClientId, isAnonymous) => {
  return await axios.post(
    "https://api.phone91.com/v2/pubnub-channels/list/",
    {
      uuid: anonymousClientId?.uuid,
      anonymous_client_uuid: "",
      user_data: {},
      is_anon: isAnonymous,
    },
    {
      headers: {
        accept: "application/json",
        authorization: `${helloId}:${anonymousClientId?.uuid}`,
      },
    }
  ).then(response => response.data);
}; 


export const getHistory = async (auth, channelId)=>{
    return await axios.post(
        'https://api.phone91.com/get-history/',
        {
          'channel': channelId,
          'origin': 'chat',
          'page_size': 30,
          'start_from': 1,
          'user_data': {},
          'is_anon': false
        },
        {
          headers: {
            authorization: auth,
            'content-type': 'application/json',
          }
        }
      ).then(response => response.data);;
}