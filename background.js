const tabs = {};
const debug = true;
const inspectFile = 'inspect.js';
const activeIcon = 'active-96.png';
const defaultIcon = 'default-96.png';
const restAPI = 'https://api.jstverify.com/ext1';

var lastXPath = '';

window.onload = () => {
    chrome.storage.local.clear(function() {
        var error = chrome.runtime.lastError;
        if (error) {
            console.error(error);
        }
    });

    console.log('BG Debug: '+debug);
    chrome.storage.local.set({debug: debug, recording: false, loggedIn: false, recordingComplete: false, lastElement: false, lastElementType: false, uploadStatus: false, testTitle: false, webTestConfig: false, uid: false, bearer: false});
    console.log('Recording: ', false);
}

function recordScreenshot(){
    console.log('Screenshot Action Recorded')
    chrome.storage.local.get(['webTestConfig'], (result) => {
        webTestConfig = JSON.parse(result.webTestConfig);
        payload = {Action: {SS: true}}

        webTestConfig['Test'].push(payload)
        chrome.storage.local.set({webTestConfig: JSON.stringify(webTestConfig)})
        if (debug) {
            console.log(JSON.stringify(webTestConfig));
        }
    })
}

function recordWaitEvent(waitTimeout){
    console.log('Wait Action Recorded')
    chrome.storage.local.get(['webTestConfig', 'lastElement'], (result) => {
        webTestConfig = JSON.parse(result.webTestConfig);
        lastElement = result.lastElement;

        if (lastElement) {
            payload = {WaitForElementXPATH: {XPATH: lastElement, TIME: waitTimeout}}

            webTestConfig['Test'].push(payload)
            chrome.storage.local.set({webTestConfig: JSON.stringify(webTestConfig)})
        }

        if (debug) {
            console.log(JSON.stringify(webTestConfig));
        }
    })
}

