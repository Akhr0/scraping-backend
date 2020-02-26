const puppeteer = require("puppeteer");

const moreDetails = async link => {
  // Launch Puppeteer
  const browser = await puppeteer.launch();

  // Launch a page
  const page = await browser.newPage();

  // Go tu URL and wait it's loaded
  await page.goto(link, { waitUntil: "networkidle2" });

  const details = await page.evaluate(() => {
    const carousel = document.querySelector(".carousel-inner");
    if (carousel) {
      const picturesArr = carousel.map(pic => {
        return pic.querySelector(".panel__figure a").getAttribute("href");
      });
    } else {
      const picturesArr = [];
    }

    const price =
      document.querySelector(".label__list__body") &&
      document
        .querySelectorAll(".label__list__body .price--fill")
        .pop()
        .getAttribute("title");
    const website =
      document.querySelector(".label__list__body .url") &&
      document.querySelector(".label__list__body .url").getAttribute("href");
    const facebook =
      document.querySelector(
        ".label__list__body .facebook--blue--def--color"
      ) &&
      document
        .querySelector(".label__list__body .facebook--blue--def--color")
        .getAttribute("href");
    const nearbyPlacesIdsArr = document.querySelectorAll(
      ".list__with__bg__item h4 a"
    );
    if (nearbyPlacesIdsArr) {
      const nearbyPlacesIds = nearbyPlacesIdsArr.map(id => {
        return id
          .getAttribute("href")
          .split("-")
          .reverse()[0];
      });
    }

    return {
      pictures: picturesArr,
      price,
      website,
      facebook,
      nearbyPlacesIds
    };
  });
};

const fetchCitySearchData = async (link, city, proxy) => {
  console.log("Proxy utilisé = " + proxy);

  // Launch Puppeteer
  const browser = await puppeteer.launch();

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
        // // More details
        // if (elem.querySelector(".thumbnail__link")) {
        //   // Launch Puppeteer
        //   const browserbis = await puppeteer.launch();

        //   // Launch a page
        //   const pagebis = await browser.newPage();

        //   // Go tu URL and wait it's loaded
        //   await pagebis.goto(elem.querySelector(".thumbnail__link"), {
        //     waitUntil: "networkidle2"
        //   });

        //   const details = await pagebis.evaluate(() => {
        //     const carousel = document.querySelector(".carousel-inner");
        //     if (carousel) {
        //       const picturesArr = carousel.map(pic => {
        //         return pic
        //           .querySelector(".panel__figure a")
        //           .getAttribute("href");
        //       });
        //     } else {
        //       const picturesArr = [];
        //     }

        //     const price =
        //       document.querySelector(".label__list__body") &&
        //       document
        //         .querySelectorAll(".label__list__body .price--fill")
        //         .pop()
        //         .getAttribute("title");
        //     const website =
        //       document.querySelector(".label__list__body .url") &&
        //       document
        //         .querySelector(".label__list__body .url")
        //         .getAttribute("href");
        //     const facebook =
        //       document.querySelector(
        //         ".label__list__body .facebook--blue--def--color"
        //       ) &&
        //       document
        //         .querySelector(".label__list__body .facebook--blue--def--color")
        //         .getAttribute("href");
        //     const nearbyPlacesIdsArr = document.querySelectorAll(
        //       ".list__with__bg__item h4 a"
        //     );
        //     if (nearbyPlacesIdsArr) {
        //       const nearbyPlacesIds = nearbyPlacesIdsArr.map(id => {
        //         return id
        //           .getAttribute("href")
        //           .split("-")
        //           .reverse()[0];
        //       });
        //     }

        //     return {
        //       pictures: picturesArr,
        //       price,
        //       website,
        //       facebook,
        //       nearbyPlacesIds
        //     };
        //   });
        // }

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
            elem.querySelectorAll(".venue__rating .fa-star-half-o").length / 2,
          vegan:
            elem.querySelector(".thumbnail__details") &&
            Number(
              elem
                .querySelector(".thumbnail__details")
                .getAttribute("data-vegan")
            ),
          vegOnly:
            elem.querySelector(".thumbnail__details") &&
            Number(
              elem
                .querySelector(".thumbnail__details")
                .getAttribute("data-vegonly")
            ),
          link:
            elem.querySelector(".thumbnail__link") &&
            "https://www.happycow.net" +
              elem.querySelector(".thumbnail__link").getAttribute("href")
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
  console.log(fullList);
};

fetchCitySearchData(
  "https://www.happycow.net/searchmap?s=3&location=",
  "oslo",
  "5.44.107.147:3128"
);
