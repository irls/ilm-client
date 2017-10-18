module.exports = {
  NODE_ENV: '"production"',
  ILM_API: '"' + process.env.ILM_SERVER + '"',
  ILM_DB: '"' + process.env.DB_HOST + '"'
}
//ILM_API: '"https://ilm.dev2.us"',
//ILM_DB: '"https://ilm.cloudant.com"'
