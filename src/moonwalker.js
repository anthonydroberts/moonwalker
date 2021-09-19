import StockService from "./StockService.js";
import RedditService from "./RedditService.js";
import ReportService from "./ReportService.js";
import Symbol from "./Symbol.js";
import Sentiment from "sentiment";
import { performance } from "perf_hooks";
import minimist from "minimist";

const sentiment = new Sentiment();
const redditService = new RedditService();
const reportService = new ReportService();
const stockService = new StockService();

const parsedArgs = minimist((process.argv.slice(2)));
const opts = {
    chunks: (parsedArgs.chunks) ? parsedArgs.chunks : 10,
    email: (parsedArgs.email) ? true : false
}

const SUBREDDITS_TO_SCRAPE = [
    "stocks",
    "wallStreetBets",
    "investing",
    "Baystreetbets",
    "Superstonk"
];

const extraSentimentValues = {
    extras: {
        "disruptive": 500,
        "moon": 600,
        "hold": 200,
        "rocket": 300,
        "aggressive": 50,
        "shoot": 100,
        "tendies": 100,
        "huge": 100,
        "🚀": 300,
        "🔥": 250,
        "🌙": 250
    }
}

const statistics = {
    wordCount: 0,
    postCount: 0,
    tickerCount: 0,
    timeStart: 0,
    timeEnd: 0,
    timeElapsedSeconds: 0,
    numberOfSubs: SUBREDDITS_TO_SCRAPE.length,
    dateISO: ""
}

async function run() {
    statistics.timeStart = performance.now();
    await stockService.initialize();
    const postData = stockService.getValidTickers(await redditService.collectData(SUBREDDITS_TO_SCRAPE, opts.chunks));
    
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

        statistics.wordCount += post.text.split(' ').length + post.content.split(' ').length;
    }

    let symbolsList = [];
    for (const s of Object.keys(symbols)) {
        symbolsList.push(symbols[s]);
    }

    let date = new Date();
    statistics.dateISO = date.toISOString().slice(0, 10);
    statistics.tickerCount = Object.keys(symbols).length;
    statistics.postCount = postData.length;
    statistics.timeEnd = performance.now();
    statistics.timeElapsedSeconds = Math.round((statistics.timeEnd - statistics.timeStart) / 1000);

    console.log(`Time elapsed: ${statistics.timeElapsedSeconds} seconds`);
    reportService.createReport(symbolsList, postData, statistics, opts.email);
}

run();
