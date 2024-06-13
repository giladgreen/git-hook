const pg = require('pg');
const config = require('./config');

const client = new pg.Client(config.db);
client.connect(async function (err) {
    if (err)
        throw err;


    const createExtention = await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('createExtention', createExtention.rows)
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
    console.log('createPrTable', createPrTable.rows)


    const createTokensTable = await client.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        token TEXT,
        token_type TEXT);
    `)

    // console.log('createTokensTable', createTokensTable.rows)
    // const createTokens1 = await client.query(`
    //   INSERT INTO tokens (token, token_type) VALUES ('${lazuz.refreshToken}','refreshToken')
    // `)
    //
    // console.log('createTokens', createTokens1.rows)
    //
    // const createTokens2 = await client.query(`
    //   INSERT INTO tokens (token, token_type) VALUES ('${lazuz.token}','token')
    // `)
    //
    // console.log('createTokens', createTokens2.rows)


});



