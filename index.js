// externals
const express = require("express");
const ejs = require("ejs");
const request = require("request");
const bodyParser = require("body-parser");
const path = require("path");

// express internals
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// env & keys
const PORT = 3000;
const API = "SQW997AP75FHVCTS";

// test route
app.get("/", (req, res) => {
  res.render("index", { data: PORT });
});

// search stocks by name search
app.get("/equities", async (req, res) => {
  const search = req.query.search;
  console.log(search);
  const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${search}&apikey=${API}`;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var rawData = JSON.parse(body);
      var data = rawData.bestMatches;
      console.log(data[0]["1. symbol"]);
      res.render("equityResults", { data: data, search: req.query.search });
    }
  });
});

// get stocks info
app.get("/equities/:symbol", async (req, res) => {
  const search = req.params.symbol;
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${search}&apikey=${API}`;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var rawData = JSON.parse(body);
      // converting to object values so we can parse info
      const returns = Object.values(rawData["Time Series (Daily)"]);
      const info = Object.values(rawData["Meta Data"]);
      var avgPrice = 0;
      var avgFloat = 0;
      // for highest/lowest calcs
      var lowest = Number.POSITIVE_INFINITY;
      var highest = Number.NEGATIVE_INFINITY;
      var tmp;
      // calculating key metrics (avg price, avg float & curr. deviation from both)
      for (let i = 0; i < returns.length; i++) {
        var priceInt = parseInt(returns[i]["5. adjusted close"]);
        avgPrice += priceInt;
        var floatInt = parseInt(returns[i]["6. volume"]);
        avgFloat += floatInt;
      }
      priceAvg = Math.floor(avgPrice / returns.length);
      floatAvg = Math.floor(avgFloat / returns.length);
      for (var i = returns.length - 1; i >= 0; i--) {
        tmp = returns[i]["5. adjusted close"];
        if (tmp < lowest) lowest = tmp;
        if (tmp > highest) highest = tmp;
        lowest = Math.floor(lowest);
        highest = Math.floor(highest);
      }
      var priceDev = Math.floor(returns[0]["5. adjusted close"] - priceAvg);
      var floatDev = Math.floor(returns[0]["6. volume"] - floatAvg);

      // data to send
      // info (general stock info)
      // priceAvg
      // floatAvg
      // priceDev
      // floatDev
      // highest
      // lowest
      const quickData = {
        priceAvg,
        floatAvg,
        priceDev,
        floatDev,
        highest,
        lowest,
      };
      res.render("equityReturn", {
        data: returns,
        quickData: quickData,
        info: info,
      });
    }
  });
});

// get forex info
app.get("/forex", async (req, res) => {
  const search1 = req.query.forex1;
  const search2 = req.query.forex2;
  console.log(search1);
  console.log(search2);
  const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${search1}&to_symbol=${search2}&apikey=${API}`;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var rawData = JSON.parse(body);
      // converting to object values so we can parse info
      const returns = Object.values(rawData["Time Series FX (Daily)"]);
      const info = Object.values(rawData["Meta Data"]);

      // for comparison calcs
      var avgHigh = 0;
      var avgLow = 0;

      // for highest/lowest calcs
      var lowest = Number.POSITIVE_INFINITY;
      var highest = Number.NEGATIVE_INFINITY;
      var tmp;
      for (let i = 0; i < returns.length; i++) {
        var high = parseInt(returns[i]["2. high"]);
        avgHigh += high;
        var low = parseInt(returns[i]["3. low"]);
        avgLow += low;
      }
      avgHigh = avgHigh / returns.length;
      avgLow = avgLow / returns.length;
      for (var i = returns.length - 1; i >= 0; i--) {
        tmp = returns[i]["4. close"];
        if (tmp < lowest) lowest = tmp;
        if (tmp > highest) highest = tmp;
        lowest = lowest;
        highest = highest;
      }
      // curr rate
      var curRate = returns[0]["4. close"];
      const quickData = {
        curRate,
        avgHigh,
        avgLow,
        lowest,
        highest,
        search1,
        search2,
      };
      res.render("forexReturn", {
        data: returns,
        quickData: quickData,
        info: info,
      });
    }
  });
});

app.get("/crypto", async (req, res) => {
  const crypto = req.query.crypto;
  const exchange = req.query.exchange;
  console.log(crypto);
  console.log(exchange);
  const url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${crypto}&market=${exchange}&apikey=${API}`;
  request(url, function (error, response, body) {
    if (!error & (response.statusCode == 200)) {
      var rawData = JSON.parse(body);
      const returns = Object.values(
        rawData["Time Series (Digital Currency Daily)"]
      );
      const info = Object.values(rawData["Meta Data"]);
      // for comparison calcs
      var avgClose = 0;
      var avgVolume = 0;
      var avgMktCap = 0;

      // for highest/lowest calcs
      var lowest = Number.POSITIVE_INFINITY;
      var highest = Number.NEGATIVE_INFINITY;
      var tmp;
      for (let i = 0; i < returns.length; i++) {
        var close = parseInt(returns[i]["4b. close (USD)"]);
        avgClose += close;
        var volume = parseInt(returns[i]["5. volume"]);
        avgVolume += volume;
        var cap = parseInt(returns[i]["6. market cap (USD)"]);
      }
      avgClose = avgClose / returns.length;
      avgVolume = avgVolume / returns.length;
      avgMktCap = avgMktCap / returns.length;
      for (var i = returns.length - 1; i >= 0; i--) {
        tmp = returns[i]["4b. close (USD)"];
        if (tmp < lowest) lowest = tmp;
        if (tmp > highest) highest = tmp;
        lowest = lowest;
        highest = highest;
      }
      var curClose = returns[0]["4b. close (USD)"];
      const quickData = {
        avgClose,
        avgVolume,
        avgMktCap,
        lowest,
        highest,
        curClose,
      };
      res.render("cryptoReturn", {
        data: returns,
        quickData: quickData,
        info: info,
      });
    }
  });
});

// run server
app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});
