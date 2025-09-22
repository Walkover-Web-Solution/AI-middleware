async function sendResponse(response_format, data, success = false, variables = {}) {
    const data_to_send = {
        [success ? 'response' : 'error']: data,
        'success': success?true:false
    };

    switch (response_format.type) {
        case 'RTLayer':
            return await sendMessage(response_format.cred, data_to_send);
        case 'webhook':
            data_to_send.variables = variables;
            return await sendRequest(
                response_format.cred.url,
                data_to_send,
                'POST',
                response_format.cred.headers || { 'Content-Type': 'application/json' }
            );
    }
}
  
async function sendMessage(cred, data) {
    //send message to rtlayer
    try {
        const response = await fetch(`https://api.rtlayer.com/message?apiKey=${cred.apikey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...cred,
            message: JSON.stringify(data)
        })
        });
        return response;
    } catch (error) {
        throw new Error(`send message error=>, ${error.toString()}`);
    }
}

async function sendRequest(url, data, method, headers) {
    //send message to webhook
    try {
        const response = await fetch(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(data)
        });
        return response.json();
    } catch (error) {
        throw new Error(`Unexpected error: ${url}, ${error.toString()}`);
        return { error: 'Unexpected error', details: error.toString() };
    }
}

export {
    sendResponse
}