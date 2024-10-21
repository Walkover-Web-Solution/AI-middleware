const statusMiddleware = (req, res, statusCode = 200) => {
  const responseData = req.body.result;

  if (responseData && statusCode) {
        return res.status(statusCode).json(responseData);
  }
};

export {statusMiddleware};