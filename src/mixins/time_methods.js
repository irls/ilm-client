export default {
  data() {
    return {
      monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun",  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    }
  },
  methods: {
    convertTime(dt, time = false) {

      let date = new Date(dt);
      let toutc = date.toUTCString();
      let locdate = new Date(toutc + " UTC");

      let year = locdate.getFullYear(),
      month = locdate.getMonth() + 1, // months are zero indexed
      day = locdate.getDate(),
      hour = locdate.getHours(),
      minute = locdate.getMinutes(),
      second = locdate.getSeconds(),
      hourFormatted = hour < 10 ? `0${hour}` : hour, // hour returned in 24 hour format
      minuteFormatted = minute < 10 ? "0" + minute : minute

      //console.log(toutc, locdate);
      let result = day + " " + this.monthNames[month - 1] + " " + year ;
      if (time) {
        result += " " + hourFormatted + ":" + minuteFormatted;
      }
      return result;

    }
  }
}