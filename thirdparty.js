var debug = false;
const activeIcon = 'active-96.png';
const defaultIcon = 'default-96.png';
const userPoolID = 'us-east-1_SFZNXOSX3'
const clientID = '5vr513rek12l287if88cvv5q0g'
var currentIcon = defaultIcon;

var loggedIn = false;
var recording = false;
var recordingComplete = false;
var uploadStatus = false;

window.onload = () => {
    console.log('Window OnLoad called');
    chrome.runtime.sendMessage({action: 'updatePopup'});
}

document.onload = () => {
    console.log('Document OnLoad called');
    chrome.runtime.sendMessage({action: 'updatePopup'});
}

function toggleRecord() {
    console.log('ToggleRecord: '+recording);
    toggleActivate();
}

function stopRecord() {
    if (debug) {
        console.log('Stop Recording Call Issued');
    }

    chrome.runtime.sendMessage({action: 'stopRecording'});
}

function uploadConfig() {
    chrome.runtime.sendMessage({action: 'uploadRecording'});
}

function cancelUploadConfig() {  
    if (debug) {
        console.log('Recording Canceled');
    } 
    chrome.runtime.sendMessage({action: 'cancelRecording'});
}

function updateHandler(result){
    debug = result.debug;
    uploadStatus = result.uploadStatus

    var configMes = document.getElementById('conf_message');

    if (debug) {
        console.log('UpdateHandler Called')
        console.log(result);
    }

    loggedIn = result.loggedIn;
    recordingComplete = result.recordingComplete;

    if (uploadStatus) {
        configMes.innerText = uploadStatus;

        chrome.runtime.sendMessage({action: 'uploadStatusReset'});
    } else {
        configMes.innerText = '';
    }

    if (recordingComplete) {
        document_content = document.getElementById('JstVerifyContent');
        document_content.innerHTML = "";

        const UploadButton          = document.createElement('button');
        UploadButton.id             = 'JstVerifyUploadButton';
        UploadButton.textContent    = 'Upload';
        UploadButton.className      = 'loginbtn btn btn-pr';

        const CancelUploadButton          = document.createElement('button');
        CancelUploadButton.id             = 'JstVerifyCancelUploadButton';
        CancelUploadButton.textContent    = 'Cancel';
        CancelUploadButton.className      = 'loginbtn btn btn-pr';

        document_content.append(UploadButton);
        document_content.append(CancelUploadButton);

        UploadButton.addEventListener("click", () => uploadConfig());
        CancelUploadButton.addEventListener("click", () => cancelUploadConfig());

    } else if (loggedIn){
        document_content = document.getElementById('JstVerifyContent');
        document_content.innerHTML = "";
        recording = result.recording;
        lastXPATHElement = result.lastElement

        if (debug) {
            console.log('OnLoad Recording: '+recording);
        }

        if (recording == true){
            recordButtonText = 'Stop';
        } else {
            recordButtonText = 'Record';
        }
    
        const recordButton          = document.createElement('button');
        recordButton.id             = 'JstVerifyRecordSubmit';
        recordButton.textContent    = recordButtonText;
        recordButton.className      = 'loginbtn btn btn-pr'

        if (result.testTitle && recording == true) {
            if (debug) {
                console.log('Test Title: '+result.testTitle);
            }
            var titleInput = document.createElement('div');
            titleInput.id = 'JstVerify_TestTitle';
            titleInput.innerText = result.testTitle;
        } else {
            var titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.id   = 'JstVerify_TestTitle';
            titleInput.placeholder = 'Test Title';
            if (result.testTitle) {
                titleInput.innerText = result.testTitle;
            }
        }

        // Start Element Controls 

        var lastElement = document.createElement('div');
        lastElement.id = 'JstVerify_lastElement';
        lastElement.innerText = lastXPATHElement;

        var lastElementControl = document.createElement('div');
        lastElementControl.id = 'JstVerify_lastElementControl';
        lastElementControl.innerText = '';

        var divRow = document.createElement('div');
        divRow.class = 'row';

        var divCol = document.createElement('div');
        divCol.class = 'col';

        var waitInput = document.createElement('input');
        waitInput.id = 'JstVerifyWaitTimeout'
        waitInput.value = '3';

        divRow.append(waitInput);

        const waitButton          = document.createElement('button');
        waitButton.id             = 'JstVerifyWaitButton';
        waitButton.textContent    = 'Wait for last element';
        waitButton.className      = 'loginbtn btn btn-pr';

        divRow.append(waitButton);

        lastElementControl.append(divRow);

        const ScreenshotButton          = document.createElement('button');
        ScreenshotButton.id             = 'JstVerifyScreenshotButton';
        ScreenshotButton.textContent    = 'Take Screenshot';
        ScreenshotButton.className      = 'loginbtn btn btn-pr';

        lastElementControl.append(ScreenshotButton);

        // End Element Controls

        document_content.append(titleInput);

        if (recording == true && lastXPATHElement) {
            document_content.append(lastElement);
            document_content.append(lastElementControl);
            waitButton.addEventListener("click", () => recordWaitEvent());
            ScreenshotButton.addEventListener("click", () => recordScreenshotEvent());
        }

        document_content.append(recordButton);
        if (recording == true) {
            recordButton.addEventListener("click", () => stopRecord());
        } else {
            recordButton.addEventListener("click", () => toggleRecord());
        }

    } else {
        loginSubmit = document.getElementById('login_submit');
        loginSubmit.addEventListener("click", () => validate());
    }
}

