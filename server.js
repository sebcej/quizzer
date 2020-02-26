require("dotenv").config();

global.paths = {
    root: __dirname,
    plugins: `${__dirname}/plugins`,
    quizzer: `${__dirname}/plugins/quizzer/Quizzer`,
    config: `${__dirname}/config.json`
}

const fastify = require("fastify")({
        logs: process.env.DEBUG_REQUESTS
    }),
    config = require(global.paths.config)
    path = require("path"),
    apiLoader = require("./plugins/apiLoader"),
    socketLoader = require("./plugins/socketLoader"),

    quizzer = require(global.paths.quizzer)(config, false);

// Socket and api plugins
fastify.register(apiLoader, {
    root: global.paths.root,
    sourceFolder: "/api",
    sourceURL: "/api"
});

fastify.register(socketLoader, {
    root: global.paths.root,
    sourceFolder: "/socket",
    onInit (io) {
        // Set broadcast connection
        quizzer.users.setConnection(io);
        io.set('heartbeat timeout', 5000);
        io.set('heartbeat interval', 15000);
    },
    onMessage (action, socket) {
        /**
         * Check if token corresponds to current socket user
         * 
         * If not, all socket operations are disallowed
        */

        if (!action.user)
            return false;
        const user = quizzer.users.getUser(action.user.userId);

        return user && user.checkToken(action.user.userId, action.user.token);
    },
    onDisconnect (socket) {
        // Logout user as connection has dropped. If the user has reloaded the page will be reconnected by linkSocket

        if (this.session.userId)
            quizzer.users.getUser(this.session.userId).setLoggedIn(false);

        quizzer.sendGameStatus();
    }
})

fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'react-ui/build/'),
    prefix: '/'
});

// Start the party!
fastify.listen(process.env.PORT || 8080, "0.0.0.0", (err, address) => {
    if (err) 
        throw err
    fastify.log.info(`Loaded on ${address}`)
})