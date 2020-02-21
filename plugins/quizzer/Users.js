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

    /**
     * Login user. If not present create one from scratch
     * 
     * @param {String} userName Username to login/create
     */

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
        const user = this.getUser(userId);

        if (!user)
            throw new Error("NO_USER");

        user.setBanned(true);

        return this;
    }

    unbanAll () {
        const usersLength = this.users.length;
        for (let userId = 0; userId < usersLength; userId ++) {
            if (this.users[userId])
                this.users[userId].setBanned(false);
        }

        return this;
    }

    resetAllPoints () {
        const usersLength = this.users.length;
        for (let userId = 0; userId < usersLength; userId ++) {
            if (this.users[userId])
                this.users[userId].setPoints(0);
        }

        return this;
    }

    getBannedUsersList () {
        const usersLength = this.users.length;
        let bannedList = [];
        for (let userIndex = 0; userIndex < usersLength; userIndex ++) {
            let user = this.users[userIndex];
            if (user && user.isBanned())
                bannedList.push(user.getId())
        }

        return bannedList;
    }

    getUsersPointsList () {
        const usersLength = this.users.length;
        let usersPoints = {};
        for (let userIndex = 0; userIndex < usersLength; userIndex ++) {
            let user = this.users[userIndex],
                points = user.getPoints();
            if (user && points > 0)
                usersPoints[user.getId()] = points;
        }

        return usersPoints;
    }

    getLoggedUsersList () {
        const usersLength = this.users.length;
        let loggedUsers = [];
        for (let userIndex = 0; userIndex < usersLength; userIndex ++) {
            let user = this.users[userIndex],
                logged = user.isLoggedIn();
            if (user && logged)
                loggedUsers.push(user.getUserName())
        }

        return loggedUsers;
    }

    /**
     * 
     * Send message to ALL connected users
     * 
     * @param {String} action Action to perform
     * @param {Object} data Object to send
     */

    sendMessage (action, data) {
        if (this.connection)
            return this.connection.sockets.emit(action, data);
        throw new Error("NO_BROADCAST_CONNECTION");
    }
}