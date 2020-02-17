/**
 *  Api Loader
 * 
 *  Simple fastify plugin that maps folder structure to API endpoints
 *  
 */

const fs = require("fs-extra");

const apiDefaults = {
    method: "POST"
},
configDefaults = {
    root: global.paths?global.paths.root:"",
    sourceFolder: "/api",
    sourceURL: "/api"
}

/**
 * 
 * @param {Object} fastify - Fastify instance
 * @param {*} opts - Settings sent from plugin initialization
 */

async function apiLoader (fastify, opts) {
    const settings = {...configDefaults, ...opts},
          folderToLoad = `${settings.root}${settings.sourceFolder}/`;

    return await loadFolder(folderToLoad, settings.sourceURL, (apiObject, fileRelativePath, fileAbsolutePath) => {
        fastify.log.debug(`Loading: ${fileRelativePath}`);

        console.log("Loading route", fileRelativePath);
        fastify[apiObject.method.toLowerCase()](`${fileRelativePath}`, async (request, reply) => {
            console.log(`Responding to: ${fileRelativePath}`)

            if (apiObject.onRequest){
                let response = await apiObject.onRequest(request, reply);

                // Response check allows the user to choose if wants to respond with json (default) or directly in onRequest function
                if (response !== undefined)
                    return reply
                        .code(200)
                        .header('Content-Type', 'application/json; charset=utf-8')
                        .send(response)
            } else {
                return reply
                    .code(500)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send({
                        error: "NO_HANDLER"
                    })
            }
        })
    });
}

/**
 * 
 * @param {String} absolutePath - Absolute path of the folder
 * @param {*} relativePath - Path of the folder relative to the web root
 * @param {*} callback - Callback for fastify GET/POST initialization
 */

async function loadFolder(absolutePath, relativePath, callback) {
    let folderContents = await fs.readdir(absolutePath);

    if (!folderContents)
            return;

    for (let i = 0; i < folderContents.length; i++) {
        const folderItem = folderContents[i];

        // Ensure that paths have the ending slash
        if (!/\/$/.test(absolutePath))
            absolutePath += "/";
        if (!/\/$/.test(relativePath))
            relativePath += "/"

        const itemAbsolutePath = `${absolutePath}${folderItem}`,
              itemRelativePath = `${relativePath}${folderItem}`,
              itemStat = await fs.stat(itemAbsolutePath)

        if (!itemStat.isFile()) {
            await loadFolder(itemAbsolutePath, itemRelativePath, callback) // Recursively load nested folder
            continue;
        }

        const apiSourceObject = require(itemAbsolutePath);
        let apiObject = {...apiDefaults, ...apiSourceObject};

        callback(apiObject, itemRelativePath.replace(/\.js$/, ""), itemAbsolutePath);
    }
}

module.exports = apiLoader;