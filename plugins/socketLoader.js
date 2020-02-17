const fastifyPlugin = require('fastify-plugin'),
      SocketIOServer = require('socket.io'),
	  fs = require('fs-extra'),
	  objectPath = require('object-path'),
	  cookie = require("cookie"),
	  cookieSignature = require('cookie-signature');
	  
const configDefault = {
	root: global.paths?global.paths.root:'',
	socketOptions: {},
	sourceFolder: '/socket',
	store: true,

	onConnection: null
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

			if (!itemStat.isFile())
				return await loadFolder(itemAbsolutePath, itemObjectPath, callback) // Recursively load nested folder

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

	/**
	 * Enable session store syncer
	 * 
	 * Check the existence of a session on fastify side and import it in current socket session
	 * 
	 * The session is in read-only mode
	 */
	if (settings.store && settings.store.api && settings.store.secret)
		io.use((socket, next) => {

			let cookieString = socket.request.headers.cookie,
				cookieObj = cookie.parse(cookieString),
				decryptedSessionId = cookieObj.sessionId?cookieSignature.unsign(cookieObj.sessionId, settings.store.secret):false;

			if (decryptedSessionId) {
				settings.store.api.get(decryptedSessionId, function (err, sessionObj) {
					socket.session = sessionObj || {};
					next()
				})
			} else {
				socket.session = {}
				next()
			}
		});

    // use io wherever you want to use socketio, just provide it in the registration context
	fastify.decorate('io', io);
	
	await loadFolder(folderToLoad, "", (apiSourceObject, actionObjectPath, actionAbsolutePath) => {
		// Save all found socket routes in an object that reflects the folder hierarhy.
		objectPath.set(actions, actionObjectPath, apiSourceObject);
	})

	settings.onInit&&settings.onInit(io)
	
	io.on("connection", (socket) => {
	  fastify.log.debug("Connected new client");

      socket.on("action", action => {
        const actionName = action.name,
			  actionData = action.data;

		let actionFunction = objectPath.get(actions, actionName);

		if (actionFunction)
			actionFunction(socket, actionData);
		else
			socket.send("error", {
				id: "ROUTE_NOT_FOUND"
			});
	  });
	  
	  settings.onConnection&&settings.onConnection(socket)

	  if (settings.onDisconnect)
	  	socket.on("disconnect", (socket) => {
			settings.onDisconnect(socket)
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