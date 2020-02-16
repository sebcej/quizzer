require("dotenv").config();

global.paths = {
    root: __dirname,
    plugins: `${__dirname}/plugins`,
    config: `${__dirname}/config.json`
}

const fastify = require("fastify")({
        logs: true
    }),
    apiLoader = require("./plugins/apiLoader"),
    socketLoader = require("./plugins/socketLoader"),
    fastifySession = require('fastify-session'),
    fastifyCookie = require('fastify-cookie'),

    quizzer = require('./plugins/quizzer');

// Socket and api session manager
fastify.register(fastifyCookie);
fastify.register(fastifySession, {
    secret: 'SDHJIJNBFDCFGHIJé)(/YTRETgGJGF@°§é^^KGJHG',
    cookie: { secure: false }
})

fastify.register(apiLoader, {
    root: global.paths.root,
    sourceFolder: "/api",
    sourceURL: "/api"
});

fastify.register(socketLoader, {
    root: global.paths.root,
    sourceFolder: "/socket",
    onConnection (socket) {
        //console.log("Socket", socket.session);
        socket.send("userStatusUpdate", {
            test: true
        })
    }
})

// Start the party!
fastify.listen(process.env.PORT || 8080, (err, address) => {
    if (err) 
        throw err
    fastify.log.info(`Loaded on ${address}`)
})