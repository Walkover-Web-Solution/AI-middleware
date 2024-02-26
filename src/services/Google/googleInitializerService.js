const {
    GoogleGenerativeAI
  } = require("@google/generative-ai");


  class googleInitializer {
    constructor(api_key) {
      this.genAI = new GoogleGenerativeAI(api_key);
    }
    getGenerativeModel=()=> {
      return this.genAI
    }
  }
  
  module.exports = googleInitializer;