const responseMiddleware = (req, res) => {
  const responseData = res.locals;
  const statusCode = req.statusCode || 200;

  if (responseData) {
    if (responseData.contentType === "text/plain") {
      return res.status(statusCode)
        .set("Content-Type", "text/plain")
        .send(responseData.data);
    } else {
      return res.status(statusCode).json(responseData);
    }
  }
};
export {responseMiddleware};