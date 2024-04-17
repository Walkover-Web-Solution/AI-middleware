var crypto = require('crypto');
var assert = require('assert');
const ModelsConfig = require("../../configs/modelConfiguration");

class Helper {
    static encrypt(text) {
        const algorithm=process.env.ALGORITHM;

        const iv = crypto
            .createHash('sha512')
            .update(process.env.Secret_IV)
            .digest('hex')
            .substring(0, 16)
        const key = crypto.createHash('sha512').update(process.env.Encreaption_key).digest('hex').substring(0, 32);
        let cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    static decrypt(text) {
        if (!text || text == "") return "";
        const algorithm=process.env.ALGORITHM;
        const iv = crypto
        .createHash('sha512')
        .update(process.env.Secret_IV)
        .digest('hex')
        .substring(0, 16)
        const key = crypto.createHash('sha512').update(process.env.Encreaption_key).digest('hex').substring(0, 32);
        let decipher = crypto.createDecipheriv(algorithm, key, iv);
        let dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    }
    static createCustomModelConfig = (model, configuration) => {
        try {
            const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
            const modelfunc = ModelsConfig[modelname];
            if (!modelfunc) {
                throw new Error(`Model function not found for model: ${modelname}`);
            }
            let modelConfig = modelfunc().configuration;
            for (const key in modelConfig) {
                if (configuration.hasOwnProperty(key)) {
                    modelConfig[key].default = configuration[key];
                }
            }
            let customConfig = modelConfig;
            for (const keys in configuration) {
                if (keys != "name" && keys != "type") {
                    customConfig[keys] = modelConfig[keys] ? customConfig[keys] : configuration[keys];
                }
            }
            return customConfig;
        } catch (error) {
            console.error('Error creating custom model configuration:', error);
        }
    }
}

module.exports = Helper