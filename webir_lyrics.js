console.log("Webir bot starting.");

const twitterUsername = '@gonzalosilvaa15';

//making sure npm run develop works
if (process.env.NODE_ENV === "develop") {
  require("dotenv").config();
};


// Create a Twitter client object to connect to the Twitter API
var Twit = require('twit');

// Pulling keys from another file
var config = require('./config.js');
// Making a Twit object for connection to the API
var T = new Twit(config);

// Setting up a user stream
var stream = T.stream('statuses/filter', { track: twitterUsername });

// Now looking for Tweet events
// See: https://dev.Twitter.com/streaming/userstreams
stream.on('tweet', pressStart);


function pressStart(tweet) {

    var id = tweet.id_str;
    var text = tweet.text;
    var name = tweet.user.screen_name;
  
    let regex = /(please)/gi;
  
  
    let playerOne = text.match(regex) || [];
    let playerTwo = playerOne.length > 0;
  
    //this helps with errors, so you can see if the regex matched and if playerTwo is true or false
    console.log(playerOne);
    console.log(playerTwo);
  
  
    // checks text of tweet for mention of SNESSoundtracks
    if (text.includes(twitterUsername) && playerTwo === true) {
  
      var replyText = ("@" + name + " This is a test ");
  
      // Post that tweet
      T.post('statuses/update', { status: replyText, in_reply_to_status_id: id }, gameOver);
  
    } else {
      console.log("uh-uh-uh, they didn't say the magic word.");
    };
  
    function gameOver(err, reply) {
      if (err) {
        console.log(err.message);
        console.log("Game Over");
      } else {
        console.log('Tweeted: ' + reply.text);
      }
    };
  }