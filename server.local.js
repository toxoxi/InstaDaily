'use strict';

require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const mongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const moment = require('moment');

const PORT = process.env.PORT || 3000;
const mongoUrl = 'mongodb://localhost:27017/db';
const ACCESS_TOKEN = process.env.NODE_ACCESS_TOKEN;
const SECRET = process.env.NODE_SECRET;

const config = {
    channelAccessToken: ACCESS_TOKEN,
    channelSecret: SECRET
};

const Schema = mongoose.Schema;
const LogSchema = new Schema({
  ID: String,
  name: String,
  date: { type: Date, default: Date.now },
  weather: String,
  sentense: String
});

// スキーマからモデルの作成
mongoose.model('Log', LogSchema);

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
    mongoose.connect(mongoUrl);

    const Log = mongoose.model('Log');
    const log = new Log();

    const ID = event.source.userId,
          name = event.source.userName,
          sentense = event.message.text,
          weather = event.weather,
          date = event.timestamp,
          time = [];

    log.ID = event.source.userId;
    log.name = event.source.userName;
    log.sentense = event.message.text;
    log.weather = event.weather;
    log.date = event.timestamp;
    log.save(err => {
      if (err) { console.error(err); }
      Log.find({}, function(err, docs) {
        console.log(docs);
      });
    });

    resolve();
  });
};