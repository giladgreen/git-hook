const mysql = require('mysql2/promise');
const config = require('../config');

async function query(sql, params) {
  const connection = await mysql.createConnection(config.db);
  const [results, ] = await connection.execute(sql, params);

  return results;
}

module.exports = {
  query
}


//id: url
//pr name
//pr username
//pr status
//created_at
//updated_at
//deleted_at
//reviewer username
//reviewer status
//reviewer updated_at

