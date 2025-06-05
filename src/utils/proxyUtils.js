import axios from 'axios';

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

export {
    getallOrgs
}