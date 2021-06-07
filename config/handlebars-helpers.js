const moment = require('moment')

module.exports = {
  ifCond: function (a, b, options) {
    if (a === b) {
      return options.fn(this)
    }
    return options.inverse(this)
  },
  dateTimeFromNow: function (a) {
    return moment(a).fromNow()
  }
}
