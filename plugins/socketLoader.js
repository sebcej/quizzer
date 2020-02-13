const fastifyPlugin = require('fastify-plugin'),
      SocketIOServer = require('socket.io'),
	  fs = require('fs-extra'),
	  objectPath = require('object-path');
	  
const configDefault = {
	root: global.paths?global.paths.root:'',
	socketOptions: {},
	sourcePath: '/socket'
}

/**
 * 
 * @param {String} absolutePath - Absolute path of the folder
 * @param {*} relativePath - Path of the object relative to the socket root
 * @param {*} callback - Callback for socket actions assignation
 */

async function loadFolder(absolutePath, objectPath, callback) {
    try {
		let folderContents = await fs.readdir(absolutePath);

		if (!folderContents)
				return;

		for (let i = 0; i < folderContents.length; i++) {
			const folderItem = folderContents[i];

			// Ensure that paths have the ending slash
			if (!/\/$/.test(absolutePath))
				absolutePath += "/";

			const itemAbsolutePath = `${absolutePath}${folderItem}`,
				itemObjectPath = `${objectPath}${folderItem}`,
				itemStat = await fs.stat(itemAbsolutePath)

			if (!itemStat.isFile())
				return await loadFolder(itemAbsolutePath, itemRelativePath, callback) // Recursively load nested folder

			const apiSourceObject = require(itemAbsolutePath);

			callback(itemRelativePath, itemAbsolutePath);
		}
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * Initialization code from: https://github.com/fastify/fastify/issues/242
 * 
 * Create a new Socket.io server and decorate Fastify with its instance.
 * @param {Object} fastify - Fastify instance
 * @param {Object} options - Plugin's options that will be sent to Socket.io contructor
 * @param {Function} next - Fastify next callback
 */

async function fastiySocketIo(fastify, options) {
  const settings = {...configDefault, ...options};
  let actions = {}

  try {
    const io = SocketIOServer(fastify.server, settings.socketOptions);

    // use io wherever you want to use socketio, just provide it in the registration context
	fastify.decorate('io', io);
	
	await loadFolder(settings.root, "", (action, actionObjectPath) => {
		objectPath.set(actions, actionObjectPath);
	})
	
	io.on("connection", socket => {
      fastify.log.debug("Connected new client");

      socket.on("action", action => {
        const actionName = action.name,
			  actionData = action.data;

		
      });
    });
  } catch (error) {
    return Promise.reject(error)
  }
}

module.exports = fastifyPlugin(fastiySocketIo, {
  name: 'socketServer',
});