const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function process({ payload: { action, label, pull_request} }){

  console.log('## got process for:', action);
  console.log('## label:', label?.name);
  console.log('## pull_request:', pull_request?.url);
  console.log('## state:', pull_request?.state);
  console.log('## title:', pull_request?.title);
  console.log('## by:', pull_request?.user?.login);

  // const result = await db.query(
  //   `INSERT INTO programming_languages
  //   (name, released_year, githut_rank, pypl_rank, tiobe_rank)
  //   VALUES
  //   (?, ?, ?, ?, ?)`,
  //   [
  //     programmingLanguage.name, programmingLanguage.released_year,
  //     programmingLanguage.githut_rank, programmingLanguage.pypl_rank,
  //     programmingLanguage.tiobe_rank
  //   ]
  // );
  //
  // let message = 'Error in creating programming language';
  //
  // if (result.affectedRows) {
  //   message = 'Programming language created successfully';
  // }

  return {body};
}

module.exports = {
  process
}
