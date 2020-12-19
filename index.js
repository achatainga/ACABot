require( 'dotenv' ).config();
const { parse } = require( 'discord-command-parser' );
const Discord = require( 'discord.js' );
const client = new Discord.Client();
const { Client } = require('pg')
const connectionString = process.env.DATABASE_URL
const database = new Client( {
  connectionString,
  ssl: { rejectUnauthorized: false }
} );
const commands = {
  'config': ( message, parsed ) => {
    const options = {
      "prefix": async ( message, parsed ) => {
        const index = servers.rows.findIndex( el => el.serv_discord_id == message.guild.id )
        if ( parsed.arguments[ 1 ] ) {
          let result = await makeQuery( `UPDATE servers SET serv_prefix = '${parsed.arguments[ 1 ]}' WHERE serv_discord_id = ${message.guild.id}` );
          console.log( result );
          servers.rows[ index ].serv_prefix = parsed.arguments[ 1 ];
          message.channel.send( embedMessage( 'success', ':white_check_mark: Config Prefix Success', `Prefix setup to: \`${parsed.arguments[ 1 ]}\`` ) );
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
  'ping': ( message, parsed ) => {
    console.log( 'pong' );
    return message.reply( 'pong' );
  },
  'default': () => {
    return typeof author !='undefined' && author.id != '789723522770927617' ? console.log( 'default' ) : console.log( 'same bot' );
  }
}
var servers;

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

const embedMessage = ( type = 'success', title = '', description ) => {
  return new Discord.MessageEmbed()
    .setColor( type === 'success' ? '#0099ff' : ( type === 'danger' ? '#F93A2F' : ( type === 'warning' ? '#CC7900' : '#969C9F' ) ) )
    .setTitle( title )
    .setDescription( description )
    .setTimestamp();
}

client.on( "ready", async () => {
  console.log(`Ready to serve on ${client.guilds.size} servers, for ${client.users.size} users.`);
  client.user.setActivity(`on ${client.guilds.size} servers`);
  await database.connect();
  servers = await makeQuery( `SELECT * FROM servers LIMIT 1000` );
} );

client.on( 'guildCreate', async guild => {
  let foundServer = servers.rows.find( row => row.serv_discord_id === guild.id );
  if ( typeof foundServer == 'undefined' ) {
    let result = await makeQuery( `INSERT INTO servers ( serv_discord_id, serv_name, serv_prefix ) VALUES ( ${guild.id}, '${guild.name}', '$' )` );
    console.log( result );
  }
} );

client.on( 'message', message => {
  let prefix = servers.rows.find( row => row.serv_discord_id === message.guild.id ).serv_prefix;
  const parsed = parse( message, prefix, { allowSpaceBeforeCommand: true });
  return ( parsed.success && ( commands[ parsed.command ] || commands[ 'default' ] )( message, parsed ) );
} );

client.login( process.env.BOT_TOKEN );

const port = process.env.PORT || 3000;
app.listen( port, '0.0.0.0', () => {
  console.log( 'Listening on Port ' + port );
} );