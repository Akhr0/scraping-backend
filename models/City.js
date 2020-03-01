const mongoose = require("mongoose");

const City = mongoose.model("City", {
  name: {
    type: String,
    required: true,
    unique: true
  },
  location: String
});

module.exports = City;
