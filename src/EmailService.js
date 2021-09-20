import axios from 'axios'
import nodemailer from "nodemailer"
import htmlToPdf from 'html-pdf-node'
import path from "path"

const STOCK_API_URL = "https://www.styvio.com/api/";

export default class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MOONWALKER_EMAIL_HOST,
            port: process.env.MOONWALKER_EMAIL_PORT,
            secure: true,
            auth: {
                user: process.env.MOONWALKER_EMAIL_USER,
                pass: process.env.MOONWALKER_EMAIL_PASS
            }
        });
        this.mailOptions = {
            from: `moonserver@${process.env.MOONWALKER_EMAIL_HOST}`,
            to: process.env.MOONWALKER_EMAIL_MAILING_LIST,
            subject: '',
            attachments: [
                {
                    filename: '',
                    path: ''
                }
            ]
        }
    }

    async writeEmail(stats, dom, symbolsTotalSentimentSorted, reportDir) {
        this.mailOptions.subject = await this.getEmailSubject(symbolsTotalSentimentSorted);
        this.mailOptions.attachments[0].filename = `${stats.dateISO}-moonwalker-report.pdf`;
        this.mailOptions.attachments[0].path = await this.generatePdfReport(reportDir, dom);
        await this.transporter.sendMail(this.mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }

    async generatePdfReport(reportDir, dom) {
        const options = { format: 'A2', path: reportDir + "report.pdf", printBackground: true };
        const file = { content: dom.serialize() };
        await htmlToPdf.generatePdf(file, options).then(pdfBuffer => {
            console.log("Creating PDF: ", pdfBuffer);
        });
        console.log(reportDir + "report.pdf")
        console.log(`Generated report ${path.resolve(reportDir + "report.pdf")}`);
        return reportDir + "report.pdf";
    }

    async getEmailSubject(symbolsTotalSentimentSorted) {
        const topStockData = (await axios.get(STOCK_API_URL + symbolsTotalSentimentSorted[0].code)).data;
        let subject = `${this.getDayString()}'s sentiment: $${topStockData.ticker} | ${topStockData.shortName} | ${topStockData.currentPrice} ${topStockData.percentText} | ${this.getRandomArticle(topStockData)}`;
        if (subject.length > 89) {
            subject = subject.substr(0, 89);
            subject += "...";
        }
        return subject;
    }

    getDayString() {
        switch (new Date().getDay()) {
            case 0:
                return "Sunday";
            case 1:
                return"Monday";
            case 2:
                return"Tuesday";
            case 3:
                return"Wednesday";
            case 4:
                return"Thursday";
            case 5:
                return"Friday";
            case 6:
                return "Saturday";
        }
    }

    getRandomArticle(topStockData) {
        switch (Math.floor(Math.random() * 5)) {
            case 0:
                return topStockData.newsArticle1;
            case 1:
                return topStockData.newsArticle2;
            case 2:
                return topStockData.newsArticle3;
            case 3:
                return topStockData.newsArticle4;
            case 4:
                return topStockData.newsArticle5;
        }
    }
}
