import Discord from 'discord.js';
import express, { urlencoded } from 'express';
import dotenv from 'dotenv';
import { parse } from 'discord-command-parser';
import pkg from 'pg';
import axios from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import tough from 'tough-cookie';
axiosCookieJarSupport.default( axios );
const cookieJar = new tough.CookieJar();
import got from "got";
import cheerio from 'cheerio';
dotenv.config();
const app = express();
const client = new Discord.Client();
const { Client } = pkg;
const connectionString = process.env.DATABASE_URL;
const database = new Client( {
  connectionString,
  ssl: { rejectUnauthorized: false }
} );
const emojiNext = '▶️'; // unicode emoji are identified by the emoji itself
const emojiPrevious = '◀️';
const reactionArrow = [ emojiPrevious, emojiNext ];
const time = 60000;
const port = process.env.PORT || 3000;
let servers;

const embedMessage = ( type = 'success', title = '', description = '', attachFiles = [] ) => {
  return new Discord.MessageEmbed()
    .setColor( type === 'success' ? '#0099ff' : ( type === 'danger' ? '#F93A2F' : ( type === 'warning' ? '#CC7900' : '#969C9F' ) ) )
    .setTitle( title )
    .setDescription( description )
    .attachFiles( attachFiles )
}

const extractColumn = ( arr, column ) => {
  return arr.map( e => e[ column ] );
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

client.on( "ready", async () => {
  // console.log(`Ready to serve on ${client.guilds.size} servers, for ${client.users.size} users.`);
  client.user.setActivity(`on ${client.guilds.size} servers`);
  await database.connect();
  servers = await makeQuery( `SELECT * FROM servers LIMIT 1000` );
  console.log( 'ready' );
} );

client.on( 'guildCreate', async guild => {
  let foundServer = servers.rows.find( row => row.serv_discord_id === guild.id );
  if ( typeof foundServer == 'undefined' ) {
    await makeQuery( `INSERT INTO servers ( serv_discord_id, serv_name, serv_prefix ) VALUES ( ${guild.id}, '${guild.name}', '$' )` );
  }
} );

client.on( 'message', message => {
  let prefix = servers.rows.find( row => row.serv_discord_id === message.guild.id ).serv_prefix;
  const parsed = parse( message, prefix, { allowSpaceBeforeCommand: true } ).success ? parse( message, prefix, { allowSpaceBeforeCommand: true } ) : parse( message, `<@!789723522770927617>`, { allowSpaceBeforeCommand: true } );
  return ( parsed.success && ( commands[ parsed.command ] || commands[ 'default' ] )( message, parsed ) );
} );

app.listen( port, '0.0.0.0', () => {
  // console.log( 'Listening on Port ' + port );
} );

app.get( '/', ( req, res ) => {
  res.send( 'hello world' );
} );

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", CLIENT_ORIGIN);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  res.header("Access-Control-Allow-Credentials", true); // <--- this is the only different line I added.
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

client.login( process.env.BOT_TOKEN );


// Commands
const commands = {
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
  'nft': async ( message, parsed ) => {
    try {
      var msg = await message.channel.send( 'Fetching NFTs' );
      let data = await got( `https://etherscan.io/enslookup-search?search=${parsed.arguments[ 0 ]}` );
      const $ = cheerio.load( data.body );
      const address = $( '#ensControllerId' ).text();
      console.log( address );
      
      data = await axios.get( `https://api.opensea.io/api/v1/assets?owner=${address}&order_direction=desc&offset=0&limit=10`, {
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
          .setFooter( `Page ` + ( i > j ? `${i- --j}` : `` ) + `/${list.length}` + ( asset.last_sale != null ? ` • Last sale: ${asset.last_sale.payment_token.eth_price} ETH` : `` ) )
        )
        i++
      } );
      
      sendList( msg, getList, list );
    } catch ( error ) {
      console.log( error );
    }
  },
  'ping': ( message, parsed ) => {
    console.log( 'pong' );
    return message.reply( 'pong' );
  },
  'default': () => {
    return typeof author !='undefined' && author.id != '789723522770927617' ? console.log( 'default' ) : console.log( 'same bot' );
  }
}

const getList = ( i, list ) => {
  return list[ i ](); // i+1 because we start at 0
}
const filter = ( reaction, user ) => {
  reaction.users.cache.map( async user => await ( !user.bot ? reaction.users.remove( user.id ) : false ) );
  return ( !user.bot ) && ( reactionArrow.includes( reaction.emoji.name ) ); // check if the emoji is inside the list of emojis, and if the user is not a bot
}
const onCollect = ( emoji, message, i, getList, list ) => {
  if ( emoji.name === emojiPrevious && i > 0 ) {
    message.edit( getList( --i, list ) );
  } else if ( emoji.name === emojiNext && i < list.length-1 ) {
    message.edit( getList( ++i, list ) );
  }
  return i;
}
const createCollectorMessage = ( message, getList, list ) => {
  let i = 0;
  const collector = message.createReactionCollector( filter, { time } );
  collector.on( 'collect', r => {
    i = onCollect( r.emoji, message, i, getList, list );
  } );
  // collector.on('end', collected => message.clearReactions());
}
const sendList = ( msg, getList, list ) => {
  msg.edit( '‏‏‎ ‎' );
  msg.edit( getList( 0, list ) )
    .then( msg => msg.react( emojiPrevious ) )
    .then( msgReaction => msgReaction.message.react( emojiNext ) )
    .then( msgReaction => createCollectorMessage( msgReaction.message, getList, list ) );
}