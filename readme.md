# ACABot

ACABot is a Discord bot made with:

  - discordjs
  - opensea-js
  - ethers
  - gatsby
  - express
  - material-ui
  - posgresql to save data
  - Works great with heroku

# New Commands!

  - $confit prefix <new_prefix>: $config prefix # (Changes the default prefix per server)
  - $nft <long ETH wallet> or $nft <ens domain (achatainga.eth)>: Fetches the latest 10 NFTs of either the long ETH wallet or the ENS domain.

### Installation

ACABot requires [Node.js](https://nodejs.org/) v12+ to run and a POSTGRES database. In order to successfully run this bot on your own, you would need to create a table servers with columns: serv_id (integer, primary, autoincrement) / serv_discord_id (bigint, unique) / serv_name (varchar). Or you can remove the command "prefix" found at index.js at the end of the file

```sh
$ git clone git@github.com:achatainga/ACABot.git
$ cd ACABot
```
Install dependencies:
```
$ npm install
```
or
```
$ yarn
```
Build the Gatsby front end
```
$ npm build
```
or
```
$ yarn build
```
Once the front end is compile it will create the /Public folder with the front end. Finally start the development server with:
```
$ npm start
```
or
```
$ yarn start
```
Go to https://discord.com/developers/applications, login, create a Bot and setup your Client. Bot needs "Manage Message" permissions.
I am using heroku posgresql plugin and using it here.
Create an ".env" file and add the constants:
```
DISCORD_CLIENT="YOUR DISCORD CLIENT ID"
DATABASE_URL="YOUR POSGRES URL (postgres://example)"
```
# Disclaimer

This bot is under active development and it is not ready for production at all. There are some steps required to deploy it to heroku, to add posgres and to create a bot for Discord which are not covered here.


License
----

MIT
