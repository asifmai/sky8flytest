const puppeteer = require('puppeteer');
const fs = require('fs');

runBot()

function runBot() {
  return new Promise(async (resolve, reject) => {
    const dt = new Date();
    const fileName = `${dt.getDate()}${dt.getMonth()}${dt.getFullYear()}${dt.getHours()}${dt.getMinutes()}${dt.getSeconds()}.csv`;
    fs.writeFileSync(fileName, 'productname, averageprice' + '\n');

    // Load Chromium Browser
    const browser = await puppeteer.launch({ 
      headless: false, 
      args: ['--window-size=1366,768'],
    });
    
    // Open a new Page
    const page = await browser.newPage();    
    
    // Set Page viewPort
    await page.setViewport({
      width: 1366,
      height: 600
    });

    // Define Page header so that the website do not know that this is a headless browser
    const headlessUserAgent = await page.evaluate(() => navigator.userAgent);
    const chromeUserAgent = headlessUserAgent.replace('HeadlessChrome', 'Chrome');
    await page.setUserAgent(chromeUserAgent);
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.8'
    });

    // Goto homepage 
    await page.goto('https://stockx.com/watches/most-popular', { timeout: 0, waitUntil: 'load' });

    // Close The dialoge if it appears
    const modelCloseButton = await page.$('.modal-body .close-btn');
    if (modelCloseButton) {
      await modelCloseButton.click();
    }

    // Load all products on the page
    await page.waitForSelector('.browse-load-more .btn');
    await page.click('.browse-load-more .btn');
    await page.waitFor(10000)

    await page.waitForSelector('.browse-grid');
    let watches = await page.$$('.tile.browse-tile a');
    
    for (let i = 0; i < watches.length; i++) {
      await page.goto('https://stockx.com/watches/most-popular', { timeout: 0, waitUntil: 'load' });

      const modelCloseButton = await page.$('.modal-body .close-btn');
      if (modelCloseButton) {
        await modelCloseButton.click();
      }

      await page.waitForSelector('.browse-load-more .btn');
      await page.click('.browse-load-more .btn');
      await page.waitFor(10000);

      await page.waitForSelector('.browse-grid');
      watches = await page.$$('.tile.browse-tile a');

      await Promise.all([
        page.waitForNavigation({
          timeout: 0,
          waitUntil: 'load',
        }),
        watches[i].click()
      ]);
      await page.waitForSelector('.product-title');
      const productNameNode = await page.$('.product-title');
      const productName = await page.evaluate(prod => prod.innerText, productNameNode)
      await page.waitForSelector('.gauges');
      const gauges = await page.$$('.gauges .gauge-container .gauge-value');
      const averagePrice = await page.evaluate(gauge => gauge.innerText, gauges[2])
      fs.appendFileSync(fileName, `${productName}, ${averagePrice}` + '\n');
    }

    browser.close();
  });
}