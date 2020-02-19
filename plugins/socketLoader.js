const fastifyPlugin = require('fastify-plugin'),
      SocketIOServer = require('socket.io'),
	  fs = require('fs-extra'),
	  objectPath = require('object-path');


/**
 * Socket paths manager
 * 
 * 
 * This plugin manages all socket paths from frontend. 
 * Implements actions in object traversing approach
 * 
 * Files are loaded on boot and are saved in an object that is directly called when an event happens
 */
	  
const configDefault = {
	root: global.paths?global.paths.root:'', // Project root
	socketOptions: {}, // Options to pass to socket.io
	sourceFolder: '/socket', // Source of socket files

	// Events
	onConnection: null,
	onDisconnect: null,
	onInit: null,
	onMessage: null
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

			// Ensure that paths have the ending slash and dot for object
			if (!/\/$/.test(absolutePath))
				absolutePath += "/";
			if (!/\.$/.test(objectPath) && objectPath !== "")
				objectPath += ".";

			const itemAbsolutePath = `${absolutePath}${folderItem}`,
				itemObjectPath = `${objectPath}${folderItem.replace(/\.js$/gi, "")}`,
				itemStat = await fs.stat(itemAbsolutePath)

			if (!itemStat.isFile()) {
				await loadFolder(itemAbsolutePath, itemObjectPath, callback) // Recursively load nested folder
				continue;
			}

			const apiSourceObject = require(itemAbsolutePath);

			callback(apiSourceObject, itemObjectPath, itemAbsolutePath);
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
  const settings = {...configDefault, ...options}, 
  		folderToLoad = `${settings.root}${settings.sourceFolder}/`;
  let actions = {}

  try {
	const io = SocketIOServer(fastify.server, settings.socketOptions);

    // use io wherever you want to use socketio, just provide it in the registration context
	fastify.decorate('io', io);
	
	await loadFolder(folderToLoad, "", (apiSourceObject, actionObjectPath, actionAbsolutePath) => {
		// Save all found socket routes in an object that reflects the folder hierarhy.
		objectPath.set(actions, actionObjectPath, apiSourceObject);
	})

	settings.onInit&&settings.onInit(io)
	
	io.on("connection", (socket) => {
	  fastify.log.debug("Connected new client");
	  let session = {}; // Shared object between alla actions

      socket.on("action", action => {
        const actionName = action.name,
			  actionData = action.data;

		if (settings.onMessage) {
			let response = settings.onMessage.call({session, ...this}, action, socket);
			if (response === false)
				return;
		}

		let actionFunction = objectPath.get(actions, actionName);

		if (actionFunction)
			actionFunction.call({session, ...this}, socket, actionData);
		else
			socket.send("error", {
				id: "ROUTE_NOT_FOUND"
			});
	  });
	  
	  settings.onConnection&&settings.onConnection.call({session, ...this}, socket)

	  if (settings.onDisconnect)
	  	socket.on("disconnect", (socket) => {
			settings.onDisconnect.call({session, ...this}, socket)
		})
	});
	
	return io;
  } catch (error) {
    return Promise.reject(error)
  }
}

module.exports = fastifyPlugin(fastiySocketIo, {
  name: 'fastify-socket',
});