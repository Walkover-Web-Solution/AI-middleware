import Joi from "joi";
import joiObjectId from 'joi-objectid';

Joi.objectId = joiObjectId(Joi);

const updateMessageSchema = Joi.object({
    bridge_id: Joi.objectId().required(),
    message: Joi.string().required(),
    id: Joi.number().required(),
    org_id: Joi.number().required()
});

export {
    updateMessageSchema
}
