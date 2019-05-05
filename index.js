
const fs                      = require('fs');
const ChromeLauncher          = require('chrome-launcher');
const ChromeDebuggingProtocol = require('chrome-remote-interface');

const TARGET_PORT = 9222;
// const TARGET_URL  = 'https://wgld.org';
const TARGET_URL  = 'http://localhost:9090';

let chrome;   // chrome process
let protocol; // debugging protocol
let network;
let page;
let dom;
let runtime;

ChromeLauncher.launch({
    port: TARGET_PORT,
    chromeFlags: [
        '--window-size=1024,512',
        '--headless',
    ]
})
.then((chromeProcess) => {
    chrome = chromeProcess;
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
    return Promise.all([
        network.enable(),
        page.enable(),
        dom.enable(),
        runtime.enable(),
    ]);
})
.then(() => {
    return page.navigate({url: TARGET_URL});
})
.then(() => {
    return page.loadEventFired();
})
.then(() => {
    return new Promise((resolve) => {
        const recursiveFunction = (callback) => {
            runtime.consoleAPICalled()
            .then((ret) => {
                console.log(ret);
                if(
                    ret.args != null &&
                    Array.isArray(ret.args) === true &&
                    ret.args.length > 0
                ){
                    let called = false;
                    ret.args.map((v) => {
                        if(
                            v.type === 'string' &&
                            v.hasOwnProperty('value') === true &&
                            v.value.includes('rendering complete') === true
                        ){
                            called = true;
                            console.log('console api called');
                            console.log(ret);
                            callback();
                        }
                    });
                    if(called !== true){
                        recursiveFunction(callback);
                    }
                }else{
                    recursiveFunction(callback);
                }
            });
        };
        recursiveFunction(() => {
            resolve();
        });
    });
})
.then(() => {
    return page.captureScreenshot({format: 'jpeg', quality: 100});
})
.then((screenshot) => {
    return new Promise((resolve, reject) => {
        // from index.js running path
        let outPath = `./screenshot/ss_${Date.now()}.jpg`;
        fs.writeFile(outPath, screenshot.data, 'base64', (err) => {
            if(err != null){
                reject(err);
                return;
            }
            console.log(`captured [${outPath}] from "${TARGET_URL}"`)
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

