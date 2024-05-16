import jwt from 'jsonwebtoken';

const generateToken = (tokenInfo) => {
  const token = jwt.sign(
    { ...tokenInfo },
    process.env.TOKEN_SECRET_KEY,
    { expiresIn: '48h' },
  );

  return token;
};

const getToken = (data) => {
  const token = jwt.sign(
    { ...data },
    process.env.TOKEN_SECRET_KEY,
    { expiresIn: '48h' },
  );

  return token;
};

export {
  generateToken, getToken,
};
