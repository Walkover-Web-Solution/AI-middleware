import jwt from 'jsonwebtoken';

const generateToken = (tokenInfo) => {
  const token = jwt.sign(
    { ...tokenInfo },
    process.env.CHATBOTSECRETKEY,
    { expiresIn: '48h' },
  );

  return token;
};

const getToken = (data, expire, isPublic) => {
  let token ;
  if(expire?.exp&&expire?.iat){
    token = jwt.sign(
      { ...expire,...data },
      isPublic ? process.env.PUBLIC_CHATBOT_TOKEN : process.env.CHATBOTSECRETKEY,
      
    );
  }else{
    token = jwt.sign(
      { ...data },
      isPublic ? process.env.PUBLIC_CHATBOT_TOKEN : process.env.CHATBOTSECRETKEY,
      { expiresIn: '48h' }
    );
  }

  return token;
};

export {
  generateToken, getToken,
};
