// const mysql = require('mysql2/promise');
const config = require('../config');
const { DAY, HOUR } = require("./helpers");
const pg = require('pg');

async function query(sql, params) {
  console.log('## query', sql, params)
  console.log('## config.db',config.db)
  const client = new pg.Client(config.db);
  try{
      await client.connect();
      const result = await client.query(sql, params);
      console.log('## result', result);

      // const [results, ] = await connection.execute(sql, params);
      return results;
  }catch(e){
      console.log('## ERROR', e.message);
      throw e;
  }
  // const connection = await mysql.createConnection(config.db);

}

async function createPR(name, creator, repo, pr_number, tags,  last_reminder, messageId) {
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
        new Date(),
        prId
      ]
  );
}

async function getOldPRs() {
  const time = new Date((new Date()).getTime() - DAY);

  return await query(
      `SELECT id, tags, slack_message_id FROM prs WHERE last_reminder < ? AND is_deleted IS NULL`,
      [time]
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
