// Open a realtime stream of Tweets, filtered according to rules
// https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/quick-start

const needle = require("needle");
require("dotenv").config();
const compendium = require("compendium-js");
const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
var SpellChecker = require("simple-spellchecker");
const { Server } = require("socket.io");
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const token = process.env.BEARER_TOKEN;
const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
const streamURL = "https://api.twitter.com/2/tweets/search/stream";
let globalTag = "";
let sentimentArray = [];
// this sets up two rules - the value is the search terms to match on, and the tag is an identifier that
// will be applied to the Tweets return to show which rule they matched
// with a standard project with Basic Access, you can add up to 25 concurrent rules to your stream, and
// each rule can be up to 512 characters long

// Edit rules as desired below

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

async function setRules(rules) {
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

function streamConnect(retryAttempt, socket) {
  const stream = needle.get(streamURL, {
    headers: {
      "User-Agent": "v2FilterStreamJS",
      Authorization: `Bearer ${token}`,
    },
    timeout: 20000,
  });

  stream
    .on("data", async (data) => {
      //check each word for spelling, if it is misspelled, add it to the array

      try {
        const json = JSON.parse(data);
        const wordcheck = new Promise((resolve, reject) => {
          let misspelled = [];
          let handles = [];
          let hashtags = [];
          SpellChecker.getDictionary("en-US", async function (err, dictionary) {
            if (err) {
              console.log(err);
            }
            const words = json.data.text.split(" ");
            await words.forEach((word) => {
              //remove any new line characters
              word = word.replace(/(\r\n|\n|\r)/gm, "");
              //remove any punctuation
              word = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

              if (dictionary.spellCheck(word) === false) {
                //make sure it is not a handle or hashtag or link
                if (
                  word[0] !== "@" &&
                  word[0] !== "#" &&
                  word.includes("http") === false
                ) {
                  misspelled.push(word);
                }
                if (word[0] === "@") {
                  handles.push(word);
                }
                if (word[0] === "#") {
                  hashtags.push(word);
                }
              }
            });
            resolve({ misspelled, handles, hashtags });
          });
        });

        const sentiment = compendium.analyse(json.data.text)[0].profile
          .sentiment;
        if (sentiment !== 0) {
          console.log(sentiment);
          sentimentArray.push(
            compendium.analyse(json.data.text)[0].profile.sentiment
          );
        }
        const { misspelled, handles, hashtags } = await wordcheck;
        console.log("-----------------");
        console.log("Tweet:", json.data.text);
        console.log("Sentiment:,", sentiment);
        console.log(globalTag);
        console.log(
          "Average Sentiment:",
          sentimentArray.reduce((a, b) => a + b, 0) / sentimentArray.length
        );
        console.log("Misspelled Words:", misspelled);
        console.log("Handles:", handles);
        console.log("Hashtags:", hashtags);
        console.log("-----------------");
        io.emit("output", {
          tag: globalTag,
          message: json.data.text,
          sentiment: sentiment,
          averageSentiment:
            sentimentArray.reduce((a, b) => a + b, 0) / sentimentArray.length,
          misspelled: misspelled,
          handles: handles,
          hashtags: hashtags,
        });
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

io.on("connection", async (socket) => {
  console.log("a user connected");
  io.emit("connection", "connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
    io.emit("connection", "disconnect");
    process.exit(1);
  });
  socket.on("param", async (param) => {
    console.log(param);
    globalTag = param.rule;
    const rules = [
      {
        value: `#${param.rule} -is:retweet lang:en`,
        tag: "main",
      },
    ];
    let currentRules;

    try {
      // Gets the complete list of rules currently applied to the stream
      currentRules = await getAllRules();

      // Delete all rules. Comment the line below if you want to keep your existing rules.
      await deleteAllRules(currentRules);

      // Add rules to the stream. Comment the line below if you don't want to add new rules.
      await setRules(rules);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }

    // Listen to the stream.
    streamConnect(0);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
