import snoowrap from 'snoowrap';

const SUBREDDITS_TO_SCRAPE = [
    "stocks",
    "wallStreetBets",
    "investing",
    "Baystreetbets"
];

const LIMIT = Infinity;

export default class RedditService {
    constructor(config) {
        this.rClient = new snoowrap({
            userAgent: 'moonwalker',
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            refreshToken: config.refreshToken
        });
    }
    
    async collectData() {
        let data = [];
        console.log(`Beginning to scrape posts from [${SUBREDDITS_TO_SCRAPE}]...`);
        for (const sub of SUBREDDITS_TO_SCRAPE) {
            const newSubData = await this.scrape(sub);
            data = data.concat(newSubData);
        }
        console.log(`Total posts scraped: ${data.length}`)
        return data;
    }
    
    async scrape(subName) {
        let data = [];
        const subreddit = await this.rClient.getSubreddit(subName);
        const posts = await subreddit.getTop({time: 'day', limit: LIMIT});

        posts.forEach((post) => {
            data.push({
              link: post.url,
              text: post.title,
              score: post.score,
              subreddit: subName,
              content: post.selftext,
              tickers: []
            })
          });
    
        console.log(`Scraped ${data.length} posts from ${subName}`);
        return data;
    }
}
