import jwt from 'jsonwebtoken';

const generateToken = (tokenInfo) => {
  const token = jwt.sign(
    { ...tokenInfo },
    process.env.JWT_TOKEN_SECRET,
    { expiresIn: '48h' },
  );

  return token;
};

const getToken = (data) => {
  const token = jwt.sign(
    { ...data },
    process.env.JWT_TOKEN_SECRET,
    { expiresIn: '48h' },
  );

  return token;
};

export {
  generateToken, getToken,
};
