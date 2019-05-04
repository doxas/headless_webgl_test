
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

