const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config();
var config = require("./config.js");
const needle = require("needle");
const { findSong } = require("./find_song_es.js");

const client = new TwitterApi({
  appKey: config.consumer_key,
  appSecret: config.consumer_secret,
  accessToken: config.access_token,
  accessSecret: config.access_token_secret,
});

const token = config.bearer_token;
const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
const streamURL = "https://api.twitter.com/2/tweets/search/stream";
const rules = [
  {
    value: "@webirbot",
    tag: "mentions",
  },
];

(async () => {
  let currentRules;

  try {
    // Gets the complete list of rules currently applied to the stream
    currentRules = await getAllRules();

    // Delete all rules. Comment the line below if you want to keep your existing rules.
    await deleteAllRules(currentRules);

    // Add rules to the stream. Comment the line below if you don't want to add new rules.
    await setRules();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  // Listen to the stream.
  streamConnect(0);
})();

async function getAllRules() {
  const response = await needle("get", rulesURL, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (response.statusCode !== 200) {
    console.log("Error:", response.statusMessage, response.statusCode);
    throw new Error(response.body);
  }

  return response.body;
}

async function deleteAllRules(rules) {
  if (!Array.isArray(rules.data)) {
    return null;
  }

  const ids = rules.data.map((rule) => rule.id);

  const data = {
    delete: {
      ids: ids,
    },
  };

  const response = await needle("post", rulesURL, data, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(response.body);
  }

  return response.body;
}

async function setRules() {
  const data = {
    add: rules,
  };

  const response = await needle("post", rulesURL, data, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(response.body);
  }

  return response.body;
}

function streamConnect(retryAttempt) {
  const stream = needle.get(streamURL, {
    headers: {
      "User-Agent": "v2FilterStreamJS",
      Authorization: `Bearer ${token}`,
    },
    timeout: 2000,
  });

  stream
    .on("data", async (data) => {
      try {
        const json = JSON.parse(data);
        console.log(json);
        const song = await findSong(json.data.text);
        console.log("a");
        console.log({ song });
        //Post tweet reply
        let tweetId = json.data.id;
        console.log({ tweetId });
        if (!json.data.text.includes("The song you are looking"))
          tweet(tweetId, parseText(song));
        // A successful connection resets retry count.
        retryAttempt = 0;
      } catch (e) {
        if (
          data.detail ===
          "This stream is currently at the maximum allowed connection limit."
        ) {
          console.log(data.detail);
          process.exit(1);
        } else {
          // Keep alive signal received. Do nothing.
        }
      }
    })
    .on("err", (error) => {
      if (error.code !== "ECONNRESET") {
        console.log(error.code);
        process.exit(1);
      } else {
        // This reconnection logic will attempt to reconnect when a disconnection is detected.
        // To avoid rate limits, this logic implements exponential backoff, so the wait time
        // will increase if the client cannot reconnect to the stream.
        setTimeout(() => {
          console.warn("A connection error occurred. Reconnecting...");
          streamConnect(++retryAttempt);
        }, 2 ** retryAttempt);
      }
    });

  return stream;
}

const parseText = (song) => {
  return `The song you are looking for is: ${song.title} (${song.author})`;
};

const tweet = async (replyId, tweetText) => {
  try {
    console.log({ replyId, tweetText });
    if (!!replyId) await client.v2.reply(tweetText, replyId);
    else await client.v1.tweet("Hey man");
  } catch (err) {
    console.log(err);
  }
};
