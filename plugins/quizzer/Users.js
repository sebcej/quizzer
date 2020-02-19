const User = require("./User");

function cleanUserName (userName) {
    if (!userName)
        return undefined
    return userName.trim().toLowerCase()
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
        const user = this.users.getUser(userId);
        user.setBanned(true);

        return this;
    }

    unbanUsers () {
        for (let user in this.users) {
            this.users[user].setBanned(false)
        }

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