import Joi from "joi";

const modelConfigSchema = Joi.object({
    service: Joi.string().required(),
    model_name: Joi.string().required(),
    status: Joi.number().default(1),
    configuration: Joi.object().unknown(true).required(),
    outputConfig: Joi.object().unknown(true).required(),
    validationConfig: Joi.object().unknown(true).required()
});

export { modelConfigSchema };
