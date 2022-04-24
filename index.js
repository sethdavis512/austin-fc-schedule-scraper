const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.setViewport({
        width: 1600,
        height: 900,
        deviceScaleFactor: 1
    });

    await page.goto('https://www.austinfc.com/schedule', {
        waitUntil: 'domcontentloaded'
    });

    // Stupid schedule page takes a while to load...
    await page.waitForTimeout(5000);

    const scheduleData = await page.evaluate(() => {
        const extractInnerText = (element, selector) => {
            const queriedItem = element.querySelector(selector);

            return queriedItem && queriedItem.innerText;
        };

        const allGameRowsNodeList =
            document.querySelectorAll('.mls-o-match-strip');

        const scheduleMeta = [...allGameRowsNodeList].map((row, rowIndex) => {
            const timeNodes = row.querySelectorAll('.mls-o-match-strip__time');
            const rowTimes = [...timeNodes];
            const formattedDate = rowTimes[0] ? rowTimes[0].innerText : null;
            const startTime = rowTimes[1] ? rowTimes[1].innerText : null;

            const homeTeam = extractInnerText(
                row,
                '.mls-o-match-strip__club--home .mls-o-match-strip__club-short-name'
            );
            const awayTeam = extractInnerText(
                row,
                '.mls-o-match-strip__club--away .mls-o-match-strip__club-short-name'
            );
            const venue = extractInnerText(row, '.mls-o-match-strip__venue');
            const score = extractInnerText(row, '.mls-o-match-strip__score');

            const broadcastersNodeList = row.querySelectorAll(
                '.mls-o-match-strip__broadcaster'
            );
            const broadcasters = [...broadcastersNodeList].map((b) =>
                b.innerText.replace(',', '')
            );

            return {
                gameNumber: rowIndex + 1,
                formattedDate,
                homeTeam,
                awayTeam,
                venue,
                broadcasters,
                startTime,
                score
            };
        });

        return scheduleMeta;
    });

    const destination =
        '/Users/seth/repositories/portfolio/app/data/2022-austin-fc-schedule.json';
    const writeFileCallback = (err) => {
        if (err) return console.log(err);
        console.log('✅ File successfully written');
    };

    console.log(JSON.stringify(scheduleData));

    await fs.writeFile(
        destination,
        JSON.stringify(scheduleData),
        writeFileCallback
    );

    await browser.close();
})();
