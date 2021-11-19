export default {
  data() {
    return {
      
    }
  },
  methods: {
    parseFloatToFixed(value, precision) {
      if (value && value % 1 !== 0) {
        value = parseFloat(parseFloat(value).toFixed(precision));
      }
      return value;
    }
  }
}