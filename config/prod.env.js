module.exports = {
  NODE_ENV: '"production"',
  ILM_API: '"' + process.env.ILM_SERVER + '"',
  ILM_DB: '"' + process.env.DB_HOST + '"',
  CLIENT_PORT: process.env.CLIENT_PORT
}
//ILM_DB: '"https://ilm.cloudant.com"'
