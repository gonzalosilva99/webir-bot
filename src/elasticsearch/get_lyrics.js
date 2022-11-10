const puppeteer = require("puppeteer");
const jsdom = require("jsdom");
const LanguageDetect = require("languagedetect");
const { fill } = require("./send-to-elasticsearch");

const lngDetector = new LanguageDetect();

(async () => {
  const browser = await puppeteer.launch();
  try {
    // Abrimos una instancia del puppeteer y accedemos a la url de google
    const page = await browser.newPage();
    for (let i = 2580000; i < 2584008; i++) {
      const songLines = [];
      const songParagraphs = [];
      const link = `https://www.musica.com/letras.asp?letra=${i}`;
      const response = await page.goto(link);
      const body = await response.text();

      // Creamos una instancia del resultado devuelto por puppeter para parsearlo con jsdom
      const {
        window: { document },
      } = new jsdom.JSDOM(body);
      // Seleccionamos los títulos y lo mostramos en consola
      const title = document.querySelector(".letra .info h1")?.textContent;
      const author = document.querySelector(".letra .info a")?.textContent;
      console.log({ title, author, link });
      const queryParagraphs = document.querySelectorAll(".letra #letra p");

      if (title && queryParagraphs.length > 0) {
        queryParagraphs.forEach((paragraph) => {
          songParagraphs.push(paragraph.innerHTML);
          paragraph.innerHTML.split(/(<br>|\n)/g).forEach((line) => {
            const lineProcessed = cleanSongDescriptions(
              cleanEnter(cleanTags(line.toLowerCase()))
            );
            lineProcessed.replace(/\s/g, "").length &&
              songLines.push(lineProcessed);
          });
        });
        const wholeSong = songLines.join(" ");

        await fill(
          title,
          author,
          wholeSong,
          lngDetector.detect(wholeSong, 1)[0][0],
          link
        );
      } else {
        console.log("No se ha encontrado la letra de la canción");
      }
    }
    // Cerramos el puppeteer
    await browser.close();
  } catch (error) {
    console.error(error);
  }
})();

cleanEnter = (line) => {
  line = line.replace(/(<br>|<br\/>)/g, " ");
  line = line.replace(/(\n|\r|\t)/g, " ");
  return line;
};

cleanTags = (line) => {
  line = line.replace(/(<b>|<\/b>|<i>|<\/i>)/g, "");
  return line;
};

cleanSongDescriptions = (line) => {
  line = line.replace(/(\[(.*?)\]|[+\-*!?=¿¡\(\)\.,#])/g, "");
  return line;
};

var fs = require("fs");
var util = require("util");
var log_file = fs.createWriteStream(__dirname + "/debug.log", { flags: "w" });
var log_stdout = process.stdout;

console.log = function (d) {
  log_file.write(util.format(d) + "\n");
  log_stdout.write(util.format(d) + "\n");
};
