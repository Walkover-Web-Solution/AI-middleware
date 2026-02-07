import Joi from "joi";
import joiObjectId from "joi-objectid";

Joi.objectId = joiObjectId(Joi);

const FineTuneSchema = Joi.object({
  bridge_id: Joi.objectId().required(),
  user_feedback: Joi.array()
    .items(Joi.number().valid(0, 1, 2))
    .required(),
});

export { FineTuneSchema };
