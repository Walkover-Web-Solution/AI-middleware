import ConfigurationServices from '../db_services/ConfigurationServices.js';
import { generateIdentifier } from '../services/utils/utilityService.js';

const importPostmanCollection = async (req, res, next) => {
    try {
        const fileBuffer = req.file.buffer;
        const fileContent = fileBuffer.toString('utf8');
        let collection;
        let updatedCollection = [];
        try {
            collection = JSON.parse(fileContent);
        }
        catch (err) {
            console.log(err)
            return res.status(400).send('Invalid JSON format');
        }
        collection.item.map((collect) => {
            updatedCollection.push({
                id: generateIdentifier(12),
                ...collect,
            })
        })

        res.locals.responseData = { statusCode: 200, data: updatedCollection, message: 'Successfully update user' };
        next();
    } catch (err) {
        console.log("getall threads=>", err)
        return { success: false, message: err.message, from: "conroller" }
    }
};
const configDB = async (req, res, next) => {
    try {
        let allConfig = await ConfigurationServices.getAllBridgesWithoutOrg();
        let response = [];
        let bulkUpdateData = []

        const transformTools = (tools) => {
            return tools.map(tool => {
                let newTool = {
                    type: tool.type,
                    name: tool.function.name,
                    description: tool.function.description,
                    properties: tool.function.parameters ? tool.function.parameters.properties : {},
                    required: tool.function.parameters ? tool.function.parameters.required : []
                };

                return newTool;
            });
        };
        for (let coo of allConfig) {
            // Create a shallow copy of the object
            let configCopy = { ...coo._doc };

            // Delete the unwanted keys from the copy
            delete configCopy['responseIds'];
            delete configCopy['defaultQuestions'];
            delete configCopy['api_endpoints'];
            delete configCopy['api_call'];
            delete configCopy['responseRef'];
            delete configCopy['is_api_call'];

            const configConstant = {
                'temperature': 'creativity_level',
                'top_p': 'probability_cutoff',
                'frequency_penalty': 'repetition_penalty',
                'presence_penalty': 'novelty_penalty',
                'logprobs': 'log_probability',
                'echo': 'echo_input',
                'input': 'input_text',
                'topK': 'token_selection_limit',
                'n': 'response_count',
                'stopSequences': 'additional_stop_sequences',
                'best_of': 'best_response_count',
                'suffix': 'response_suffix',
                'response_format': 'json_mode',
                "max_tokens": "max_output_tokens",
                "topP": 'probability_cutoff',
                "maxOutputTokens": "max_output_tokens",
            };

            // Ensure the configuration object exists
            if (configCopy.configuration) {

                // Rename keys in configuration based on configConstant
                for (let oldKey in configConstant) {
                    if (configCopy.configuration.hasOwnProperty(oldKey)) {
                        let newKey = configConstant[oldKey];
                        configCopy.configuration[newKey] = configCopy.configuration[oldKey];
                        delete configCopy.configuration[oldKey];
                    }
                }

                configCopy.configuration['json_mode'] = !!(configCopy?.configuration?.json_mode?.type === 'text');

                // Add response_format
                configCopy.configuration['response_format'] = {}
                configCopy.configuration['response_format']['type'] = configCopy?.configuration?.RTLayer ? 'RTLayer' : configCopy?.configuration?.webhook ? 'webhook' : 'default';
                configCopy.configuration['response_format']['cred'] = {};

                if (configCopy.configuration['response_format']['type'] === 'webhook') {
                    configCopy.configuration['response_format']['cred'] = {
                        url: configCopy?.configuration?.webhook,
                        headers: configCopy?.configuration?.headers || [],
                    };
                }
            }
            try {
                if (configCopy.configuration['tools'])
                    configCopy.configuration['tools'] = transformTools(configCopy.configuration['tools']);
                if (configCopy.configuration['tools_call'])
                    delete configCopy.configuration['tools_call']

            }
            catch (e) {
                delete configCopy.configuration['tools']
                print(e)
            }


            // Remove unnecessary properties
            delete configCopy?.configuration?.webhook;
            delete configCopy?.configuration?.headers;
            delete configCopy?.configuration?.RTLayer;
            delete configCopy?.configuration?.name;
            delete configCopy?.configuration?.slugName;
            configCopy.configuration.prompt = configCopy?.configuration?.prompt?.[0]?.content || ''

            const dbquery = {
                updateOne: {
                    filter: { _id: configCopy._id },
                    update: { $set: configCopy }
                }
            }
            bulkUpdateData.push(dbquery)
            response.push(configCopy);
        }
        await ConfigurationServices.bulkUpdate(bulkUpdateData);
        return res.send(response);
    } catch (error) {
        next(error);
    }
};




export {
    importPostmanCollection,
    configDB
};