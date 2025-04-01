// extractor.js

const puppeteer = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function extractVideoUrl(hunterPageUrl) {

console.log('Starting video URL extraction...');

console.log('Target URL:', hunterPageUrl);

const browser = await puppeteer.launch({

headless: true,
args: ['--no-sandbox', '--disable-setuid-sandbox']
});

let videoUrl = null;

try {

const page = await browser.newPage();
// Set viewport and user agent
await page.setViewport({ width: 1366, height: 768 });
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36');
// Listen for m3u8 requests
page.on('request', request => {
  const url = request.url();
  if (url.includes('.m3u8') && !videoUrl) {
    videoUrl = url;
    console.log('Found .m3u8 URL:', videoUrl);
  }
});
// Navigate to target page using the provided hunter page URL
console.log('Navigating to page...');
await page.goto(hunterPageUrl, {
  waitUntil: 'domcontentloaded',
  timeout: 60000
});
console.log('Waiting for iframe to load...');
const frameElementHandle = await page.waitForSelector('iframe', { timeout: 15000 });
const frame = await frameElementHandle.contentFrame();
if (!frame) {
  throw new Error('Could not access iframe content');
}
console.log('Iframe loaded, waiting for video to appear...');
await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds
// If no URL was found, try interacting with the video element
if (!videoUrl) {
  console.log('Attempting to interact with video player...');
  try {
    const videoElement = await frame.waitForSelector('video', { timeout: 10000 });
    if (videoElement) {
      await videoElement.click();
      console.log('Clicked on video element');
    }
    await new Promise(resolve => setTimeout(resolve, 5000)); // additional wait
  } catch (e) {
    console.log('Could not find or click video element:', e.message);
  }
}
// Log final result
if (videoUrl) {
  console.log('\nExtracted Video URL:\n', videoUrl);
} else {
  console.log('Failed to extract .m3u8 URL. Please check the page manually.');
}
} catch (error) {

console.error('Error during extraction:', error.message);
} finally {

await browser.close();
console.log('Browser closed');
}

return videoUrl;

}

module.exports = extractVideoUrl;