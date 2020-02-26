const express = require("express");
const app = express();
const cors = require("cors");
const formidableMiddleware = require("express-formidable");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const City = require("./models/City");
const Restaurant = require("./models/Restaurant");

app.use(formidableMiddleware());
app.use(cors());
require("dotenv").config();

let URL = "https://www.happycow.net/searchmap?s=3&location=";

const fetchCitySearchData = async (link, city, proxy) => {
  console.log("Proxy utilisé = " + proxy);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    args: ["--proxy-server=" + proxy]
  });

  // Launch a page
  const page = await browser.newPage();

  // Go tu URL and wait it's loaded
  await page.goto(link + city, { waitUntil: "networkidle2" });

  // Number of total pages for this city
  const numbPages = await page.evaluate(() => {
    return Math.ceil(
      Number(document.querySelector(".total-results").textContent) / 81
    );
  });
  console.log("Number of pages : " + numbPages);
  const fullList = [];

  for (let i = 1; i <= numbPages; i++) {
    // Define URL for this page
    const URL = link + city + "&page=" + i;

    // Launch page i
    const pageI = await browser.newPage();
    console.log("Page : " + i + " loading ...");

    // Go tu URL and wait it's loaded
    await pageI.goto(URL, { waitUntil: "networkidle2" });
    console.log("Page : " + i + " loaded !");

    // Fetch restaurants of this page
    const restaurants = await pageI.evaluate(() => {
      const listObj = [
        ...document.querySelectorAll("#searchmap_venue_layout > .venues__item")
      ];
      console.log(listObj.length + " éléments trouvés.");

      return listObj.map(elem => {
        return {
          placeId: elem
            .querySelector(".thumbnail__link")
            .getAttribute("href")
            .split("-")
            .reverse()[0],
          name: elem.querySelector(".details__title").textContent.trim(),
          adress:
            elem.querySelector(".venue__location__desc") &&
            elem.querySelector(".venue__location__desc").textContent,
          location: {
            lng:
              elem.querySelector(".thumbnail__details") &&
              elem
                .querySelector(".thumbnail__details")
                .getAttribute("data-lng"),
            lat:
              elem.querySelector(".thumbnail__details") &&
              elem.querySelector(".thumbnail__details").getAttribute("data-lat")
          },
          phone:
            elem.querySelector(".thumbnail__details") &&
            elem
              .querySelector(".thumbnail__details")
              .getAttribute("data-phone"),
          thumbnail:
            elem.querySelector(".venue__img") &&
            elem.querySelector(".venue__img").getAttribute("data-src"),
          type: elem.querySelector(".label").textContent,
          category: Number(
            elem
              .querySelector(".thumbnail__details")
              .getAttribute("data-category")
          ),
          rating:
            elem.querySelectorAll(".venue__rating .fa-star").length +
            elem.querySelectorAll(".venue__rating fa-star-half-o").length / 2
        };
      });
    });

    fullList.push(...restaurants);
    console.log(restaurants.length + " nouveaux éléments ont été ajoutés.");
    console.log("Le premier de ces éléments est : " + restaurants.shift().name);
    console.log("Le dernier de ces éléments est : " + restaurants.pop().name);
    console.log("");
    console.log("#################################");
    console.log("");
  }

  console.log("");
  console.log("Ma liste à pusher en BDD est désormais complète ");
  console.log(
    "Elle possède " + fullList.length + " éléments pour la ville de " + city
  );

  await browser.close();
  return fullList;
};

app.post("/add", async (req, res) => {
  try {
    // Destructuring
    const city = req.fields.city;
    const proxy = req.fields.proxy;
    const username = req.fields.username;
    const password = req.fields.password;
    const bdd = req.fields.bdd;

    const uri =
      "mongodb+srv://" +
      username +
      ":" +
      password +
      bdd +
      ".gcp.mongodb.net/test?retryWrites=true&w=majority";

    let message =
      "Tous les restaurants de " +
      city +
      " ont bien été ajoutés à la BDD " +
      bdd;

    mongoose.connect(uri || "mongodb://localhost/scraping", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });

    console.log(req.fields.city);
    // Condition no username used
    if (!req.fields.city) {
      return res.json({ message: "Vous devez entrer le nom d'une ville" });
    }

    //Conditions
    const cityChecked = await City.findOne({ name: city });

    // Condition about username and mail. If they don't exist then ...
    if (!cityChecked) {
      // Construct new City
      const newCity = new City({
        name: city,
        country: "On verra plus tard"
      });

      // Push in BDD
      await newCity.save();
      const cityID = newCity.id;

      const restaurants = await fetchCitySearchData(URL, city, proxy);

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
    } else if (cityChecked) {
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
