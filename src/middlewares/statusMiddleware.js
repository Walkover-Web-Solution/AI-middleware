const statusMiddleware = (req, res, statusCode = 200) => {
  const responseData = req.body.result;

  if (!responseData) {
    return res.status(404).json({
      success: false,
      message: "No data found",
    });
  }

  if (responseData && statusCode) {
        return res.status(statusCode).json(responseData);
  } else {
    console.log(`Missing status code for path: ${req.path}`, responseData);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export {statusMiddleware};