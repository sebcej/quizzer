require("dotenv").config();
const fastify = require("fastify")({
        logs: process.env.DEBUG_REQUESTS || false
    }),
    apiLoader = require("./plugins/apiLoader"),
    socketLoader = require("./plugins/socketLoader"),
    fastifySession = require('fastify-session'),
    fastifyCookie = require('fastify-cookie');

global.paths = {
    root: __dirname,
    config: `${__dirname}/config.json`
}

fastify.register(fastifyCookie);
fastify.register(fastifySession, {
    secret: 'SDHJIJNBFDCFGHIJé)(/YTRETgGJGF@°§é^^KGJHG'
});

fastify.register(apiLoader, {
    root: global.paths.root,
    sourceFolder: "/api",
    sourceURL: "/api"
});

fastify.register(socketLoader, {
    root: global.paths.root,
    sourceFolder: "/socket",
    onConnection (connection) {
        console.log("Connected")
    }
})

fastify.listen(process.env.PORT || 8080, (err, address) => {
    if (err) 
        throw err
    fastify.log.info(`Loaded on ${address}`)
})