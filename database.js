require('dotenv').config()

const { Pool, Client } = require('pg')
const connectionString = process.env.CONNECTION_URI
const client = new Client( {
  connectionString,
  ssl: true
} );
client.connect();
class Database {
  doQuery = query => {
    client.query( query, ( err, res ) => {
      client.end();
      return res;
    } );
  }
}

module.exports = Database;