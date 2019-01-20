'use strict';
/* eslint-env browser */
const puppeteer = require('puppeteer');
const Observable = require('zen-observable');

async function init(browser, page, observer, prevSpeed, type) {
    if (type != 'upload') {
        const result = await page.evaluate(() => {
            const $ = document.querySelector.bind(document);

            console.log('probing download', $('#speed-value').textContent);

            return {
                speed: Number($('#speed-value').textContent),
                unit: $('#speed-units').textContent.trim(),
                isDone: Boolean($('#speed-value.succeeded')),
                type: 'Download'
            };
        });

        if (result.speed > 0 && result.speed !== prevSpeed) {
            observer.next(result);
        }

        if (result.isDone) {
            const moreInfoAnchor = "#show-more-details-link";
            await page.click(moreInfoAnchor);

            setTimeout(init, 100, browser, page, observer, result.speed, 'upload');
        } else {
            setTimeout(init, 100, browser, page, observer, result.speed, 'download');
        }
    } else {
		const result2 = await page.evaluate(() => {
			const $ = document.querySelector.bind(document);

			return {
				speed: Number($('#upload-value').textContent),
				unit: $('#upload-units').textContent.trim(),
				isDone: Boolean($('#upload-value.succeeded')),
                type: 'Upload'
			};
		});

		if (result2.speed > 0 && result2.speed !== prevSpeed) {
			observer.next(result2);
		}

		if (result2.isDone) {
			browser.close();
			observer.complete();
		} else {
            setTimeout(init, 100, browser, page, observer, result2.speed, 'upload');
        }
	}
}

module.exports = () => new Observable(observer => {
	// Wrapped in async IIFE as `new Observable` can't handle async function
	(async () => {
		const browser = await puppeteer.launch({args: ['--no-sandbox']});
		const page = await browser.newPage();

		await page.goto('https://fast.com');
		await init(browser, page, observer, 'download');
	})().catch(observer.error.bind(observer));
});
