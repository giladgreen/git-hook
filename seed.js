const fs = require('fs');
const pg = require('pg');
const url = require('url');

const config = {
    user: "avnadmin",
    password: "AVNS_QFwjiNg15ZdictPHIfz",
    host: "pg-3c0c8475-green-139b.j.aivencloud.com",
    port: 24244,
    database: "defaultdb",
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
};

const client = new pg.Client(config);
client.connect(async function (err) {
    if (err)
        throw err;


    const createExtention = await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('createExtention', createExtention)
    // const dropTable = await client.query(`DROP TABLE prs`);
    // console.log('dropTable', dropTable)

    const createPrTable = await client.query(`
      CREATE TABLE IF NOT EXISTS prs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name TEXT,
        creator TEXT,
        repo TEXT,
        tags TEXT,
        slack_message_id TEXT,
        pr_number INT,
        last_reminder timestamp NOT NULL DEFAULT now(),
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        is_deleted BOOLEAN DEFAULT false,
        deleted_at timestamp);
    `)


    const createTokensTable = await client.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        token TEXT,
        token_type TEXT);
    `)

    console.log('####')
    console.log('createPrTable', createPrTable)
    console.log('createTokensTable', createTokensTable)
    console.log('####')
});
