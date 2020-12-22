// Env vars
require( 'dotenv' ).config();
// Express
const express = require('express');
const gatsyExpress = require( 'gatsby-plugin-express' );
const app = express();
// Discord
const Discord = require( 'discord.js' );
const DiscordClient = new Discord.Client();
const { parse } = require( 'discord-command-parser' );
// Posgresql
const { Client } = require( 'pg' );
// Fetching clients
const axios = require( 'axios' );
const axiosCookieJarSupport = require( 'axios-cookiejar-support' );
const tough = require( 'tough-cookie' );
axiosCookieJarSupport.default( axios );
const cookieJar = new tough.CookieJar();
const ethereumRegex = require( 'ethereum-regex' );
// Crypto libraries
const  ethers = require( 'ethers' );
const provider = new ethers.providers.EtherscanProvider( "homestead" );
// Database for posgres
const connectionString = process.env.DATABASE_URL;
const database = new Client( {
  connectionString,
  ssl: { rejectUnauthorized: false }
} );
// Constants
const emojiNext = '▶️';
const emojiPrevious = '◀️';
const reactionArrow = [ emojiPrevious, emojiNext ];
const time = 60000;
const port = process.env.PORT || 3000;
let servers;

// Discord listeners
DiscordClient.on( "ready", async () => {
  // console.log(`Ready to serve on ${DiscordClient.guilds.size} servers, for ${DiscordClient.users.size} users.`);
  DiscordClient.user.setActivity(`on ${DiscordClient.guilds.size} servers`);
  await database.connect();
  servers = await makeQuery( `SELECT * FROM servers LIMIT 1000` );
  console.log( 'ready' );
} );
DiscordClient.on( 'guildCreate', async guild => {
  let foundServer = servers.rows.find( row => row.serv_discord_id === guild.id );
  if ( typeof foundServer == 'undefined' ) {
    await makeQuery( `INSERT INTO servers ( serv_discord_id, serv_name, serv_prefix ) VALUES ( ${guild.id}, '${guild.name}', '$' )` );
  }
} );
DiscordClient.on( 'message', message => {
  let prefix = servers.rows.find( row => row.serv_discord_id === message.guild.id ).serv_prefix;
  const parsed = parse( message, prefix, { allowSpaceBeforeCommand: true } ).success ? parse( message, prefix, { allowSpaceBeforeCommand: true } ) : parse( message, `<@!789723522770927617>`, { allowSpaceBeforeCommand: true } );
  return ( parsed.success && ( commands[ parsed.command ] || commands[ 'default' ] )( message, parsed ) );
} );
DiscordClient.login( process.env.BOT_TOKEN );

// Express listeners
app.listen( port, '0.0.0.0', () => {
  console.log( 'Listening on Port ' + port );
} );
app.use( express.static( 'public/' ) );
app.use( gatsyExpress( 'config/gatsby-express.json', {
  publicDir: 'public/',
  template: 'public/404/index.html',
  redirectSlashes: true,
} ) );
app.get( '/discord_client_id', function ( req, res ) {
  res.send( process.env.DISCORD_CLIENT_ID );
} );

// Funtions
const createCollectorMessage = ( message, getList, list ) => {
  let i = 0;
  const collector = message.createReactionCollector( filter, { time } );
  collector.on( 'collect', r => {
    i = onCollect( r.emoji, message, i, getList, list );
  } );
  // collector.on('end', collected => message.clearReactions());
}
const embedMessage = ( type = 'success', title = '', description = '' ) => {
  return new Discord.MessageEmbed()
    .setColor( type === 'success' ? '#0099ff' : ( type === 'danger' ? '#F93A2F' : ( type === 'warning' ? '#CC7900' : '#969C9F' ) ) )
    .setTitle( title )
    .setDescription( description );
}
const extractColumn = ( arr, column ) => {
  return arr.map( e => e[ column ] );
}
const filter = ( reaction, user ) => {
  reaction.users.cache.map( async user => await ( !user.bot ? reaction.users.remove( user.id ) : false ) );
  return ( !user.bot ) && ( reactionArrow.includes( reaction.emoji.name ) ); // check if the emoji is inside the list of emojis, and if the user is not a bot
}
const getList = ( i, list ) => {
  return list[ i ]().setFooter( `Page ${i+1}/${list.length}` ); // i+1 because we start at 0
}
const makeQuery = async ( query ) => {
  return await new Promise( async ( resolve, reject ) => {
    await database.query( query, ( err, res ) => {
      if ( typeof err === null ) {
        reject( err );
      } else {
        resolve( res );
      }
    } );
  } );
}
const onCollect = ( emoji, message, i, getList, list ) => {
  if ( emoji.name === emojiPrevious && i > 0 ) {
    message.edit( getList( --i, list ) );
  } else if ( emoji.name === emojiNext && i < list.length-1 ) {
    message.edit( getList( ++i, list ) );
  }
  return i;
}
const sendList = ( msg, getList, list ) => {
  msg.edit( '‏‏‎ ‎' );
  msg.edit( getList( 0, list ) )
    .then( msg => msg.react( emojiPrevious ) )
    .then( msgReaction => msgReaction.message.react( emojiNext ) )
    .then( msgReaction => createCollectorMessage( msgReaction.message, getList, list ) );
}

