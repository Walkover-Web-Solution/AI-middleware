import ConfigurationServices from '../db_services/ConfigurationServices.js';
import configurationModel from '../mongoModel/configuration.js';
import { generateIdentifier } from '../services/utils/utilityService.js';
import _ from "lodash";


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
    let id = ''
    try {
        let allConfig = await ConfigurationServices.getAllBridgesWithoutOrg();
        let failed = [];
        let successfulUpdates = [];

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
        try {
            for (let coo of allConfig) {
                // Create a shallow copy of the object
                let configCopy = _.cloneDeep(coo._doc);
                id = configCopy._id
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
                    'response_format': 'response_type',
                    "max_tokens": "max_output_tokens",
                    "topP": 'probability_cutoff',
                    "maxOutputTokens": "max_output_tokens",
                };
                // Ensure the configuration object exists
                if (configCopy?.configuration && typeof configCopy.configuration === 'object' && configCopy.configuration != null) {

                    // Rename keys in configuration based on configConstant
                    for (let oldKey in configConstant) {
                        if (configCopy.configuration.hasOwnProperty(oldKey)) {
                            let newKey = configConstant[oldKey];
                            configCopy.configuration[newKey] = configCopy.configuration[oldKey];
                            delete configCopy.configuration[oldKey];
                        }
                    }

                    configCopy.configuration['response_type'] = configCopy?.configuration?.response_type?.type === 'json' ? {"type": "json"} : {"type": "text"};

                    // Add response_format
                    configCopy.configuration['response_format'] = {
                        type: configCopy?.configuration?.RTLayer ? 'RTLayer' : 
                              configCopy?.configuration?.webhook ? 'webhook' : 
                              'default'
                    };
                    configCopy.configuration['response_format']['cred'] = {};

                    if (configCopy.configuration['response_format']['type'] === 'webhook') {
                        configCopy.configuration['response_format']['cred'] = {
                            url: configCopy?.configuration?.webhook,
                            headers: configCopy?.configuration?.headers || [],
                        };
                    }
                    configCopy.configuration.prompt = configCopy?.configuration?.prompt?.[0]?.content || ''

                }
                try {
                    if (configCopy.configuration['tools'])
                        configCopy.configuration['tools'] = transformTools(configCopy.configuration['tools']);
                    if (configCopy.configuration['tools_call'])
                        delete configCopy.configuration['tools_call']

                }
                catch (e) {
                    console.log(e)
                    failed.push({ [configCopy._id]: 'toolcall' });
                }


                // Remove unnecessary properties
                delete configCopy?.configuration?.webhook;
                delete configCopy?.configuration?.headers;
                delete configCopy?.configuration?.RTLayer;
                delete configCopy?.configuration?.name;
                delete configCopy?.configuration?.slugName;
                if (!configCopy?.bridgeType) configCopy.bridgeType = 'api'
                try {
                    let dbquery = {
                        replaceOne: {
                            filter: { _id: configCopy._id },
                            replacement: configCopy,
                            upsert: true
                        }
                    };
                    await configurationModel.bulkWrite([dbquery]);
                    successfulUpdates.push(configCopy._id);
                } catch (error) {
                    console.log(`Failed to update configuration with ID: ${configCopy._id}`, error);
                    failed.push({[configCopy._id]:"dbfail"});
                }
            }
        } catch (e) {
            failed.push(id);
            console.log(e)
        }
        // const final = await configurationModel.bulkWrite(bulkUpdateData);
        const final = {
            successfulUpdates,
            failedUpdates: failed
        }
        return res.send(final);
    } catch (error) {
        console.log(123, id, 123)
        next(error);
    }
};




export {
    importPostmanCollection,
    configDB
};