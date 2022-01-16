const cheerio = require("cheerio");
const XLSX = require('xlsx')
const { By, Key, Builder } = require("selenium-webdriver");
require("chromedriver");

const idiomas = ['de','br','ca','cs','zh',
                 'ko','hr','da','sk','es',
                 'eu','fi','fr','gl','el',
                 'he','hi','hu','en','ga',
                 'is','it','ja','la','nl',
                 'no','fa','pl','pt','ro',
                 'ru','scat','sr','sv','th',
                 'tr']


async function run_scrapper() {

        //To wait for browser to build and launch properly
        let driver = await new Builder().forBrowser("chrome").build();

        //Loop over all languages selected
        for (const idioma of idiomas) {
                let pos_pagina = 1;
                let listado = [];

                //Load website filtered by language
                await driver.get(`https://ultrastar-es.org/es/canciones?idioma=${idioma}`);

                //Get length of list of songs
                let cantidad
                try {
                        cantidad = await driver.findElement(By.css("a[title*='Ir a la última página de resultados']")).getAttribute('href') + '';
                        cantidad = cantidad.replace(/\D/g, "");    
                } catch (error) {
                        cantidad = 1;
                }
                
                

                //Iterate over actual page and extract info
                while (pos_pagina <= cantidad) {

                        //Create variable to get list of songs on page
                        let html = await driver.findElement(By.className("canciones")).getAttribute('innerHTML')

                        //Load site in cheerio to iterate
                        let $ = cheerio.load(html);

                        //Each song is in a li tag
                        $("li").each(function (index) {

                                //Check if song exists (to avoid possible others songs)
                                if ($(this).find('h3 > a').eq(1).text() != "") {
                                        let resp = {
                                                cancion: $(this).find('h3 > a').eq(1).text(),
                                                artista: $(this).find('h3 > a').eq(0).text(),
                                                torrent: 'https://ultrastar-es.org' + $(this).find(".acciones > li > a").attr('href')
                                        };

                                        //Save song info in array
                                        listado.push(resp)
                                }
                        });

                        //Update position of list
                        console.log(`>> Pagina ${pos_pagina} de ${cantidad}... Llevamos ${listado.length} canciones encontradas`);
                        pos_pagina++;

                        //Check if there is another page with songs
                        try {
                                await driver.findElement(By.css("a[title*='Ir a la siguiente página de resultados']")).click();
                        } catch (error) {
                                console.log('SE CAYO AL AVANZAR A LA PROX PAGINA');
                        }
                }

                //Convert array to sheet
                let binaryWS = XLSX.utils.json_to_sheet(listado);
                
                // Create a new Workbook
                var wb = XLSX.utils.book_new()

                // Name your sheet
                XLSX.utils.book_append_sheet(wb, binaryWS, 'Canciones')

                // export your excel
                XLSX.writeFile(wb, `${idioma}.xlsx`);
        };


        //It is always a safe practice to quit the browser after execution
        await driver.quit();

}

run_scrapper()