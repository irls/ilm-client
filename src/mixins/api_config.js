export default {
  data() {
    return {
      API_URL: process.env.ILM_API + '/api/v1/',
      SERVER_URL: process.env.ILM_API
    }
  },
  methods: {
    getAPILink(relative) {
      return `${this.API_URL}${relative}`;
    }
  }
}