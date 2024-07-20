
// check with both older versions of script and new version of script of embed
const runCode = async (code, data) => {
    try {
        const AxiosFunc = await eval(code)
        const response = await AxiosFunc(data)
        return response
    } catch (error) {
        console.log("runCode error=>", error)
        return error.response;
    }

}

module.exports = { runCode };