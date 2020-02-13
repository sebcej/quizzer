require("dotenv").config();
const fastify = require("fastify")({
        logs: process.env.DEBUG_REQUESTS || false
    }),
    apiLoader = require("./plugins/apiLoader");

global.paths = {
    root: __dirname
}

fastify.register(apiLoader, {
    root: global.paths.root,
    sourceFolder: "/api",
    sourceURL: "/api"
});




fastify.listen(process.env.PORT || 8080, (err, address) => {
    if (err) 
        throw err
    fastify.log.info(`Loaded on ${address}`)
})