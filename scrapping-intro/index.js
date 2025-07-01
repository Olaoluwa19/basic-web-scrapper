const request = require("request-promise");
const fs = require("fs");
const cheerio = require("cheerio");

const main = async () => {
  const html = await request.get(
    "https://reactnativetutorial.net/css-selectors/lesson2.html"
  );
  fs.writeFileSync("./test.html", html);
  const $ = cheerio.load(html);
  $("h2").each((index, element) => {
    console.log($(element).text());
  });
};

main();
