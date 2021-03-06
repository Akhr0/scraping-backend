// Declaration of a the function which fetches datas from the Big Page of each restaurant \\\ New Puppetter
const moreDetails = async link => {
  console.log(link);
  // Launch Puppeteer
  const browser = await puppeteer.launch();

  // Launch a page
  const page = await browser.newPage();

  // Go tu URL and wait it's loaded
  await page.goto(link, { waitUntil: "networkidle2" });

  const details = await page.evaluate(() => {
    // Creation of all variables
    let price;
    let carousel;
    let picturesArr;
    let listPlaces;
    let nearbyPlacesIds;
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

    // If priceLast exist then price get title attribut, else title is null
    price = priceLast ? priceLast.getAttribute("title") : "";

    // If carousel exists then assign nodes'array, else assign empty array
    document.querySelector(".carousel-inner")
      ? (carousel = [
          ...document.querySelectorAll(".carousel-inner .panel__figure")
        ])
      : (carousel = []);

    // If carousel as some element then map on it to push images in picturesArr, else pitcturesArr is an empty array
    if (carousel.length) {
      picturesArr = carousel.map(pic => {
        return pic.querySelector("a").getAttribute("href");
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
      nearbyPlacesIds
    };
  });
  return details;
};

// Declaration of the main function which fetch datas and calls too moreDetails function
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
  }

  console.log("");
  console.log("Ma liste à pusher en BDD est désormais complète ");
  console.log(
    "Elle possède " + fullList.length + " éléments pour la ville de " + city
  );

  await browser.close();
  return fullList;
};