function toggleActivate() {
    if (recording == false){
        var errorP = document.getElementById('JstVerifyError');

        var testTitle = document.getElementById('JstVerify_TestTitle');
        console.log(testTitle.value);

        if (testTitle.value) {
            chrome.runtime.sendMessage({ "newIconPath" : 'icons/'+activeIcon , recording: true, testTitle: testTitle.value});

            errorP.innerHTML = ""

            document_content = document.getElementById('JstVerifyContent');
            document_content.innerHTML = "";

            var titleInput = document.createElement('div');
            titleInput.id = 'JstVerify_TestTitle';
            titleInput.innerText = testTitle.value;

            const recordButton          = document.createElement('button');
            recordButton.id             = 'JstVerifyRecordSubmit';
            recordButton.textContent    = 'Stop';
            recordButton.className      = 'loginbtn btn btn-pr';

            document_content.append(titleInput);
            document_content.append(recordButton);

            recordButton.addEventListener("click", () => stopRecord());

            currentIcon = activeIcon;
            recording = true;
        } else {
            errorP.innerHTML = "Provide Test Name";
        }

    } else if (recordingComplete) {
        document_content = document.getElementById('JstVerifyContent');
        document_content.innerHTML = "";

        const UploadButton          = document.createElement('button');
        UploadButton.id             = 'JstVerifyUploadButton';
        UploadButton.textContent    = 'Upload';
        UploadButton.className      = 'loginbtn btn btn-pr';

        const CancelUploadButton          = document.createElement('button');
        CancelUploadButton.id             = 'JstVerifyCancelUploadButton';
        CancelUploadButton.textContent    = 'Cancel';
        CancelUploadButton.className      = 'loginbtn btn btn-pr';

        document_content.append(UploadButton);
        document_content.append(CancelUploadButton);

        UploadButton.addEventListener("click", () => uploadConfig());
        CancelUploadButton.addEventListener("click", () => cancelUploadConfig());

    } else {
        chrome.runtime.sendMessage({ "newIconPath" : 'icons/'+defaultIcon , recording: false});

        document_content = document.getElementById('JstVerifyContent');
        var testTitle = document.getElementById('JstVerify_TestTitle');
        document_content.innerHTML = "";
        
        const recordButton          = document.createElement('button');
        recordButton.id             = 'JstVerifyRecordSubmit';
        recordButton.textContent    = 'Record';
        recordButton.className      = 'loginbtn btn btn-pr'

        var titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.id   = 'JstVerify_TestTitle';
        titleInput.placeholder = 'Test Title';

        if (testTitle.value) {
            titleInput.innerText = testTitle.value;
        }

        document_content.append(titleInput);
        document_content.append(recordButton);
        recordButton.addEventListener("click", () => toggleRecord());

        currentIcon = defaultIcon;
        recording = false;
    }

    console.log('Toggle Activate - Recording: '+recording);
}

function recordScreenshotEvent() {
    messageDiv = document.getElementById('conf_message');
    messageDiv.innerText = 'Screenshot Action Added';
    chrome.runtime.sendMessage({action: 'recordScreenshot'});
}

