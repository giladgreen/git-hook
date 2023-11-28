const mysql = require('mysql2/promise');
const config = require('../config');
const { DAY, HOUR } = require("./helpers");

async function query(sql, params) {
  const connection = await mysql.createConnection(config.db);
  const [results, ] = await connection.execute(sql, params);

  return results;
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
      `SELECT id, slack_message_id FROM prs WHERE repo = ? AND pr_number = ?`,
      [repo, prNumber]
  ) ?? [];

  return results.length > 0 ? results[0] : null;
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
      `SELECT id, tags, slack_message_id FROM prs WHERE last_reminder < ?`,
      [time]
  );
}

module.exports = {
  query,
  createPR,
  getPR,
  deletePR,
  updatePrLastReminder,
  getOldPRs
}
