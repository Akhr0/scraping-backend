const express = require("express");
const app = express();
const cors = require("cors");
const formidableMiddleware = require("express-formidable");
const mongoose = require("mongoose");
const City = require("./models/City");
const Restaurant = require("./models/Restaurant");
const fetchCitySearchData = require("./functions/fetchCitySearchData");
const moreDetails = require("./functions/moreDetails");

app.use(formidableMiddleware());
app.use(cors());
require("dotenv").config();

let URL = "https://www.happycow.net/searchmap?s=3&location=";

app.post("/add", async (req, res) => {
  try {
    console.log("ROUTE APPELEE #############################");
    // Destructuring
    const city = req.fields.city;
    const max = Number(req.fields.max);
    const username = req.fields.username;
    const password = req.fields.password;
    const bdd = req.fields.bdd;

    const uri =
      "mongodb+srv://" +
      username +
      ":" +
      password +
      bdd +
      ".gcp.mongodb.net/HappyCow?retryWrites=true&w=majority";

    let message =
      "Les restaurants pour la ville de " +
      city +
      " ont bien été ajoutés à la BDD " +
      bdd;

    mongoose.connect(uri || "mongodb://localhost/scraping", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });

    //Conditions
    const cityChecked = await City.findOne({ name: city });

    // Condition about username and mail. If they don't exist then ...
    if (!cityChecked) {
      // Construct new City
      const newCity = new City({
        name: city,
        location: "Europe"
      });

      // Push in BDD
      await newCity.save();
      const cityID = newCity.id;

      const restaurants = await fetchCitySearchData(
        URL,
        city,
        moreDetails,
        max
      );

      console.log("Push en BDD démarré :");
      console.log("");
      await restaurants.forEach(async resto => {
        try {
          const newRestaurant = new Restaurant({
            name: resto.name,
            adress: resto.adress,
            location: {
              lng: resto.location.lng,
              lat: resto.location.lat
            },
            phone: resto.phone,
            thumbnail: resto.thumbnail,
            type: resto.type,
            category: resto.category,
            rating: resto.rating,
            vegan: resto.vegan,
            vegOnly: resto.vegOnly,
            link: resto.link,
            description: resto.description,
            pictures: resto.pictures,
            price: resto.price,
            website: resto.website,
            facebook: resto.facebook,
            nearbyPlacesIds: resto.nearbyPlacesIds,
            placeId: resto.placeId,
            city: cityID
          });
          // Push in BDD
          await newRestaurant.save();
          // console.log(newRestaurant.name + " vient d'être ajouté");
        } catch (error) {
          message = error.message;
        }
      });
      console.log(message);
      res.json({ message: message });
      // If username already exists
    } else {
      res.json({ message: "Votre BDD contient déjà cette ville" });
    }
  } catch (error) {
    res.json({ message: error.message });
    console.error(error.message);
  }
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
