'use strict';

require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const mongoClient = require('mongodb').MongoClient;

const PORT = process.env.PORT || 3000;
const mongoUrl = `mongodb://localhost:27017/db`;
const ACCESS_TOKEN = process.env.NODE_ACCESS_TOKEN;
const SECRET = process.env.NODE_SECRET;

const config = {
    channelAccessToken: ACCESS_TOKEN,
    channelSecret: SECRET
};

const app = express();
const client = new line.Client(config);

app.post('/webhook', line.middleware(config), (req, res) => {
    console.log(req.body.events);
    const userId = req.body.events[0].source.userId;
    client.getProfile(userId)
      .then(profile => {
        req.body.events[0].source.userName = profile.displayName;
        return;
      })
      .then(() => {
        return Promise.all(req.body.events.map(handleEvent));
      })
      .then(result => res.json(result));
});

const handleEvent = event => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  // DB登録処理
  storeData(event)
    .then(res => {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: event.message.text //実際に返信の言葉を入れる箇所
      });
    });
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);

const storeData = event => {
  return new Promise((resolve, reject) => {
    mongoClient.connect(mongoUrl, (err, client) => {
      console.log('connected')
      // エラー処理
      if (err) { 
        console.error(err);
        reject(err);
      }
      const db = client.db('InstaDaily');
      db.collection('data', (err, collection) => {
        if (err) { return console.error(err); }

        const userId = event.source.userId;
        const userName = event.source.userName;
        const sentense = event.message.text;
        // tmp
        const docs = [
          {
            ID: userId,
            name: userName,
            diary: {
              2018: {
                'May': [
                  {
                    date: 2,
                    content: sentense, 
                    weather: 'sunny'
                  }
                ]
              }
            }
          }
        ];
        collection.insert(docs, (err, result) => {
          // エラー処理
          if (err) { return console.dir(err); }
        });

        // 検索する
        collection.find().toArray((err, items) => {
          console.log(items);
        });
        resolve();
      });
    });
  });
};