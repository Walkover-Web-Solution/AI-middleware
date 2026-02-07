import jwt from "jsonwebtoken";

export const genrateToken = async (orgId) => {
  const token = await jwt.sign(
    { org_id: process.env.RAG_EMBED_ORG_ID, project_id: process.env.RAG_EMBED_PROJECT_ID, user_id: orgId },
    process.env.RAG_EMBED_SECRET_KEY
  );
  return token;
};
