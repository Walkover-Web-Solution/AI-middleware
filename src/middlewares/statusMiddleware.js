const statusMiddleware = (req, res) => {
  const responseData = req.body.result;
  const statusCode = req.statusCode || 200;

  if (responseData && statusCode) {
        return res.status(statusCode).json(responseData);
  }
};

export {statusMiddleware};