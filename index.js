
const ChromeLauncher = require('chrome-launcher');

let chrome;

launchChrome()
.then((ch) => {
    chrome = ch;
    console.log(`chrome debugging port running on ${chrome.port}`);
    console.log(chrome);
    chrome.kill().then(() => {
        console.error('killed chrome');
    });
})
.catch((err) => {
    if(chrome != null){
        chrome.kill().then(() => {
            console.error('killed chrome');
            throw err;
        });
    }else{
        throw err;
    }
});

function launchChrome(headless = true) {
    return ChromeLauncher.launch({
        port: 9222,
        chromeFlags: [
            // '--window-size=412,732',
            // '--disable-gpu',

            headless ? '--headless' : '',
        ],
        startingUrl: 'https://wgld.org'
    });
}

