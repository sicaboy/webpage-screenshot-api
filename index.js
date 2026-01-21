const express = require('express');
const puppeteer = require('puppeteer-core');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BROWSER_WS_ENDPOINT = process.env.BROWSER_WS_ENDPOINT || 'ws://browser:3000';

app.post('/screenshot', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let browser;
    try {
        console.log(`Connecting to browser at ${BROWSER_WS_ENDPOINT}...`);
        browser = await puppeteer.connect({
            browserWSEndpoint: BROWSER_WS_ENDPOINT,
        });

        const page = await browser.newPage();

        // Set viewport to a reasonable default
        await page.setViewport({ width: 1280, height: 800 });

        console.log(`Navigating to ${url}...`);
        await page.goto(url, {
            waitUntil: 'networkidle0', // Wait until network is idle (no connections for at least 500 ms)
            timeout: 30000 // 30 seconds timeout
        });

        console.log('Taking screenshot...');
        const screenshot = await page.screenshot({
            encoding: 'base64',
            fullPage: false // Change to true if full page is needed, maybe make it configurable?
        });

        await page.close();

        res.json({
            success: true,
            screenshot: screenshot
        });

    } catch (error) {
        console.error('Error taking screenshot:', error);
        res.status(500).json({
            error: 'Failed to take screenshot',
            details: error.message
        });
    } finally {
        if (browser) {
            browser.disconnect();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Screenshot API listening on port ${PORT}`);
});
