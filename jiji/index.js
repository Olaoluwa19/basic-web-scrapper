const request = require("request-promise");
const cheerio = require("cheerio");
const ObjectsToCsv = require("objects-to-csv");

const url = "https://jiji.ng/cars";

const scrapeSample = {
  title: "Basic Info Scraping",
  description:
    "This is a basic example of scraping data from a website using Cheerio and Request-Promise.",
  datePosted: new Date("20-06-2025"),
  url: url,
  price: 50000,
  location: "Lagos, Nigeria",
  image: "https://example.com/image.jpg",
  condition: "New",
  package: "ENTERPRISE",
  user_status: "active",
  transmissionType: "Automatic",
  advertLabel_1: "For Sale",
  advertLabel_2: "Popular",
  advertLabel_3: "Quick Reply",
  contact: {
    name: "John Doe",
    phone: "+2341234567890",
    email: "",
  },
};

const scrapeResults = [];

const scrapePostHeaders = async () => {
  try {
    const htmlResult = await request.get(url);
    const $ = cheerio.load(htmlResult);

    $(".masonry-item").each((index, element) => {
      const title = $(element).find(".b-advert-title-inner").text().trim();
      const link = $(element).find(".b-list-advert-base").attr("href");
      const url = `https://jiji.ng${link}`;
      const advertLabel_1 = $(element)
        .find(".b-list-advert-base__label__inner")
        .text()
        .trim();
      const price = $(element).find(".qa-advert-price").text().trim();

      const scrapeResult = { title, url, advertLabel_1, price };
      scrapeResults.push(scrapeResult);
    });
    return scrapeResults;
  } catch (error) {
    console.error(error);
  }
};

const scrapePostDescription = async (postHeaders) => {
  try {
    const updatedPost = await Promise.all(
      postHeaders.map(async (post) => {
        const htmlResult = await request.get(post.url);
        const $ = cheerio.load(htmlResult);
        post.description = $(".b-advert-title-inner").text().trim();
        post.location = $(".b-advert-info-statistics--region").text().trim();
        post.transmissionType = $(
          '.b-advert-icon-attribute span[itemprop="vehicleTransmission"]'
        )
          .text()
          .trim();
        post.condition = $(
          ".b-advert-icon-attribute span[itemprop='itemCondition']"
        )
          .text()
          .trim();
        post.advert = $(".b-advert-paid-info__text").text().trim();
        post.image = $(".b-slider-image").attr("src");
        return post;
      })
    );
    return updatedPost;
  } catch (error) {
    console.error("Error in scrapePostDescription:", error.message);
    return postHeaders; // Return original headers if Promise.all fails
  }
};

const createCSVFile = async (data) => {
  const csv = new ObjectsToCsv(data);

  // Save to file:
  await csv.toDisk("./test.csv");
};

const scrapeJiji = async () => {
  const postHeaders = await scrapePostHeaders();
  const PostFullData = await scrapePostDescription(postHeaders);
  const CSVFile = createCSVFile(PostFullData);
  return CSVFile;
};

scrapeJiji();
