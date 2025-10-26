const { convertUrlToBase64 } = require('./utils.js');
const fs = require('fs').promises;
const defaultParser = require('./default-parser.js');
const { monthTokens } = require('./parse-date.js');
const { log } = require('console');

module.exports = {
    parse: async (page, metas) => {
        const data = {};
        data.images = [];
        const content = await page.content();
        await fs.writeFile('page.html', content);

        const commonMetas = await defaultParser.parse(page, metas);
        metas.description = commonMetas.metas.description;
        metas.url = commonMetas.metas.url;
        metas.ticketsUrl = commonMetas.metas.url;
        metas.title = commonMetas.metas.title;
        metas.startTimestamp = commonMetas.metas.startTimestamp;
        metas.endTimestamp = commonMetas.metas.endTimestamp;
        data.images = commonMetas.images;
        let finalDescription = "";

        const intros = await page.$$eval('.CampaignHeader--Description > span', intros => intros
            .map(intro => intro.innerHTML)
        );
        if (intros && intros.length > 0) {
            finalDescription += intros[0];
        }

        const descriptions = await page.$$eval('.GeneratedContentWrapper > div', descriptions => descriptions
            .map(description => description.innerHTML)
        );
        if (descriptions && descriptions.length > 0) {
            finalDescription += descriptions[0];
        }

        const priceTitleArray = await page.$$eval('.tier-item-description__title', priceTitleArray => priceTitleArray
            .map(priceTitle => '<br><p>' + priceTitle.textContent.replace(/\n/g, '').trim() + '</p>')
        );
        if (priceTitleArray && priceTitleArray.length > 0) {
            finalDescription += priceTitleArray[0];
        }        

        const priceDescriptionArray = await page.$$eval('.tier-item-description__description', priceDescriptionArray => priceDescriptionArray
            .map(priceDescription => priceDescription.innerHTML)
        );
        if (priceDescriptionArray && priceDescriptionArray.length > 0) {
            finalDescription += ' ' + priceDescriptionArray[0];
        }  

        if (finalDescription != "") {
            metas.description = finalDescription;
        }

        const images = await page.$$eval('.image img, .banner-wrapper img', images => images
            .map(image => image.src)
        );

        // const datesText = await page.$$eval('.CampaignHeader--Date', containers => containers
        //     .map(container => container.textContent)
        // );
        
        // if (datesText.length > 0) {
        //     const dateText = datesText[0];
        //     let fromDay = null;
        //     let fromMonth = null;
        //     let fromYear = null;
        //     let toDay = null;
        //     let toMonth = null;
        //     let toYear = null;
        //     let fromMin = null;
        //     let fromHours = null;
        //     let toMin = null;
        //     let toHours = null;  
        //     let fromDate = null;
        //     let toDate = null;  
        //     let hasEnd = false;
        //     let fromMonthNumber = null;
        //     let toMonthNumber = null;

        //     // Du 13 (août) (2025) au 14 septembre 2025
        //     let regExp = /Du ([0-9]{1,2})( ([A-Za-zÀ-ÖØ-öø-ÿ]+))?( ([0-9]{4}))? au ([0-9]{1,2}) ([A-Za-zÀ-ÖØ-öø-ÿ]+) ([0-9]{4})/gi;
        //     let matches = ([...dateText.matchAll(regExp)]);
        //     if (matches && matches.length > 0) {
        //         const match = matches[0];
        //         fromDay = match[1];
        //         fromMonth = match[2]?? match[7];
        //         fromYear = match[3]?? match[8];
        //         toDay = match[6];
        //         toMonth = match[7];
        //         toYear = match[8];             
        //     } else {
        //         // Le 13 août 2025
        //         regExp = /Le ([0-9]{1,2}) ([A-Za-zÀ-ÖØ-öø-ÿ]+) ([0-9]{4})/gi;
        //         matches = ([...dateText.matchAll(regExp)]);
        //         if (matches && matches.length > 0) {
        //             const match = matches[0];
        //             fromDay = match[1];
        //             fromMonth = match[2];
        //             fromYear = match[3];                    
        //         }                
        //     }

        //     let index = 0;
        //     for (const tokens of monthTokens) {
        //         if (tokens.includes(fromMonth)) {
        //             fromMonthNumber = index; 
        //         }
        //         if (toMonth && tokens.includes(toMonth)) {
        //             toMonthNumber = index; 
        //         }
        //         index++;
        //     }   

        //     // , de 17h à 18h15
        //     regExp = /, de ([0-9]{2})h([0-9]{2})? à ([0-9]{2})h([0-9]{2})?/gi;
        //     matches = ([...dateText.matchAll(regExp)]);
        //     if (matches && matches.length > 0) {
        //         hasEnd = true;
        //         const match = matches[0];
        //         fromHours = match[1];
        //         fromMin = match[2] ?? 0;
        //         toHours = match[3];
        //         toMin = match[4] ?? 0;
        //     } else {
        //         regExp = /, à partir de ([0-9]{2})h([0-9]{2})?/gi;
        //         matches = ([...dateText.matchAll(regExp)]);
        //         if (matches && matches.length > 0) {
        //             const match = matches[0];
        //             fromHours = match[1];
        //             fromMin = match[2] ?? 0;
        //         }
        //     }

        //     fromDate = new Date(fromYear, fromMonthNumber, fromDay, fromHours, fromMin, 0, 0);
        //     metas.startTimestamp = Math.floor(fromDate / 1000);
        //     if (hasEnd) {
        //         toDate = new Date(toYear, toMonthNumber, toDay, toHours, toMin, 0, 0);
        //         metas.endTimestamp = Math.floor(toDate / 1000);
        //     }
    
        // }
        
        
            
        for (const src of images) {
            const parsedImage = await convertUrlToBase64(src);
            if (parsedImage) {
                data.images.push(parsedImage);
            }                   
        }
        data.metas = metas;
        return data;
    }
}