'use strict';

require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const mongoClient = require('mongodb').MongoClient;
const moment = require('moment');

const PORT = process.env.PORT || 3000;
const mongoUrl = 'mongodb://localhost:27017/db';
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
  Promise.all([
    getName(client, userId),
    getWeather()
  ])
    .then(parts => {
      req.body.events[0].source.userName = parts[0];
      req.body.events[0].weather = parts[1];
      return Promise.all(req.body.events.map(handleEvent));
    })
    .then(result => res.json(result));
});

app.listen(PORT);
console.log(`Server running at ${PORT}`);

// UserIDからユーザー名を取得
const getName = (client, userId) => {
  return new Promise((resolve, reject) => {
    client.getProfile(userId)
    .then(profile => resolve(profile.displayName));
  });
};

///// weather.js /////
// OpenWeatherMap APIで気象情報を取得
const getWeather = () => {
  return new Promise((resolve, reject) => {
    require('./weather').initialize((err, weather) => {
      if (err) { reject(err) };
      resolve(weather);
    });
  });
};

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

        const ID = event.source.userId,
              name = event.source.userName,
              sentense = event.message.text,
              weather = event.weather,
              date = moment(event.timestamp),
              year = date.format("YYYY"),
              month = date.format('MM'),
              day = date.format('DD'),
              time = date.format('HH:mm');
              
        // tmp
        const docs = [{ ID, name, year, month, day, time, weather, sentense }];
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