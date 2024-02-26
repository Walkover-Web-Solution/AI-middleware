const { createConnection} = require('mysql2');

const executeQueryMySql = (dbCredentials, query) => {
  return new Promise((resolve, reject) => {
      const client = createConnection(dbCredentials);

      client.connect((err) => {
          if (err) {
              console.error("Connection not Created::", err);
              const statusCode = err.code === 'ER_ACCESS_DENIED_ERROR' ? 401 : 403
              reject({statusCode, ...err});
          } else {
              console.log("Connected");
              client.query(query, (err, result) => {
                  if (err) {
                      console.err(89, err);
                      reject(err);
                  } else {
                      resolve(result);
                  }
              });

              client.end((err) => {
                  if (err) {
                      console.err("Connection not closed yet", err);
                      reject(err);
                  } else {
                      console.log('Connection closed');
                  }
              });
          }
      });
  });
};

module.exports={
    executeQueryMySql
}
