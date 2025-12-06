import jwt from 'jsonwebtoken';

const generateToken = (tokenInfo) => {
  const token = jwt.sign(
    { ...tokenInfo },
    process.env.CHATBOTSECRETKEY,
    { expiresIn: '48h' },
  );

  return token;
};

export {
  generateToken,
};
