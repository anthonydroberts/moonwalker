# Moonwalker
This project is a set of NodeJS scripts that use the Reddit API to scrape the most recent post data from a few popular trading / investing subreddits, and then analyze + generate a report detailing the top stocks based on metrics like content sentiment and karma.

## Requirements
If you want to run the scripts on your machine you need to setup a few things:
- Node v13 or higher
- Valid Reddit API Client ID / Client Secret / Refresh Token, you can set this up [here](https://not-an-aardvark.github.io/reddit-oauth-helper/)

Replace the fields in `config.json` with your own:
```json
{
    "clientId": "myClientId",
    "clientSecret": "myClientSecret",
    "refreshToken": "myRefreshToken"
}
```

## Usage

Install the dependencies with `npm install` and then run the scripts with `npm run start`

The generated reports will be stored as follows: `<cwd>/data/<date>/report.html`
