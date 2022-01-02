import StockService from "./StockService.js";
import RedditService from "./RedditService.js";
import ReportService from "./ReportService.js";
import Symbol from "./Symbol.js";
import Statistics from "./Statistics.js";
import { DEFAULT_SUBREDDITS, DEFAULT_SENTIMENT_VALUES } from "./Defaults.js"
import Sentiment from "sentiment";
import { performance } from "perf_hooks";
import minimist from "minimist";

const sentiment = new Sentiment();
const redditService = new RedditService();
const reportService = new ReportService();
const stockService = new StockService();
const statistics = new Statistics();

const parsedArgs = minimist((process.argv.slice(2)));
const opts = {
    chunks: (parsedArgs.chunks) ? parsedArgs.chunks : 10,
    email: (parsedArgs.email) ? true : false,
    subreddits: (parsedArgs.subreddits) ? parsedArgs.subreddits.split(',') : DEFAULT_SUBREDDITS
}

function processPosts(postData) {
    let symbols = {};

    for (const post of postData) {
        const titleSentiment = sentiment.analyze(post.text, DEFAULT_SENTIMENT_VALUES);
        const contentSentiment = sentiment.analyze(post.content, DEFAULT_SENTIMENT_VALUES);
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

    statistics.postCount = postData.length;

    const symbolsList = [];
    for (const s of Object.keys(symbols)) {
        symbolsList.push(symbols[s]);
    }

    return symbolsList
}

async function run() {
    statistics.timeStart = performance.now();
    await stockService.initialize();
    const redditPosts = await redditService.collectData(opts.subreddits, opts.chunks);
    const validPosts = stockService.getValidTickers(redditPosts);

    const symbolDataList = processPosts(validPosts);

    const date = new Date();
    statistics.dateISO = date.toISOString().slice(0, 10);
    statistics.tickerCount = symbolDataList.length;
    statistics.numberOfSubs = opts.subreddits.length;
    statistics.timeEnd = performance.now();
    statistics.timeElapsedSeconds = Math.round((statistics.timeEnd - statistics.timeStart) / 1000);

    console.log(`Time elapsed: ${statistics.timeElapsedSeconds} seconds`);
    reportService.createReport(symbolDataList, validPosts, statistics, opts.email);
}

run();
