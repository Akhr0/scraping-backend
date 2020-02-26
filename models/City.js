const mongoose = require("mongoose");

const City = mongoose.model("City", {
  name: {
    type: String,
    required: true,
    unique: true
  },
  country: {
    type: String
  }
});

module.exports = City;
