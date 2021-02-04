import StockService from "./StockService.js";
import RedditService from "./RedditService.js";
import ReportService from "./ReportService.js";
import Symbol from "./Symbol.js";
import Sentiment from "sentiment";
import fs from "fs-extra"

const sentiment = new Sentiment();
const redditService = new RedditService(JSON.parse(fs.readFileSync("config.json")));
const reportService = new ReportService();
const stockService = new StockService();

const extraSentimentValues = {
    extras: {
        "disruptive": 5,
        "moon": 10,
        "hold": 2,
        "rocket": 10,
        "aggressive": 5,
        "shoot": 6,
        "tendies": 7
    }
}

const statistics = {
    wordCount: 0,
    postCount: 0,
    tickerCount: 0,
    dateISO: ""
}

async function run() {
    stockService.initialize();
    const postData = stockService.getValidTickers(await redditService.collectData());
    statistics.postCount = postData.length;
    
    let symbols = {};
    for (const post of postData) {
        const titleSentiment = sentiment.analyze(post.text, extraSentimentValues);
        const contentSentiment = sentiment.analyze(post.content, extraSentimentValues);
        const sentimentScore = titleSentiment.score + contentSentiment.score;
        const posKeyWords = [...titleSentiment.positive, ...contentSentiment.positive];
        const negKeyWords = [...titleSentiment.negative, ...contentSentiment.negative];

        for (const ticker of post.tickers) {
            if (!symbols.hasOwnProperty(ticker)) {
                symbols[ticker] = new Symbol(ticker);
            }
            symbols[ticker].totalSentiment += sentimentScore;
            symbols[ticker].count += 1;
            symbols[ticker].averageSentiment = Math.round(symbols[ticker].totalSentiment / symbols[ticker].count);
            symbols[ticker].totalKarma += post.score;
            symbols[ticker].averageKarma = Math.round(symbols[ticker].totalKarma / symbols[ticker].count);
            symbols[ticker].posKeyWords = [...symbols[ticker].posKeyWords, ...posKeyWords];
            symbols[ticker].negKeyWords = [...symbols[ticker].negKeyWords, ...negKeyWords];
        }

        statistics.wordCount += post.text.length + post.content.length;
    }

    let symbolsList = [];
    for (const s of Object.keys(symbols)) {
        symbolsList.push(symbols[s]);
    }

    let date = new Date();
    statistics.dateISO = date.toISOString().slice(0, 10);
    statistics.tickerCount = Object.keys(symbols).length;

    reportService.createReport(symbolsList, statistics);
}

run();
