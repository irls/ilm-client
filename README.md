# Ilm-Client

Application for creating and managing multiple library content for FFA-Reader and similar.

This is a Chrome-only Vue.js 2.0 application which uses the Ilm-Server as a backend (https://github.com/chadananda/ilm-server)


## Getting Started with Development

1. Install the ILM-Server with
    * ```git clone git@github.com:chadananda/ilm-server.git```
    * ```npm install```

2. Set up your DEV config file
    * Copy /config/env.example.sh to /config/env.dev.sh
    * Add ```localhost:5984``` (or your local CouchDB location) to the end of the line ```export DB_HOST=```

3. Launch the server with 
    * ```npm run dev```

4. Next download the ILM-Client
    * ```git clone git@github.com:chadananda/ilm-client.git```
    * ```npm install```

5. Setup Dev config file the dev config file 
    * Copy ```/config/env.example.sh``` to ```/config/env.dev.sh```
    * Add ```localhost:5984``` (or your local CouchDB location) to the end of the line ```export DB_HOST=```
    * Add ```localhost:3000``` to the end of the line ```export ILM_SERVER=```

6. Launch the ILM-Client app with 
    * ```npm run dev``` 

7. Login with the default DEV-only admin user
    * User: ```dev-admin```, Pass: ```vanilla```

#### Note:
  * Changes to Dev client source code are reflected immediatly thanks to Webpack hot-loading
  * Changes to the server code require restarting the server which clears the current session 


