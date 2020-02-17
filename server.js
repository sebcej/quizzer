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

    quizzer = require('./plugins/quizzer/Quizzer')(require(global.paths.config), socketLoader, false);

// Socket and api session manager
fastify.register(fastifyCookie);

const store = new fastifySession.Store(),
      signature = 'SDHJIJNBFDCFGHIJé)(/YTRETgGJGF@°§é^^KGJHG';

fastify.register(fastifySession, {
    secret: signature,
    store,
    expires: 1800000,
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
    store: {
        api: store,
        secret: signature
    },
    onInit (io) {
        quizzer.setConnection(io);
    },
    onConnection (socket) {
        // Set user initial state
        socket.send("userStatusUpdate", {
            loggedAs: socket.session.username || false,
            admin: socket.session.isAdmin || false
        });

        // If present add connection to user
        if (socket.session.username)
            quizzer.setUserConnection(socket.session.username, socket);

        // Send questions initial state as the user may reload the page during the game
        if (socket.session.username && socket.session.loggedIn && quizzer.questionsPending())
            question.broadcastQuestion(false, socket.session.username)
    }
})

// Start the party!
fastify.listen(process.env.PORT || 8080, (err, address) => {
    if (err) 
        throw err
    fastify.log.info(`Loaded on ${address}`)
})