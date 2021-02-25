import snoowrap from 'snoowrap';
import cliProgress from 'cli-progress'
import _colors from 'colors'


const SUBREDDITS_TO_SCRAPE = [
    "stocks",
    "wallStreetBets",
    "investing",
    "Baystreetbets"
];

const LIMIT = Infinity;
const FLOW_LIMIT_ITERATIONS = 10;

export default class RedditService {
    constructor(config) {
        this.rClient = new snoowrap({
            userAgent: 'moonwalker',
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            refreshToken: config.refreshToken
        });

        this.progress = new cliProgress.SingleBar({
            format: 'Scraping Progress |' + _colors.green('{bar}') + '| {percentage}% || {value}/{total} Flow Chunks || ETA: {eta}s || Posts Scraped: {postCount}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591'
        });

        this.postCount = 0;
    }
    
    async collectData() {
        let data = [];
        console.log(`Beginning to scrape posts from [${SUBREDDITS_TO_SCRAPE}]...`);
        this.progress.start((1 * FLOW_LIMIT_ITERATIONS * SUBREDDITS_TO_SCRAPE.length), 0, {postCount: "0"});
        for (const sub of SUBREDDITS_TO_SCRAPE) {
            const newSubData = await this.scrape(sub);
            data = data.concat(newSubData);
        }
        this.progress.stop();
        console.log(`\nTotal posts saved for processing: ${data.length}`);
        return data;
    }
    
    async scrape(subName) {
        const subreddit = await this.rClient.getSubreddit(subName);
        let data = [];
        let posts = [];

        for (let i = 0; i < FLOW_LIMIT_ITERATIONS; i++) {
            let newPosts = [];
            if (posts.length === 0) {
                newPosts = await subreddit.getNew({limit: LIMIT});
            } else {
                newPosts = await subreddit.getNew({limit: LIMIT, after: posts[0].name});
            }

            this.postCount += newPosts.length;
            posts = newPosts.concat(posts);
            this.progress.increment(1, {postCount: this.postCount});
            this.progress.updateETA();
        }

        posts.forEach((post) => {
            if(!data.some(e => e.link === post.url)) {
                data.push({
                    link: post.url,
                    text: post.title,
                    score: post.score,
                    subreddit: subName,
                    content: post.selftext,
                    tickers: []
                })
            }
        });
    
        return data;
    } 
}
