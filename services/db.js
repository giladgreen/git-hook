const mysql = require('mysql2/promise');
const config = require('../config');
const { DAY, HOUR } = require("./helpers");

async function query(sql, params) {
  console.log('## query', sql, params)
  console.log('## config.db',config.db)
  const connection = await mysql.createConnection({...config.db,

      ssl: {
          rejectUnauthorized: true,
          ca: `-----BEGIN CERTIFICATE-----
MIIEQTCCAqmgAwIBAgIUV+K7Axbx9+0bPFuoFUUJX2fQHCIwDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvNmI1MDdiMTktMGE4NC00MTNjLWFjN2UtNDhhZjRhYjcw
MGMyIFByb2plY3QgQ0EwHhcNMjQwNjEzMTMxMTUwWhcNMzQwNjExMTMxMTUwWjA6
MTgwNgYDVQQDDC82YjUwN2IxOS0wYTg0LTQxM2MtYWM3ZS00OGFmNGFiNzAwYzIg
UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAIin3iOB
op0fw36rtW38kDHXtji7z1gKeyRvFEmOVKxVnVMJdCyJzxZNCL0jrFpu/YPEBvTG
HmqbFCfmopsnRwWDrEBgEQuzjIyQp3z1yFOUpviOS0+mQqNK8ShnLG16i82Xed7T
7ISYJv1EWFJJMt8pOdU44QftMkxJpakRwXJte/8anZ39yBxWSlY/Iqnd7MN8hIBJ
X3SxqjpzeTJSXXazLPa76kue1rZ19r3KmcVIrCrAzJhTYt1h6nRgCujwiYDZ87Zg
eVLBLheF+VNAAQhmCSiMhpHURACpdpQp8/U/HttJNrbX5TTweXpEe2anwQNLjsMv
X7DJRZbDbWXzrjhtsS7IZe0J7SNcXB3dj4oHDF0mDpccmHgFOWJkG3A3SPxi286L
q5vZ1erMapPgFYX6Uqx7FTzmmYoOdhULIXqGuJd5lzAN5MvRXz718G5Kvgnz1I44
Mqd7MRmzgA2ES9QGaPp933qGuPE5ViNosRrvqOXWSlAtOe7T3LxSQ30WsQIDAQAB
oz8wPTAdBgNVHQ4EFgQUkUJ4XQV7xEtEeep29iARs4WGMKAwDwYDVR0TBAgwBgEB
/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAFo1Furrbl9NaqJ1
9CMXLY0GzVEzh5S1AxohUsWILpk0lb1VfAKsT/ISaE+R0euJKPPGsz907WXywljl
+DZy1nYF4TzXvp4EksXL8NPFRyyTKFPk8VYH5cEzoTJewECW5aRgZdQrdQ8J8N2f
GCubfme6c7RYYCBAmOuw2LoFdw7mTmmVXIFdzleYuDK838rE90WACnxePyazs7nU
tTjnuJddLRgohg5xjlmX94KQpmNyWgTtrAlYC9MarO4Z2WlJaOMljuBfIGeU/VxV
QzhFw7w/lD1cAsMKYrPr3AqkqotFXQ+CbrC/VsQWeUnwpi6GA9LhkcY36c2uk2kA
AWPsIM6TcifMrrz1C9kv79CxqpJcWOlsHp18nyCOySFyI4ZHONlHUiLOn16n0DxL
FLhkMPznlHWlOjyfOGPReyJI9mF+6N5dUWiduL+J45S0Hu39SQRfMW+314xgeKI5
V2tUjP6ce1TdYRuXUcZVTFztbfvSr7slOnstKa2bfw2TG3q0Tg==
-----END CERTIFICATE-----`,
      },
  });
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
