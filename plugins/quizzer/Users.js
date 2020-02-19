const config = require(global.paths.config),
      md5 = require('md5');

function cleanUserName (userName) {
    if (!userName)
        return undefined
    return userName.trim().toLowerCase()
}

function makeToken (user) {
    return md5(`${user.id} + ${process.env.SECRET} + ${user.userName} + ${user.isAdmin}`)
}

class User {
    constructor (id, userName) {
        this.user = {
            id,
            userName,
            isLogged: false,
            isAdmin: false,
            connection: false
        }

        this.token = makeToken(this.user);
    }

    getId () {
        return this.user.id;
    }

    getUserName () {
        return this.user.userName;
    }

    getDetails () {
        return this.user;
    }

    getToken () {
        return this.token
    }

    isLoggedIn () {
        return this.user.isLogged || false;
    }

    setLoggedIn (isLoggedIn) {
        this.user.isLogged = isLoggedIn;

        return this
    }

    setAdmin (isAdmin) {
        this.user.isAdmin = isAdmin || false;

        return this;
    }

    isAdmin () {
        return this.user.isAdmin || false;
    }

    setLogged (isLogged) {
        this.user.isLogged = isLogged || false;

        return this;
    }

    setConnection (connection) {
        this.user.connection = connection;

        return this;
    }

    async sendMessage (action, data) {
        if (this.user.connection)
            return new Promise((s, f) => {
                try {
                    this.user.connection.emit(action, data, s)
                } catch (e) {
                    f(e)
                }
            });
        return Promise.reject(false);
    }

    async sendStatus () {
        return await this.sendMessage("userStatusUpdate", {
            loggedAs: this.getUserName(),
            isAdmin: this.isAdmin(),
            userId: this.getId()
        })
    }
}

module.exports = class Users {
    constructor (config) {
        this.config = config;
        this.connection = false;

        this.users = []
        this.bannedUsers = []
    }

    getAll () {
        return this.users;
    }

    getUser (userId) {
        if (!userId)
            throw new Error("NO_USERID");

        const user = this.users[userId - 1];

        return user || false;
    }

    getUserByName (userName) {
        let userInstance = false;

        for (let i = 0; i < this.users.length; i++) {
            let user = this.users[i]

            if (user.getUserName() === userName) {
                userInstance = user;
                break;
            }
        }

        return userInstance;
    }

    getBannedUsersList () {
        return this.bannedUsers;
    }

    newUser (userName) {
        userName = cleanUserName(userName);

        if (!userName)
            throw new Error("NO_USERNAME");

        let isAdmin = this.config.adminUserName === userName;

        if (this.getUserByName(userName))
            throw new Error("USER_ALREADY_PRESENT");

        // As we never remove users from array the id can be the array length + 1    
        let userId = this.users.length + 1;

        let user = new User(userId, userName).setAdmin(isAdmin);
        this.users.push(user);

        return user;
    }

    loginUser (userName) {
        let user = this.getUserByName(userName);

        if (!user)
            user = this.newUser(userName);

        if (user.isLoggedIn())
            throw new Error("USER_ALREADY_LOGGED");

        user.setLoggedIn(true);

        return user
    }

    setBroadcastConnection (socket) {
        this.connection = socket;
    }

    /**
     * The method will set instance for single user if id is present, otherwise will save the instance in broadcast mode.
     * 
     * @param {Object} socket Socket or io object related to socket.io instance
     * @param {*} userId User id
     */

    setConnection (socket, userId) {
        if (userId) {
            let userObject = this.getUser(userId);
            if (!userObject)
                throw Error("NO_USER");
            userObject.setConnection(socket);
        } else {
            this.setBroadcastConnection(socket);
        }
        
        return this;
    }

    banUser (userId) {
        if (!userId)
            throw new Error("NO_USERID")

        if (!this.getUser(userId))
            throw new Error("NO_USER")

        if (this.bannedUsers.indexOf(userId) < 0)
            this.bannedUsers.push(userId);
        
        return this;
    }

    async sendMessage (action) {
        if (this.user.connection)
            return new Promise((s, f) => {
                try {
                    this.user.connection.broadcast(action, data, s)
                } catch (e) {
                    f(e)
                }
            });
        return Promise.reject(false)
    }
}