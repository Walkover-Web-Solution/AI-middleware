import axios from 'axios';
import { generateIdentifier } from '../services/utils/utilityService.js';
import { createOrFindUserAndCompany } from '../services/proxyService.js';

async function getallOrgs() {
    try {
        const response = await axios.get(`https://routes.msg91.com/api/${process.env.PUBLIC_REFERENCEID}/getCompanies?itemsPerPage=17321`, {
            headers: {
                'authkey': process.env.ADMIN_API_KEY
            }
        });
        return response.data
    } catch (error) {
        console.error("Error fetching organizations:", error.message);
        return [];
    }
}

const createOrGetUser = async (checkToken, decodedToken, orgTokenFromDb) => {
    const userDetails = {
        name: generateIdentifier(14, 'emb', false),
        email: `${decodedToken.org_id}${checkToken.user_id}@gtwy.ai`,
        meta: { type: 'embed' },
    };
    const orgDetials = {
        name: orgTokenFromDb?.name,
        is_readable: true,
        meta: {
            status: '2', // here 2 indicates that user is guest in this org and on visiting viasocket normally, this org should not be visible to users whose status is '2' with the org.
        },
    };
    const proxyObject = {
        feature_id: process.env.PROXY_USER_REFERENCE_ID,
        Cuser: userDetails,
        company: orgDetials,
        role_id: 2
    };
    const proxyResponse = await createOrFindUserAndCompany(proxyObject); // proxy api call
    return {proxyResponse, name: userDetails.name, email: userDetails.email}
}

export {
    getallOrgs,
    createOrGetUser
}