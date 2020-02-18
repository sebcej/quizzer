require("dotenv").config();

global.paths = {
    root: __dirname,
    plugins: `${__dirname}/plugins`,
    quizzer: `${__dirname}/plugins/quizzer/Quizzer`,
    config: `${__dirname}/config.json`
}

const fastify = require("fastify")({
        logs: true
    }),
    config = require(global.paths.config)
    path = require("path"),
    apiLoader = require("./plugins/apiLoader"),
    socketLoader = require("./plugins/socketLoader"),
    fastifySession = require('fastify-session'),
    fastifyCookie = require('fastify-cookie'),

    quizzer = require(global.paths.quizzer)(config, false);

// Socket and api session manager
fastify.register(fastifyCookie);

const store = new fastifySession.Store(),
      secret = process.env.secret || "42istheanswertoeverythingintheuniverse";

fastify.register(fastifySession, {
    secret: secret,
    store,
    expires: 1800000,
    cookie: { secure: false }
 });

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
        secret: secret
    },
    onInit (io) {
        quizzer.users.setConnection(io);
    },
    onConnection (socket) {
        console.log("Connected")

        if (!socket.session.userId)
            return;
        const user = quizzer.users.getUser(socket.session.userId)

        // Set user initial state
        user.sendStatus()

        quizzer.sendGameStatus(user.getId())
    }
})

fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'react-ui/build'),
    prefix: '/'
})

// Start the party!
fastify.listen(process.env.PORT || 8080, (err, address) => {
    if (err) 
        throw err
    fastify.log.info(`Loaded on ${address}`)
})