function buildAction(xpath, type, lastElementKeys, hidden){
    chrome.storage.local.get(['webTestConfig', 'lastElement', 'lastElementType', 'recording'], (result) => {
        recording = result.recording;

        if (recording || xpath == 'StopAllActions') {
            recordAction = false;
            webTestConfig = JSON.parse(result.webTestConfig);
    
            lastElement = result.lastElement;
            lastElementType = result.lastElementType;
    
            if (lastElement != false){
                if (xpath != lastElement){
                    if (lastElementType == 'INPUT' && lastElementKeys || lastElementType == 'TEXTAREA' && lastElementKeys) {
                        payload = {FindElementByXPATH: {XPATH: lastElement, KEYS: lastElementKeys, HIDDEN: hidden}};
                        webTestConfig['Test'].push(payload);
                        recordAction = true;
                    } else {
                        payload = {ClickElementByXPATH: {XPATH: lastElement}};
                        webTestConfig['Test'].push(payload);
                        recordAction = true;
                    }
        
                }
            }
    
            if (xpath == 'StopAllActions'){
                console.log('TestActions Length: ',webTestConfig['Test'].length)
                if (webTestConfig['Test'].length > 0){
                    lastActionKey = Object.keys(webTestConfig['Test'][webTestConfig['Test'].length - 1])[0];
                    
                    console.log('Last Action Type: ',lastActionKey);

                    if (lastActionKey != 'WaitForElementXPATH' || lastActionKey != 'Action') {
                        recordAction = false;
                    }
                }
            }
    
            if (debug){
                console.log(JSON.stringify(webTestConfig));
            }
    
            if (recordAction){
                chrome.storage.local.set({webTestConfig: JSON.stringify(webTestConfig)})
            }
    
            chrome.storage.local.set({lastElement: xpath, lastElementType: type})
        }
        
    })
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action){
        var action = request.action;
        if (action == 'updatePopup') {
            chrome.storage.local.get(['debug', 'loggedIn', 'recording', 'recordingComplete', 'testTitle', 'lastElement', 'lastElementType', 'uploadStatus'], (result) => {
                if (debug) {
                    console.log('Background Update Popup Recieved...');
                    console.log(result);
                }
                chrome.runtime.sendMessage({ action: 'updatePopup', payload: result });
            })
        }

        if (action == 'updateInspector') {
            chrome.storage.local.get(['debug', 'recording'], (result) => {
                chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                    id = tabs[0].id;
                    chrome.tabs.executeScript(id, { file: inspectFile }, () => { chrome.tabs.sendMessage(id, {action: 'updateInspector', payload: result}); });
                })
                if (debug) {
                    console.log('Update Inspector Call')
                    console.log(result);
                }
            })
        }

        if (action == 'recordScreenshot'){
            recordScreenshot();
        }

        if (action == 'recordWaitEvent'){
            recordWaitEvent(request.waitTimeout);
        }

        if (action == 'xpathCaptured') {
            xpath = request.xpath;
            xpathType = request.xpathType;
            lastElementKeys = request.lastElementKeys;
            hidden = request.hidden;

            if (debug) {
                console.log('XPATH Event Captured');
                console.log('XPath: '+xpath);
                console.log('XPathType: '+xpathType);
                console.log('lastElementKeys: '+lastElementKeys);
            }

            buildAction(xpath, xpathType, lastElementKeys, hidden);
        }

        if (action == 'stopRecording'){
            console.log('Stop Recording Call Issued');
            chrome.storage.local.set({recordingComplete: true})
            chrome.storage.local.get(['debug', 'loggedIn', 'recording', 'recordingComplete', 'testTitle', 'lastElement', 'lastElementType', 'uploadStatus'], (result) => {
                chrome.runtime.sendMessage({ action: 'updatePopup', payload: result });
            })
        }

        if (action == 'uploadRecording'){
            chrome.storage.local.get(['debug', 'webTestConfig', 'uid', 'bearer'], (result) => {
                var uid = result.uid;
                var bearer = result.bearer;
                var data = result.webTestConfig;

                if (uid && bearer) {
                    var xhttp = new XMLHttpRequest();
                    xhttp.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                            console.log('Successful Upload');
                        }
                    };
                    xhttp.open("POST", restAPI, true);
                    xhttp.setRequestHeader('Authorization', 'Bearer ' + bearer);
                    xhttp.setRequestHeader('Authentication', uid);
                    xhttp.send(data);
                }

            })

            var webTestConfig = {};
            webTestConfig['TestTitle'] = request.testTitle;
            webTestConfig['DefaultURL'] = {};
            webTestConfig['DefaultURL']['SS'] = true;
            webTestConfig['Browser'] = 'Chrome';
            webTestConfig['NumberOfTests'] = 1;
            webTestConfig['Test'] = {};
            webTestConfig['Test'] = [];
    
            chrome.storage.local.set({webTestConfig: JSON.stringify(webTestConfig), recordingComplete: false, recording: false, uploadStatus: 'Upload Successful'})
    
            if (debug) {
                console.log('Initial WebTestConfig: ',JSON.stringify(webTestConfig));
            }

            chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                id = tabs[0].id;
                chrome.tabs.executeScript(id, { file: inspectFile }, () => { chrome.tabs.sendMessage(id, {action: 'deactivate'}); });
            })

            chrome.browserAction.setIcon({path: 'icons/'+defaultIcon});

            chrome.storage.local.get(['debug', 'loggedIn', 'recording', 'recordingComplete', 'testTitle', 'lastElement', 'lastElementType', 'uploadStatus'], (result) => {
                chrome.runtime.sendMessage({ action: 'updatePopup', payload: result });
            })
        }

        if (action == 'uploadStatusReset'){
            chrome.storage.local.set({uploadStatus: false})
        }

        if (action == 'cancelRecording'){
            var webTestConfig = {};
            webTestConfig['TestTitle'] = request.testTitle;
            webTestConfig['DefaultURL'] = {};
            webTestConfig['DefaultURL']['SS'] = true;
            webTestConfig['Browser'] = 'Chrome';
            webTestConfig['NumberOfTests'] = 1;
            webTestConfig['Test'] = {};
            webTestConfig['Test'] = [];
    
            chrome.storage.local.set({webTestConfig: JSON.stringify(webTestConfig), recordingComplete: false, recording: false})
    
            if (debug) {
                console.log('Initial WebTestConfig: ',JSON.stringify(webTestConfig));
            }

            chrome.storage.local.get(['debug', 'loggedIn', 'recording', 'recordingComplete', 'testTitle', 'lastElement', 'lastElementType', 'uploadStatus'], (result) => {
                chrome.runtime.sendMessage({ action: 'updatePopup', payload: result });
            })

            chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                id = tabs[0].id;
                chrome.tabs.executeScript(id, { file: inspectFile }, () => { chrome.tabs.sendMessage(id, {action: 'deactivate'}); });
            })

            chrome.browserAction.setIcon({path: 'icons/'+defaultIcon});
        }

        if (action == 'loginSuccessful'){
            uid = request.uid;
            bearer = request.bearer;
            chrome.storage.local.set({loggedIn: true, uid: uid, bearer: bearer})
            console.log('Successful Login Attempt Made');
            console.log('UID: ',uid)
            chrome.storage.local.get(['debug', 'loggedIn', 'recording', 'recordingComplete', 'testTitle', 'lastElement', 'lastElementType', 'uploadStatus'], (result) => {
                chrome.runtime.sendMessage({ action: 'updatePopup', payload: result });
            })
        }
    }

    if (request.newIconPath) {
      chrome.browserAction.setIcon({
          path: request.newIconPath
      });
    };

    if (request.testTitle) {
        chrome.storage.local.set(request);

        var webTestConfig = {};
        webTestConfig['TestTitle'] = request.testTitle;
        webTestConfig['DefaultURL'] = {};
        webTestConfig['DefaultURL']['SS'] = true;
        webTestConfig['Browser'] = 'Chrome';
        webTestConfig['NumberOfTests'] = 1;
        webTestConfig['Test'] = {};
        webTestConfig['Test'] = [];

        chrome.storage.local.set({webTestConfig: JSON.stringify(webTestConfig)})

        if (debug) {
            console.log('Initial WebTestConfig: ',JSON.stringify(webTestConfig));
        }

        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            id = tabs[0].id;
            chrome.tabs.executeScript(id, { file: inspectFile }, () => { chrome.tabs.sendMessage(id, {action: 'getDefaultURL'}); });
        })
    }

    if (request.testURL) {
        chrome.storage.local.get(['webTestConfig'], (result) => {
            var webTestConfig = JSON.parse(result.webTestConfig);
            console.log('WebTestConfig: ',webTestConfig);
            webTestConfig['DefaultURL']['URL'] = request.testURL;
            chrome.storage.local.set({webTestConfig: JSON.stringify(webTestConfig)})
    
            if (debug) {
                console.log('WebTestConfig: ',webTestConfig);
            }
        });
    }

    if (request.recording == true) {
        chrome.storage.local.set(request);
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            id = tabs[0].id;
            chrome.tabs.executeScript(id, { file: inspectFile }, () => { chrome.tabs.sendMessage(id, {action: 'activate'}); });
        })
    } else if (request.recording == false) {
        chrome.storage.local.set({recording: false, recordingComplete: true});
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            id = tabs[0].id;
            chrome.tabs.executeScript(id, { file: inspectFile }, () => { chrome.tabs.sendMessage(id, {action: 'deactivate'}); });
        })
    }

    if (debug) {
        console.log("Request: ", request);
        console.log("Sender: ", sender);
        console.log("Send Response: ",sendResponse());
    }
  });