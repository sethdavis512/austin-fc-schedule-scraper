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
        const allGameRowsNodeList =
            document.querySelectorAll('.mls-o-match-strip');

        const scheduleMeta = [...allGameRowsNodeList].map((row, rowIndex) => {
            const formattedDate = row.querySelector(
                '.mls-o-match-strip__time'
            ).innerText;
            const homeTeam = row.querySelector(
                '.mls-o-match-strip__club--home .mls-o-match-strip__club-short-name'
            ).innerText;
            const awayTeam = row.querySelector(
                '.mls-o-match-strip__club--away .mls-o-match-strip__club-short-name'
            ).innerText;
            const venue = row.querySelector(
                '.mls-o-match-strip__venue'
            ).innerText;
            const startTime = row.querySelector(
                '.mls-o-match-strip__club-separator'
            ).innerText;

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
                startTime
            };
        });

        return scheduleMeta;
    });

    const destination = '/Users/seth/repositories/portfolio/app/data/2022-austin-fc-schedule.json';
    const writeFileCallback = (err) => {
        if (err) return console.log(err);
        console.log('✅ File successfully written');
    };

    await fs.writeFile(
        destination,
        JSON.stringify(scheduleData),
        writeFileCallback
    );

    await browser.close();
})();
