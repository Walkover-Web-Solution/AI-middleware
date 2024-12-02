const responseMiddleware = (req, res, next) => {
  const responseData = res.locals;
  const statusCode = req.statusCode;

  if (!responseData) return next();

  if (responseData && statusCode) {
    const formattedResponse = {
      status: statusCode,
      success: responseData.success || (statusCode === 200),
      message: responseData.message || "Request processed successfully",
      data: responseData.data || {}
    };

    switch (responseData.contentType) {
      case "text/plain":
        return res.status(statusCode).set("Content-Type", "text/plain").send(formattedResponse);

      default:
        return res.status(statusCode).json(formattedResponse);
    }
  }

  return next();
};

export { responseMiddleware };
