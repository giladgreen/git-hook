// const mysql = require('mysql2/promise');
const config = require('../config');
const { DAY, HOUR } = require("./helpers");
const pg = require('pg');
let connection;
let client;
async function getDBConnection(){
    if (client){
        return client;
    }

    try {
        const localClient = new pg.Client(config.db);
        connection = await client.connect();
        client = localClient
        return client;
    }catch(e){
        console.log('## getDBConnection ERROR', e.message);
        throw e;
    }
}

async function query(sql, params) {
  console.log('## sql', sql)
  console.log('## params', params)
    const parts = sql.split('?');
  const query = parts.reduce((acc, part, i) => {
    return acc + part + (params[i] ? `'${params[i]}'` : '');
  } , '');
    console.log('## query', query)

  try{
      const client = await getDBConnection();

      const result = await client.query(query);
      console.log('## result', result.rows);

      // const [results, ] = await connection.execute(sql, params);
      return result.rows;
  }catch(e){
      console.log('## ERROR', e.message);
      throw e;
  }
  // const connection = await mysql.createConnection(config.db);

}

async function createPR(name, creator, repo, pr_number, tags,  messageId) {
    const last_reminder = (new Date()).toISOString();
  return await query(
      `INSERT INTO prs
    (name, creator, repo, pr_number, tags, last_reminder, slack_message_id)
    VALUES
    (?, ?, ?, ?, ?, ?, ?)`,
      [name, creator, repo, pr_number, tags,  last_reminder, messageId]
  );
}

async function getPR(repo, prNumber) {
  const results = await query(
      `SELECT id, slack_message_id, creator, name, is_deleted FROM prs WHERE repo = ? AND pr_number = ?`,
      [repo, prNumber]
  ) ?? [];

  return results.length > 0 ? results[0] : null;
}

async function markPRasDelete(prId) {
  await query(
      `UPDATE prs SET is_deleted = true WHERE id = ?`,
      [
          prId
      ]
  );
}

async function deletePR(prId) {
  await query(`DELETE from prs WHERE id=?`,[prId]);
}

async function updatePrLastReminder(prId) {
  await query(
      `UPDATE prs SET last_reminder=? WHERE id = ?`,
      [
          (new Date()).toISOString(),
        prId
      ]
  );
}

async function getOldPRs() {
  const time = new Date((new Date()).getTime() - DAY);

  return await query(
      `SELECT id, tags, slack_message_id FROM prs WHERE last_reminder < ? AND is_deleted IS NULL`,
      [time.toISOString()]
  );
}

async function getAllPRs() {
  return await query('SELECT * FROM prs', []);
}

async function createTokens(token, refreshToken) {
  await query(
      `UPDATE tokens SET token=? WHERE token_type = ?`,
      [
        token,
        'token'
      ]
  );

  await query(
      `UPDATE tokens SET token=? WHERE token_type = ?`,
      [
        'refreshToken', refreshToken
      ]
  );

}
async function updateToken(token) {
  return query(
      `UPDATE tokens SET token=? WHERE token_type = ?`,
      [
        token,
        'token'
      ]
  );
}
async function getTokens() {
  return await query('SELECT * FROM tokens', []);
}

module.exports = {
  createPR,
  getPR,
  deletePR,
  updatePrLastReminder,
  getOldPRs,
  getAllPRs,
  markPRasDelete,
  createTokens,
  getTokens,
  updateToken
}
