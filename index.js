
const fs                      = require('fs');
const ChromeLauncher          = require('chrome-launcher');
const ChromeDebuggingProtocol = require('chrome-remote-interface');

let chrome;
let protocol;
let network;
let page;
let dom;
let runtime;

launchChrome()
.then((ch) => {
    chrome = ch;
})
.then(() => {
    return ChromeDebuggingProtocol({
        port: chrome.port,
    });
})
.then((debuggingProtocol) => {
    protocol = debuggingProtocol;
    network  = debuggingProtocol.Network;
    page     = debuggingProtocol.Page;
    dom      = debuggingProtocol.DOM;
    runtime  = debuggingProtocol.Runtime;
})
.then(() => {
    return Promise.all([
        network.enable(),
        page.enable(),
        dom.enable(),
        runtime.enable(),
    ]);
})
.then(() => {
    return page.navigate({url: 'https://wgld.org'});
})
.then(() => {
    return page.loadEventFired();
})
.then(() => {
    return page.captureScreenshot({format: 'png', fromSurface: true});
})
.then((screenshot) => {
    return new Promise((resolve, reject) => {
        fs.writeFile('screenshot.png', screenshot.data, 'base64', (err) => {
            if(err != null){
                reject(err);
                return;
            }
            resolve();
        });
    });
})
.catch((err) => {
    throw err;
})
.finally(() => {
    if(protocol != null){
        console.log('protocol closed');
        protocol.close();
    }
    if(chrome != null){
        chrome.kill().then(() => {
            console.error('chrome process killed');
        });
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

