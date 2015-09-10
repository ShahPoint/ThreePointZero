Date.prototype.toNemsisString = function () {
    var year = this.getFullYear().toString();
    var month = (this.getMonth()).toString();
    month = (month.length == 1 ? "0" : "") + month;
    var day = this.getDate().toString();
    day = (day.length == 1 ? "0" : "") + day;

    var hourUtcOffset = Math.floor(Math.abs(this.getTimezoneOffset()) / 60).toString();
    hourUtcOffset = (hourUtcOffset.length == 1 ? "0" : "") + hourUtcOffset;
    var minuteUtcOffset = (Math.abs(this.getTimezoneOffset()) % 60).toString();
    minuteUtcOffset = (minuteUtcOffset.length == 1 ? "0" : "") + minuteUtcOffset;

    var sign = (this.getTimezoneOffset() > 0 ? "-" : "+");

    var hour = ((this.getHours()) % 12).toString();
    hour = (hour.length == 1 ? "0" : "") + hour;
    var minute = this.getMinutes().toString();
    minute = (minute.length == 1 ? "0" : "") + minute;
    var second = this.getSeconds().toString();
    second = (second.length == 1 ? "0" : "") + second;

    return year + "-" + month + "-" + day + "T" + hour + ":" + minute + ":" + second + sign + hourUtcOffset + ":" + minuteUtcOffset;
}