// Discord Commands
const commands = {
  // Config
  'config': ( message, parsed ) => {
    const options = {
      "prefix": async ( message, parsed ) => {
        const index = servers.rows.findIndex( el => el.serv_discord_id == message.guild.id )
        if ( parsed.arguments[ 1 ] ) {
          let result = await makeQuery( `UPDATE servers SET serv_prefix = '${parsed.arguments[ 1 ]}' WHERE serv_discord_id = ${message.guild.id}` );
          // console.log( result );
          servers.rows[ index ].serv_prefix = parsed.arguments[ 1 ];
          message.channel.send( embedMessage( 'success', `:white_check_mark: ${message.guild.name} settings updated`, `Command prefix set to: \`${parsed.arguments[ 1 ]}\`\nYou can also access the bot with the <@!789723522770927617>` ) );
        } else {
          message.channel.send( embedMessage( 'danger', ':x: Config Prefix Fail', `Parameters: <prefix>config prefix <new_prefix>\nExample: \`${servers.rows[ index ].serv_prefix}config prefix &\`` ) );
        }
      },
      'default': () => {
        const index = servers.rows.findIndex( el => el.serv_discord_id == message.guild.id )
        message.channel.send( embedMessage( 'danger', ':x: Config Error', `Parameters: \`${servers.rows[ index ].serv_prefix}config <options>\`\n**Options:**\n*${servers.rows[ index ].serv_prefix}config prefix <new_prefix>*\n` ) )
      }
    }
    return ( options[ parsed.arguments[ 0 ] ] || options[ 'default' ] )( message, parsed );
  },
  // NFT
  'nft': async ( message, parsed ) => {
    try {
      var msg = await message.channel.send( 'Fetching NFTs' );
      let address = await ( ethereumRegex().test( parsed.arguments[ 0 ] ) ? parsed.arguments[ 0 ] : provider.resolveName( parsed.arguments[ 0 ] ).then( address => address ) );
      if ( address != null ) {
        let data = await axios.get( `https://api.opensea.io/api/v1/assets?owner=${address}&order_direction=desc&offset=0&limit=10`, {
          jar: cookieJar, // tough.CookieJar or boolean
          withCredentials: true, // If true, send cookie stored in jar
        } ).then( res => res.data );
        let i = 0;
        let j = data.assets.length;
        let list = [];
        data.assets.map( asset => {
          list.push( () => new Discord.MessageEmbed()
            .setTitle( asset.name )
            .setDescription( asset.description )
            .setImage( asset.image_preview_url )
            .setURL( asset.external_link )
            .setAuthor( `${asset.owner.user.username}'s latest NFTs`, asset.owner.profile_img_url, `https://etherscan.io/address/${asset.owner.address}` )
            .setTimestamp()
          )
          i++
        } );

        sendList( msg, getList, list );
      } else {
        msg.edit( '‏‏‎ ‎' );
        msg.edit( embedMessage( 'danger', "Error", "Address not found" ) );
      }
    } catch ( error ) {
      console.log( error );
    }
  },
  // Ping
  'ping': ( message, parsed ) => {
    console.log( 'pong' );
    return message.reply( 'pong' );
  },
  // Default
  'default': () => {
    return typeof author !='undefined' && author.id != '789723522770927617' ? console.log( 'default' ) : console.log( 'same bot' );
  }
}