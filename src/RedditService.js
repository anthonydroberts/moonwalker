import axios from 'axios'
import cliProgress from 'cli-progress'
import _colors from 'colors'

export default class RedditService {
    constructor() {
        this.postCount = 0;
        this.progress = new cliProgress.SingleBar({
            format: 'Scraping Progress |' + _colors.green('{bar}') + '| {percentage}% || {value}/{total} Flow Chunks || ETA: {eta}s || Posts Scraped: {postCount}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591'
        });
    }
    
    async collectData(subsToScrape, flowChunks) {
        const rateLimit = (await axios.get('https://api.pushshift.io/meta')).data.server_ratelimit_per_minute;
        let data = [];
        console.log(`Beginning to scrape posts from [${subsToScrape}]...`);
        this.progress.start((1 * flowChunks * subsToScrape.length), 0, {postCount: "0"});
        for (const sub of subsToScrape) {
            const newSubData = await this.scrape(sub, rateLimit, flowChunks);
            data = data.concat(newSubData);
        }
        this.progress.stop();
        console.log(`\nTotal posts saved for processing: ${data.length}`);
        return data;
    }
    
    async scrape(subName, rateLimit, flowChunks) {
        const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
        let baseUrl = `https://api.pushshift.io/reddit/search/submission/?subreddit=${subName}&sort=desc&limit=100&before=`;
        let beforeUTC = "";
        let data = [];
        let posts = [];

        for (let i = 0; i < flowChunks; i++) {
            const url = baseUrl + beforeUTC.toString();
            let newPosts = [];

            try {
                newPosts = (await axios.get(url)).data.data;
                if (newPosts.length === 0) {
                    this.progress.increment(1, {postCount: this.postCount});
                    this.progress.updateETA();
                    break;
                }
            } catch (err) {
                if (err.response.status === 429) {
                    console.log("Exceeded per-minute rate limit!");
                    await sleep(60000);
                    continue;
                }
                throw new Error(err);
            }
            
            beforeUTC = newPosts[newPosts.length - 1].created_utc;
            this.postCount += newPosts.length;
            posts = newPosts.concat(posts);
            this.progress.increment(1, {postCount: this.postCount});
            this.progress.updateETA();

            // pushshift.io limits the amount of requests allowed per minute to rateLimit. Sleep to roughly avoid going over the limit
            await sleep((60000 / rateLimit) + 25);
        }

        posts.forEach((post) => {
            data.push({
                link: post.full_link,
                text: post.title,
                score: post.score,
                subreddit: post.subreddit,
                content: (post.selfText === undefined || post.selfText === "[removed]") ? "" : post.selftext,
                tickers: []
            })
        });

        return data;
    }
}
