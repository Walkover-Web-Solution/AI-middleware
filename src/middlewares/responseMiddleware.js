const responseMiddleware = (req, res, next) => {
  const responseData = res.locals;
  const statusCode = req.statusCode;

  if (!responseData) return next();

  if (responseData && statusCode) {
    switch (responseData.contentType) {
      case "text/plain":
        return res.status(statusCode).set("Content-Type", "text/plain").send(responseData.data);

      default:
        return res.status(statusCode).json(responseData);
    }
  }

  return next();
};

export { responseMiddleware };
