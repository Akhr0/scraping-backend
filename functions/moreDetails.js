const puppeteer = require("puppeteer");

// Declaration of a the function which fetches datas from the Big Page of each restaurant \\\ New Puppetter
const moreDetails = async link => {
  // Launch Puppeteer
  const browserBis = await puppeteer.launch();

  // Launch a page
  const pageBis = await browserBis.newPage();

  // Go tu URL and wait it's loaded
  await pageBis.goto(link, { waitUntil: "networkidle2" });

  const details = await pageBis.evaluate(() => {
    // Creation of all variables
    let price;
    let carousel;
    let picturesArr;
    let listPlaces;
    let nearbyPlacesIds;
    const description =
      document.querySelector(".venue__description") &&
      document
        .querySelector(".venue__description p")
        .firstChild.textContent.trim()
        .replace("             ", " ");

    const priceLast =
      document.querySelector(".label__list__body") &&
      [...document.querySelectorAll(".label__list__body .price--fill")].pop();

    const facebook = document.querySelector(
      ".label__list__body .facebook--blue--def--color"
    )
      ? document
          .querySelector(".label__list__body .facebook--blue--def--color")
          .getAttribute("href")
      : "";

    const website = document.querySelector(".label__list__body .url")
      ? document.querySelector(".label__list__body .url").getAttribute("href")
      : "";

    // If priceLast exist then price get title attribut, else price is null
    price = priceLast ? priceLast.getAttribute("title") : null;

    // If carousel exists then assign nodes'array, else assign empty array
    document.querySelector(".carousel-inner .venue--image")
      ? (carousel = [
          ...document.querySelectorAll(
            ".carousel-inner .panel__figure a:not(.btn__more)"
          )
        ])
      : (carousel = []);

    // If carousel as some element then map on it to push images in picturesArr, else pitcturesArr is an empty array
    if (carousel.length) {
      picturesArr = carousel.map(pic => {
        if (pic.getAttribute("href").slice(-4) === "jpeg") {
          return pic.getAttribute("href");
        }
      });
    } else {
      picturesArr = [];
    }

    // If list exists then assign nodes'array, else assign empty array
    document.querySelector(".list__with__bg__item")
      ? (listPlaces = [
          ...document.querySelectorAll(".list__with__bg__item h4 a")
        ])
      : (listPlaces = []);

    // If listPlaces as some element then map on it to push id in nearbyPlacesIds, else nearbyPlacesIds is an empty array
    if (listPlaces.length) {
      nearbyPlacesIds = listPlaces.map(id => {
        return id
          .getAttribute("href")
          .split("-")
          .reverse()[0];
      });
    } else {
      nearbyPlacesIds = [];
    }

    return {
      pictures: picturesArr,
      price,
      website,
      facebook,
      nearbyPlacesIds,
      description
    };
  });
  await browserBis.close();
  return details;
};

module.exports = moreDetails;
