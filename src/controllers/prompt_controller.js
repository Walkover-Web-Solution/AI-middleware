import common from "../services/commonService/common.js"
import { promptInputValidation } from '../validation/joi_validation/prompt.js';

const promptCompressionUsingGpt = async (req, res) => {
        const { error } = promptInputValidation.validate({user: req.body.user, tokenLimit: req.body.tokenLimit});
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        req.body.bridge_id = '66796eb4091216f40bc4f8c6' // hard coded for now 
        await common.prochat(req, res);
}

export {
    promptCompressionUsingGpt
};