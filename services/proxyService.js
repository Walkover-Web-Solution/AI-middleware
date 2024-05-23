import axios from 'axios';
import { findInCache, storeInCache } from '../cache_service/index.js';
// import { findInCache, storeInCache } from './cache.js';

export async function getUserOrgMapping(userId, orgId) {
    try {
      if (!userId || !orgId) throw new Error('Sorry, Either the fields are missing or you are not authorized!');
      const cache_key = `userOrgMapping-${userId}-${orgId}`;
      const data = await findInCache(cache_key);
      if (data) return JSON.parse(data);
      const response = await axios.get(
        `${process.env.PROXY_BASE_URL}/${process.env.PROXY_USER_REFERENCE_ID}/getDetails`,
        {
          params: {
            company_id: orgId,
            user_id: userId,
          },
          headers: {
            'Content-Type': 'application/json',
            Authkey: process.env.PROXY_ADMIN_TOKEN,
          },
        },
      );
      // eslint-disable-next-line no-constant-binary-expression
      const result = (parseInt(response?.data?.data?.totalEntityCount, 10) === 1) ?? false;
      storeInCache(cache_key, result);
      return result;
    } catch (error) {
      console.error('Error fetching data:', error.message);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  export const switchOrganization = async (data, proxyToken) => {
    const organization = await axios.post(`${process.env.PROXY_BASE_URL}/c/switchCompany`, data, {
      headers: {
        Proxy_auth_token: proxyToken,
      },
    });
    return organization;
  };
  