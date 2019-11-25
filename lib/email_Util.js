const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
function firstExecute(callback) {
    fs.readFile('credentials.json', (err, content) => {
        if (err) return callback('ERROR_SERVER', null);
        // Authorize a client with credentials, then call the Gmail API.
        authorize(JSON.parse(content), listLabels, function(error, result) {
            callback(error, result);
        });
    });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, callback_2) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, function(error, result) {
        callback_2(error, result);
    });
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth, callback) {
  // Only get the recent email - 'maxResults' parameter
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.messages.list(
    { auth: auth, userId: "me", maxResults: 30 },
    function(err, response) {
      if (err) {
        console.log("The API returned an error: " + err);
        return;
      }
      // Get the message id which we will need to retreive tha actual message next.
      //   var message_id = response['data']['messages'][0]['id'];
      let index = 0;
      let listEmail = [];
      let lengthListData = response["data"]["messages"].length;
      response["data"]["messages"].forEach(function(elem) {
        gmail.users.messages.get(
          { auth: auth, userId: "me", id: elem['id'] },
          function(err, response) {
            if (err) {
              callback('ERROR_SERVER', null);
              return;
            }
            // if(index === 0) console.log(response.data.payload.parts[0].headers);
            let objectEmail = {title: '', content: '', from: '', date: ''};
            response.data.payload.headers.forEach(function(elem) {
              if (elem.name.toLowerCase() === "subject") {
                // console.log(elem.value);
                objectEmail.title = elem.value;
              }
              if (elem.name.toLowerCase() === "from") {
                // console.log(elem.value);
                objectEmail.from = elem.value;
              }
              if (elem.name.toLowerCase() === "date") {
                // console.log(elem.value);
                objectEmail.date = elem.value;
              }
            });
            if(response.data.payload.parts && response.data.payload.parts[0]) {
              message_raw = response.data.payload.parts[0].body.data;
              // console.log('response.data: ', response.data);
              data = message_raw;
              buff = new Buffer(data, "base64");
              text = buff.toString();
              objectEmail.content = text;
              listEmail.push(objectEmail)
            }
            index++;
            if(index === lengthListData) {
                callback(null, listEmail);
            }
          }
        );
      });
      // Retreive the actual message using the message id
    }
  );
  //   const gmail = google.gmail({version: 'v1', auth});
  //   gmail.users.messages.get({ userId: 'me', id: '16d25e606dc72354' },{format:'raw'}, (err, res) => {
  //     if (err) return console.log("error:" + err);
  //     console.log(res.data.payload);
  //   });
  //   gmail.users.labels.list({
  //     userId: 'me',
  //   }, (err, res) => {
  //     if (err) return console.log('The API returned an error: ' + err);
  //     const labels = res.data.labels;
  //     if (labels.length) {
  //       console.log('Labels:');
  //       labels.forEach((label) => {
  //         console.log(`- ${label.name}`);
  //       });
  //       console.log(res.data);
  //     } else {
  //       console.log('No labels found.');
  //     }
  //   });
}
module.exports = firstExecute;