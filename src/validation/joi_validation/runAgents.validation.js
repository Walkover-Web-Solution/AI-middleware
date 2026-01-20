import Joi from "joi";

const loginPublicUser = {
  body: Joi.object()
    .keys({
      user_id: Joi.string().optional(),
    })
    .unknown(true),
};

const getAgent = {
  params: Joi.object()
    .keys({
      slug_name: Joi.string().required(),
    })
    .unknown(true),
};

export default {
  loginPublicUser,
  getAgent,
};
