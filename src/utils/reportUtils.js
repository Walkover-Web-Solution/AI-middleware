import axios from 'axios';
async function getallOrgs() {
    try {
        const response = await axios.get(`https://routes.msg91.com/api/${process.env.PUBLIC_REFERENCEID}/getCompanies?itemsPerPage=17321`, {
            headers: {
                'authkey': process.env.ADMIN_API_KEY
            }
        });
        console.log(response.data);
        if (Array.isArray(response.data.data.data)) {
            const ids = response.data.data.data.map(org => org.id);
            return ids;
        } else {
            throw new Error("Unexpected response format: response.data.data.data is not an array");
        }
    } catch (error) {
        console.error("Error fetching organizations:", error.message);
        return [];
    }
}

export {
    getallOrgs
}