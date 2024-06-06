
  const responseMiddleware = (req, res, next) => {
    const { responseData } = res.locals;
    if (!responseData) return next();
    if (responseData.data && responseData.statusCode) {
      const formattedResponse = {
        message: responseData.message,
        data: responseData.data,
        isCached: responseData.isCached,
      };
      return res.status(responseData.statusCode).json(formattedResponse);
    }

    // If response data or status code is not set, pass the request to the next middleware
    return next();
  };
  
  export default responseMiddleware;
  