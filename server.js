'use strict';

require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.NODE_ACCESS_TOKEN;
const SECRET = process.env.NODE_SECRET;

const config = {
    channelAccessToken: ACCESS_TOKEN,
    channelSecret: SECRET
};

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
    console.log(req.body.events);
    Promise
      .all(req.body.events.map(handleEvent))
      .then(result => res.json(result));
});

const client = new line.Client(config);

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: event.message.text //実際に返信の言葉を入れる箇所
  });
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);