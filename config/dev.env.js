var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  ILM_API: '"'+process.env.ILM_SERVER+'"',  
  ILM_DB: '"'+process.env.DB_HOST+'"'  
})
