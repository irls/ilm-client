export default {
  data() {
    return {
      monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun",  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    }
  },
  methods: {
    convertTime(dt, time = false) {

      let date = new Date(dt);
      if (isNaN(date.getFullYear())) {
        let checkDate = /(\d+)\D(\d+)\D(\d+)\D+(\d+)\D(\d+)\D(\d+)/.exec(dt);//format DD.MM.yyyy, hh:mm:ss
        if (checkDate && checkDate[0] && checkDate[6]) {//make it yyyy-MM-DDThh:mm:ssZ
          date = new Date(`${checkDate[3]}-${checkDate[2]}-${checkDate[1]}T${checkDate[4]}:${checkDate[5]}:${checkDate[6]}Z`);
        }
      }
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