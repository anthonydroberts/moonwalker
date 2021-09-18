import ftp from "ftp"
import fs from "fs-extra"

const NASDAQ_FTP_SERVER = "ftp.nasdaqtrader.com";

const COMMON_WORDS = [
    "DD", "YOLO", "CEO", "CFO", "GANG", "FOR", "LIFE", "HOLD",
    "JAN", "JUST", "MOON", "LOVE", "PSA", "ARE", "NEW", "FOR",
    "RH", "BE", "ON", "BIG", "EYES", "GO", "HOME", "APES", "IPO",
    "FREE", "GOOD", "HOPE", "NOW", "MUST", "OR", "HAS", "CAN", "PLAN",
    "ALL", "EV", "MARK", "DON", "FL", "SHO", "RE", "NEXT", "USA", "OUT",
    "IQ", "SO", "FLY", "BOSS", "OPEN", "WELL", "BAN", "AT", "USD", "SEE", 
    "PT", "AN", "MN", "EVER", "UK", "CAN", "RIDE", "PAYS", "IT", "SUB", "VS",
    "BEST", "LEAP", "AM"
];

export default class StockService {

    constructor() {
        this.validStocks = [];
    }

    async initialize() {
        await this.downloadTradedStocks();
        let rawNasdaqData = fs.readFileSync('./data/nasdaqtraded.txt', 'utf-8').split("\n");
        rawNasdaqData.shift();
        rawNasdaqData.pop(2);
        for (const entry of rawNasdaqData) {
            if (entry.length > 0) {
                const ticker = entry.match(/(?<=\|)(.*?)(?=\|)/)[0];
                this.validStocks.push(ticker);
            }
        }
    }

    async downloadTradedStocks() {
        return new Promise((resolve, reject)=>{
            if (!fs.existsSync("data/")){
                fs.mkdirSync("data/");
            }

            let c = new ftp();
            c.on('ready', function() {
                c.get('/SymbolDirectory/nasdaqtraded.txt', function(err, stream) {
                    if (err) throw err;
                    stream.once('close', function() { c.end(); });
                    stream.pipe(fs.createWriteStream('data/nasdaqtraded.txt'));
                });
            });

            c.on('close', function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            })
            
            c.connect({
                host: NASDAQ_FTP_SERVER
            });
        });
    }

    getValidTickers(postData) {
        for (const entry of postData) {
            const captures = entry.text.match(/\b[A-Z]{2,5}\b/g);
            if (captures != null) {
                for (const match of captures) {
                    if (this.validStocks.includes(match) && !COMMON_WORDS.includes(match) && !entry.tickers.includes(match)) {
                        entry.tickers.push(match);
                    }
                }
            }
        }
        return postData;
    }
}
