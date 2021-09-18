import jsdom from "jsdom"
import fs from "fs-extra"
import path from "path"

const { JSDOM } = jsdom;

export default class ReportService {
    createReport(symbolsList, postData, stats) {
        const dom = new JSDOM (this.getReportSkeleton(stats), { includeNodeLocations: true });
        const document = dom.window.document;

        let table1 = document.getElementById("table_1");
        let table2 = document.getElementById("table_2");
        let table3 = document.getElementById("table_3");

        const symbolsCountSorted = [...symbolsList.sort( (a, b) => {
            let c = a.count;
            let d = b.count;
            return d - c;
        })];

        const symbolsTotalSentimentSorted = [...symbolsList.sort( (a, b) => {
            let c = a.totalSentiment;
            let d = b.totalSentiment;
            return d - c;
        })];
        
        const symbolsTotalKarmaSorted = [...symbolsList.sort( (a, b) => {
            let c = a.totalKarma;
            let d = b.totalKarma;
            return d - c;
        })];

        table1 = this.createTable(table1, symbolsCountSorted, document);
        table2 = this.createTable(table2, symbolsTotalSentimentSorted, document);
        table3 = this.createTable(table3, symbolsTotalKarmaSorted, document);

        this.writeReport(dom, symbolsList, postData);
    }

    createTable(tableElement, symbolsList, document) {
        let initialRow = tableElement.createTHead();
        let tHeadRow = initialRow.insertRow(0);

        let initialCell1 = tHeadRow.insertCell(0);
        let initialCell2 = tHeadRow.insertCell(1);
        let initialCell3 = tHeadRow.insertCell(2);
        let initialCell4 = tHeadRow.insertCell(3);
        let initialCell5 = tHeadRow.insertCell(4);
        let initialCell6 = tHeadRow.insertCell(5);

        initialCell1.innerHTML = "Symbol";
        initialCell2.innerHTML = "Total Sentiment";
        initialCell3.innerHTML = "Average Sentiment";
        initialCell4.innerHTML = "Total Karma";
        initialCell5.innerHTML = "Average Karma";
        initialCell6.innerHTML = "Total count";

        initialCell1.classList.add("table-head");
        initialCell2.classList.add("table-head");
        initialCell3.classList.add("table-head");
        initialCell4.classList.add("table-head");
        initialCell5.classList.add("table-head");
        initialCell6.classList.add("table-head");

        for (const symbol of symbolsList) {
            let row = initialRow.insertRow(-1);

            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);
            let cell4 = row.insertCell(3);
            let cell5 = row.insertCell(4);
            let cell6 = row.insertCell(5);
            
            const link = document.createElement('a');
            link.href = `https://www.tradingview.com/symbols/${symbol.code}/`;
            link.innerHTML = symbol.code;
            cell1.appendChild(link);
            cell2.innerHTML = symbol.totalSentiment;
            cell3.innerHTML = symbol.averageSentiment;
            cell4.innerHTML = symbol.totalKarma;
            cell5.innerHTML = symbol.averageKarma;
            cell6.innerHTML = symbol.count;
        }

        return tableElement
    }

    getReportSkeleton(stats) {
        return `
            <style>
                .content {
                    max-width: 800px;
                    margin: auto;
                    text-align: center;
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .table_wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                #tables_wrapper {
                    display: flex;
                    flex-direction: row;
                    margin-top: 30px;
                }
                h1, h2, h3 {
                    margin-top: 0px;
                    margin-bottom: 0px;
                }
                table {
                    margin-left: 20px;
                    margin-right: 20px;
                }
                td {
                    padding: 5px;
                }
                a:link, a:visited {
                    text-decoration: none;
                    color: #3585fc;
                  }
                .table-head {
                    background-color: #383632;
                    color: white;
                }
                tr:nth-child(even){background-color: #f2f2f2;}
            </style>
            <div class = "content">
                <h1>🚀 ${stats.dateISO} Summary 🌕</h1>
                <h2>Analysed ${stats.wordCount.toLocaleString('en')} words across ${stats.postCount.toLocaleString('en')} posts</h2>
                <h2>Discovered ${stats.tickerCount.toLocaleString('en')} unique stocks discussed on 4 subreddits</h2>
                <h2>Runtime: ${stats.timeElapsedSeconds.toLocaleString('en')} seconds</h2>
                <h2>
                    <a href="https://github.com/anthonydroberts/moonwalker">
                        github.com/anthonydroberts/moonwalker
                    </a>
                </h2>
                <div id = "tables_wrapper">
                    <div class = "table_wrapper">
                        <h2>Total Count</h2>
                        <table id = "table_1"></table>
                    </div>
                    <div class = "table_wrapper">
                        <h2>Total Sentiment</h2>
                        <table id = "table_2"></table>
                    </div>
                    <div class = "table_wrapper">
                        <h2>Total Karma</h2>
                        <table id = "table_3"></table>
                    </div>
                </div>
            </div>
        `
    }

    writeReport(dom, symbolData, postData) {
        let date = new Date();
        const reportDate = `${date.toISOString().slice(0, 10)}-${Math.round(Date.now() / 1000)}`;

        if (!fs.existsSync("data/")){
            fs.mkdirSync("data/");
        }
        if (!fs.existsSync(`data/${reportDate}/`)){
            fs.mkdirSync(`data/${reportDate}/`);
        }

        fs.writeFileSync(`data/${reportDate}/report.html`, dom.serialize());
        console.log(`Generated report ${path.resolve(`./data/${reportDate}/report.html`)}`);

        fs.writeFileSync(`data/${reportDate}/symbolData.json`, JSON.stringify(symbolData, null, 4));
        console.log(`Generated JSON ${path.resolve(`./data/${reportDate}/symbolData.json`)}`);

        fs.writeFileSync(`data/${reportDate}/postData.json`, JSON.stringify(postData, null, 4));
        console.log(`Generated JSON ${path.resolve(`./data/${reportDate}/postData.json`)}`);
    }
}
