const validateJsonSchemaConfiguration = (configuration) => {
    if (!configuration || !configuration.response_type) {
        return { isValid: true, errorMessage: null };
    }

    const response_type = configuration.response_type;

    if (!response_type) {
        return { isValid: true, errorMessage: null };
    }

    if (typeof response_type === 'string') {
        return { isValid: true, errorMessage: null };
    }

    if (response_type.type !== 'json_schema') {
        return { isValid: true, errorMessage: null };
    }

    if ('json_schema' in response_type && response_type.json_schema === null) {
        return { isValid: false, errorMessage: "json_schema should be a valid JSON, not None" };
    }

    if ('json_schema' in response_type && response_type.json_schema !== null) {
        try {
            if (typeof response_type.json_schema === 'object') {
                return { isValid: true, errorMessage: null };
            } else if (typeof response_type.json_schema === 'string') {
                JSON.parse(response_type.json_schema);
                return { isValid: true, errorMessage: null };
            } else {
                return { isValid: false, errorMessage: "json_schema should be a valid JSON object or string" };
            }
        } catch (e) {
            return { isValid: false, errorMessage: "json_schema should be a valid JSON" };
        }
    }

    return { isValid: true, errorMessage: null };
};

export {
    validateJsonSchemaConfiguration
};
