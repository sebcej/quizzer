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
    sourceFolder: "/api",
    sourceURL: "/api"
}

async function apiLoader (fastify, opts) {
    const settings = {...configDefaults, ...opts},
          folderToLoad = `${global.paths.root}${settings.sourceFolder}/`;

    return await loadFolder(folderToLoad, settings.sourceURL, (apiObject, fileRelativePath, fileAbsolutePath) => {
        fastify.log.debug(`Loading: ${fileRelativePath}`);

        fastify[apiObject.method.toLowerCase()](`${fileRelativePath}`, async (request, reply) => {
            fastify.log.debug(`Responding to: ${fileRelativePath}`)

            if (apiObject.onRequest){
                let response = await apiObject.onRequest(request, reply);

                // Response check allows the user to choose if wants to respond with json (default) or directly in onRequest function
                if (response !== undefined)
                    return reply
                        .code(200)
                        .header('Content-Type', 'application/json; charset=utf-8')
                        .send(response)
            }
        })
    });
}

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

        if (!itemStat.isFile())
            return await loadFolder(itemAbsolutePath, itemRelativePath, callback) // Recursively load nested folder

        const apiSourceObject = require(itemAbsolutePath);
        let apiObject = {...apiDefaults, apiSourceObject};

        callback(apiObject, itemRelativePath, itemAbsolutePath);
    }
}

module.exports = apiLoader;