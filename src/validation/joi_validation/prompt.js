import Joi from 'joi'; // Import Joi

// Define the schema
const promptInputValidation = Joi.object({
    user: Joi.string().required(),
    tokenLimit: Joi.number()
});
export {
    promptInputValidation
}