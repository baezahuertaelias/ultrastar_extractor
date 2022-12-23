const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const moment = require("moment");

function printProgress(value, total) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`Processing page: ${value} of ${total} [${parseFloat((value*100)/total).toFixed(2)}%]`)
  
}

const getAllTotalPages = async () => {
  const { data } = await axios.get(
    `https://ultrastar-es.org/es/canciones?pagina=1&orden=1`
  );

  const $ = cheerio.load(data);

  const result = parseInt(
    $("#canciones > #listado > .navegacion_listado > .paginacion > ul > li")
      .eq(5)
      .children("a")
      .attr("href")
      .replace("/es/canciones?pagina=", "")
      .replace("&idioma=es", "")
  );

  console.log("==========================");
  console.log(`=== TOTAL PAGINAS: ${result} ===`);
  console.log("==========================");

  return result;
};

const getAllDataSongs = async (page) => {
  const url = `https://ultrastar-es.org/en/canciones?pagina=${page}&orden=1`;

  const { data } = await axios.get(url);

  const $ = cheerio.load(data);

  const listItems = $(".canciones > li");

  let filteredData = [];
  listItems.map((idx, el) => {
    let temporalData = [];
    $(el)
      .find("dl.datos > dd")
      .map((idx2, el2) => {
        temporalData.push($(el2).text().trim());
      });

    filteredData.push({
      title: $(el).attr("title")?.slice(27).replaceAll(",", ""),
      dataID: $(el).children("ul.acciones").attr("data-id")?.replaceAll(",", ""),
      artist: $(el).find("h3 > a").eq(0).text()?.replaceAll(",", ""),
      song: $(el).find("h3 > a").eq(1).text()?.replaceAll(",", ""),
      idioma: temporalData[0],
      anio: temporalData[1],
      uploadedBy: temporalData[2],
      rating: temporalData[3],
      downloads: temporalData[4],
      size: temporalData[5],
      date: moment(temporalData[6], "ll").format("DD/MM/YYYY"),
      seeds: temporalData[7],
      leechers: temporalData[8],
      others: temporalData[9],
    });
  });

  return filteredData;
};

const getTotalPages = async (language) => {
  const { data } = await axios.get(
    `https://ultrastar-es.org/es/canciones?idioma=${language}`
  );

  const $ = cheerio.load(data);

  const result = parseInt(
    $("#canciones > #listado > .navegacion_listado > .paginacion > ul > li")
      .eq(5)
      .children("a")
      .attr("href")
      .replace("/es/canciones?pagina=", "")
      .replace("&idioma=es", "")
  );

  console.log("=========================");
  console.log(`=== TOTAL PAGINAS: ${result} ===`);
  console.log("=========================");

  return result;
};

const getDataSongs = async (page, language) => {
  const url = `https://ultrastar-es.org/en/canciones?pagina=${page}&idioma=${language}`;

  const { data } = await axios.get(url);

  const $ = cheerio.load(data);

  const listItems = $(".canciones > li");

  let filteredData = [];
  listItems.map((idx, el) => {
    let temporalData = [];
    $(el)
      .find("dl.datos > dd")
      .map((idx2, el2) => {
        temporalData.push($(el2).text().trim());
      });

    filteredData.push({
      title: $(el).attr("title")?.slice(27).replaceAll(",", ""),
      dataID: $(el).children("ul.acciones").attr("data-id")?.replaceAll(",", ""),
      artist: $(el).find("h3 > a").eq(0).text()?.replaceAll(",", ""),
      song: $(el).find("h3 > a").eq(1).text()?.replaceAll(",", ""),
      idioma: temporalData[0],
      anio: temporalData[1],
      uploadedBy: temporalData[2],
      rating: temporalData[3],
      downloads: temporalData[4],
      size: temporalData[5],
      date: moment(temporalData[6], "ll").format("DD/MM/YYYY"),
      seeds: temporalData[7],
      leechers: temporalData[8],
      others: temporalData[9],
    });
  });

  return filteredData;
};

const createJSON = async (finalResult, language) => {
  fs.writeFileSync(
    `${language}.json`,
    `{data: ` + JSON.stringify(finalResult) + ` }`,
    "utf8",
    function (err) {
      if (err) throw err;
      console.log("File written");
    }
  );
};

const createCSV = async (finalResult, language) => {
  const header = "ARTISTA,CANCION,URL,IDIOMA,ANO,RATING,FECHA\n";
  finalResult = finalResult.map(item => `${removeAccents(item.artist)},${removeAccents(item.song)},https://ultrastar-es.org/es/canciones/descargar/torrent/${item.dataID},${item.idioma},${item.anio},${item.rating},${item.date}`);
  fs.writeFileSync(
    `${language}.csv`,
    header + finalResult.join("\n"),
    { encoding: "utf8" },
    function (err) {
      if (err) throw err;
      console.log("File written");
    }
  );
};

const main = async () => {
  /* const language = "es";

  const pages = await getTotalPages(language);

  let finalResult = [];
  for (let index = 0; index < pages; index++) {
    printProgress(index + 1, pages);
    const resultpage = await getDataSongs(index + 1, language);
    finalResult = [...finalResult, ...resultpage];
  } 

  await createCSV(finalResult, language);*/
  
  
  const pages = await getAllTotalPages();

  let finalResult = [];
  for (let index = 0; index < pages; index++) {
    printProgress(index + 1, pages);
    const resultpage = await getAllDataSongs(index + 1);
    finalResult = [...finalResult, ...resultpage];
  }

  await createCSV(finalResult, 'all');
};

const removeAccents = (text) => {
  const sustitutions = {
    àáâãäå: "a",
    ÀÁÂÃÄÅ: "A",
    èéêë: "e",
    ÈÉÊË: "E",
    ìíîï: "i",
    ÌÍÎÏ: "I",
    òóôõö: "o",
    ÒÓÔÕÖ: "O",
    ùúûü: "u",
    ÙÚÛÜ: "U",
    ýÿ: "y",
    ÝŸ: "Y",
    ß: "ss",
    ñ: "n",
    Ñ: "N"
  };
  // Devuelve un valor si 'letter' esta incluido en la clave
  function getLetterReplacement(letter, replacements) {
    const findKey = Object.keys(replacements).reduce(
      (origin, item, index) => (item.includes(letter) ? item : origin),
      false
    );
    return findKey !== false ? replacements[findKey] : letter;
  }
  // Recorre letra por letra en busca de una sustitución
  return text
    .split("")
    .map((letter) => getLetterReplacement(letter, sustitutions))
    .join("");
}

main();
