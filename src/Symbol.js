export default class Symbol {
    constructor(code) {
        this.code = code,
        this.totalSentiment = 0,
        this.count = 0,
        this.averageSentiment = 0,
        this.totalKarma = 0,
        this.averageKarma = 0,
        this.posKeyWords = [],
        this.negKeyWords = []
    }
}