function recordWaitEvent() {
    messageDiv = document.getElementById('conf_message');
    messageDiv.innerText = 'Wait Event Added';

    waitTimeout = document.getElementById('JstVerifyWaitTimeout');
    console.log('Wait Timeout: '+waitTimeout.value)

    chrome.runtime.sendMessage({action: 'recordWaitEvent', waitTimeout: waitTimeout.value});
}

function recordingState() {
    console.log('Recording State: '+recording);
}

function updateState() {
    chrome.storage.local.get(['loggedIn', 'recording'], (result) => {
        loggedIn = result.loggedIn;
        recording = result.recording;
        if (debug) {
            recordingState();
        }
    })
}

function validate() {
    var username = document.getElementById("email_login").value.toUpperCase();
    var password = document.getElementById("psw_login").value;
    user_email = username;
    document.getElementById("login_submit").innerHTML = "<i class='fa fa-spinner fa-spin '></i> Loading";
    document.getElementById('login_submit').removeAttribute("onclick");
    if (password == "") {
        document.getElementById("error").innerHTML = "Please Enter a password";
        document.getElementById("login_submit").setAttribute('onclick', 'validate()')
        document.getElementById("login_submit").innerHTML = "Log in";
        return false;
    }
    if (my_validate(username, "email") == false || username == "") {
        document.getElementById("error").innerHTML = "Please Enter a valid email";
        document.getElementById("login_submit").setAttribute('onclick', 'validate()')
        document.getElementById("login_submit").innerHTML = "Log in";
        return false;
    }
    try {
        var poolData = {
            UserPoolId: userPoolID,
            ClientId: clientID
        };
        var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        var userData = {
            Username: username,
            Pool: userPool
        };

        cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        var authenticationData = {
            Username: username,
            Password: password,
        };

        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {


                var accessToken = result.getIdToken().getJwtToken();
                //var sub = result.getIdToken().getClaim("sub")
                /* Use the idToken for Logins Map when Federating User Pools with identity pools or when passing through an Authorization Header to an API Gateway Authorizer*/
                var idToken = result.idToken.jwtToken;
                var tokens = accessToken.split(".");

                var cognitoUser = userPool.getCurrentUser();

                if (cognitoUser != null) {
                    cognitoUser.getSession(function(err, result) {
                        if (result) {
                            var debug_replace_func = 1;
                            cognitoUser.getUserAttributes(function(err, attributes) {
                                if (err) {
                                    console.log(err)
                                } else {
                                    var debug_replace_func = 1
                                }
                            });
                            auth_token = result.getIdToken().getJwtToken();
                            var tokens = auth_token.split(".");
                            cuid = JSON.parse(atob(tokens[1])).sub
                        }
        
                    });

                    chrome.runtime.sendMessage({action: 'loginSuccessful', uid: cuid, bearer: auth_token});
                }
            },

            onFailure: function(err) {
                var errorP = document.getElementById('JstVerifyError');
                errorP.innerText = "Login Failed"
            },
            mfaRequired: function(codeDeliveryDetails) {
                var verificationCode = prompt('Please input verification code', '');
                cognitoUser.sendMFACode(verificationCode, this);
            }
        });
    } catch (err) {
        document.getElementById("login_submit").innerHTML = "Log in";
        var errorP = document.getElementById('JstVerifyError');
        var new_err = error_parser(err.name)
        console.error(err);
        errorP.empty();
        if (err.name == "UserNotConfirmedException") {
            errorP.innerText = "You must confirm your registration";
        } else {
            errorP.innerHTML = new_err;
        }
    }
}

function my_validate(data, type) {
    var valid_flag = new Boolean(false);
    if (type == "name_string") {

        if (data.match(/^[a-zA-Z ]+$/)) {

            valid_flag = true
        }
    }
    if (type == "email") {
        if (data.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {

            valid_flag = true
        }
    }
    if (type == "int") {

        if (data.match(/^[0-9]+$/)) {

            valid_flag = true
        }
    }
    return valid_flag
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.action) {
          const action = request.action;
          console.log('Action: ', action);
          if (action == 'updateState') {
              updateState();
              console.log('Updating State: '+action);
          }
          if (action == 'updatePopup') {
              updateHandler(request.payload);
          }
      };
    });
