const mongoose = require("mongoose");

const Restaurant = mongoose.model("Restaurant", {
  name: {
    type: String,
    required: true
  },
  adress: {
    type: String
  },
  location: {
    lng: String,
    lat: String
  },
  phone: String,
  thumbnail: String,
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City"
  }
});

module.exports = Restaurant;
