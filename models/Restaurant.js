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
  type: String,
  category: Number,
  rating: Number,
  vegan: Number,
  vegOnly: Number,
  link: String,
  description: String,
  pictures: Array,
  price: String,
  website: String,
  facebook: String,
  nearbyPlacesIds: Array,
  placeId: String,
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City"
  }
});

module.exports = Restaurant;
