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

    quizzer = require(global.paths.quizzer)(config, false);

// Socket and api session manager

fastify.register(apiLoader, {
    root: global.paths.root,
    sourceFolder: "/api",
    sourceURL: "/api"
});

fastify.register(socketLoader, {
    root: global.paths.root,
    sourceFolder: "/socket",
    onInit (io) {
        quizzer.users.setConnection(io);
    },
    onMessage (action, socket) {
        /**
         * Check if token corresponds to current socket user
        */

        if (!action.user)
            return false;
        const user = quizzer.users.getUser(action.user.userId);

        return user.getToken() === action.user.token;
    },
    onDisconnect (socket) {
        if (this.session.userId)
            quizzer.users.getUser(this.session.userId).setLogged(false);
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