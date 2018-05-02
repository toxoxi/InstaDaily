'use strict';

require('dotenv').config();
const http = require('http');
// Todo => Flexibly change location
const location = 'Tokyo, jp';
const units = 'metric';
const APIKEY = process.env.NODE_WEATHER_KEY;
const URL = `http://api.openweathermap.org/data/2.5/weather?q=${location}&units=${units}&appid=${APIKEY}`;

module.exports = {
  initialize: callback => {
    http.get(URL, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', chunk => {
        res = JSON.parse(body);
        console.log(res);
        const weather = res.weather[0].main;
        callback(null, weather);
      });
    }).on('error', e => {
      console.log(e.message);
    });
  }
}
