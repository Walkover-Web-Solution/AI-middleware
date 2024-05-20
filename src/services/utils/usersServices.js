import jwt from 'jsonwebtoken';

const generateToken = (tokenInfo) => {
  const token = jwt.sign(
    { ...tokenInfo },
    process.env.CHATBOTSECRETKEY,
    { expiresIn: '48h' },
  );

  return token;
};

const getToken = (data) => {
  const token = jwt.sign(
    { ...data },
    process.env.CHATBOTSECRETKEY,
    { expiresIn: '48h' },
  );

  return token;
};

export {
  generateToken, getToken,
};
