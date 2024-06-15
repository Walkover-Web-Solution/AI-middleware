import jwt from 'jsonwebtoken';

const generateToken = (tokenInfo) => {
  const token = jwt.sign(
    { ...tokenInfo },
    process.env.CHATBOTSECRETKEY,
    { expiresIn: '48h' },
  );

  return token;
};

const getToken = (data, expire) => {
  let token ;
  if(expire?.exp&&expire?.iat){
    token = jwt.sign(
      { ...expire,...data },
      process.env.CHATBOTSECRETKEY,
      
    );
  }else{
    token = jwt.sign(
      { ...data },
      process.env.CHATBOTSECRETKEY,
      { expiresIn: '48h' }
    );
  }

  return token;
};

export {
  generateToken, getToken,
};
