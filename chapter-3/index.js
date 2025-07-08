require("dotenv").config();
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const link = process.env.LINK;
const URL_PREFIX = process.env.URL_PREFIX;

const setBrowserOptions = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    return { browser, page };
  } catch (error) {
    console.error("Error setting browser options:", error.message);
    throw error;
  }
};

const setUserAgent = async (page) => {
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setDefaultNavigationTimeout(60000);
  } catch (error) {
    console.error("Error setting user agent:", error.message);
    throw error;
  }
};

const navigateToPage = async (page, url) => {
  try {
    console.log("Navigating to url...");
    await page.goto(url, {
      waitUntil: "networkidle2",
    });
    await page.waitForSelector("div[data-testid='card-container']", {
      timeout: 10000,
    });
  } catch (error) {
    console.error(`Error navigating to ${url}:`, error.message);
    throw error;
  }
};

const scrapeHomeLinks = async (page) => {
  try {
    const content = await page.content();
    const $ = cheerio.load(content);
    const homeLinks = [];

    $("meta[itemprop='url']").each((index, element) => {
      const url = "https://" + $(element).attr("content");
      if (url) {
        homeLinks.push(url);
      }
    });

    console.log("Found home links:", homeLinks);
    return homeLinks;
  } catch (error) {
    console.error("Error scraping home links:", error.message);
    throw error;
  }
};

const sample = {
  price: 100,
  title: "Cozy Apartment in the Heart of Lagos",
  location: "Lekki, Lagos, Nigeria",
  guests: 2,
  bedrooms: 1,
  beds: 1,
  baths: 1,
  amenities: ["Wifi"],
};

const scrapeListingDetails = async (page, url) => {
  try {
    console.log(`Scraping details from ${url}...`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector("h1", { timeout: 10000 }); // Wait for listing title

    const content = await page.content();
    const $ = cheerio.load(content);

    const amenities = [];
    $(".c16f2viy ._19xnuo97").each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        amenities.push(text);
      }
    });

    const title = $("h1").first().text().trim();
    const price =
      $(
        'span[style*="--pricing-guest-primary-line-unit-price-text-decoration"]'
      )
        .text()
        .trim() || "N/A";
    const location =
      $("section .s1qk96pm.atm_gq_p5ox87").text().trim() || "N/A"; // Location
    const description =
      $(
        'div[data-section-id="DESCRIPTION_DEFAULT"] span span.l1h825yc.atm_kd_19r6f69_24z95b'
      )
        .text()
        .trim() || "N/A"; // Location
    const details = {};

    // Example: Extract guest count, bedrooms, beds, baths (adjust selectors as needed)
    $("section ol.lgx66tx li.l7n4lsf").each((_, element) => {
      const text = $(element).text().toLowerCase();
      if (text.includes("guest")) details.guests = text || "N/A";
      if (text.includes("bedroom")) details.bedrooms = text || "N/A";
      if (text.includes("bed")) details.beds = text || "N/A";
      if (text.includes("bath")) details.baths = text || "N/A";
    });

    return { url, title, price, location, description, amenities, ...details };
  } catch (error) {
    console.error(`Error scraping details from ${url}:`, error.message);
    return { url, error: error.message };
  }
};

const closeBrowser = async (browser) => {
  try {
    if (browser) {
      await browser.close();
      console.log("Browser closed.");
    }
  } catch (error) {
    console.error("Error closing browser:", error.message);
    throw error;
  }
};

const scrapeAirbnb = async (url) => {
  let browser;
  try {
    const { browser: puppeteerBrowser, page } = await setBrowserOptions();
    browser = puppeteerBrowser;

    await setUserAgent(page);
    await navigateToPage(page, url);
    const links = await scrapeHomeLinks(page);

    // Scrape details for each link
    const listings = [];
    for (const link of links) {
      const details = await scrapeListingDetails(page, link);
      listings.push(details);
    }

    return listings;
  } catch (error) {
    console.error("Scraping failed:", error.message);
    throw error;
  } finally {
    await closeBrowser(browser);
  }
};

// Run the scraper
const main = async () => {
  try {
    const listings = await scrapeAirbnb(link);
    console.log("Scraping completed:", JSON.stringify(listings, null, 2));
  } catch (error) {
    console.error("Main execution failed:", error.message);
  }
};

main();
