
function cleanUserName (userName) {
    if (!userName)
        return undefined
    return userName.trim().toLowerCase()
}

class User {
    constructor (userName) {
        this.user = {
            userName,
            isLogged: false,
            isAdmin: false,
            connection: false
        }
    }

    getDetails () {
        return this.user;
    }

    isLoggedIn () {
        return this.user.isLogged || false;
    }

    setLoggedIn (isLoggedIn) {
        this.user.isLogged = isLoggedIn;

        return this
    }

    setAdmin (isAdmin) {
        this.user.isAdmin = isAdmin || false

        return this;
    }

    setLogged (isLogged) {
        this.user.isLogged = isLogged || false

        return this;
    }

    setConnection (connection) {
        this.user.connection = connection;

        return this;
    }

    sendMessage (action, data) {
        return this.connection.emit(action, data)
    }
}

module.exports = class Users {
    constructor (config) {
        this.config = config;
        this.connection = false;

        this.users = {}
        this.bannedUsers = []
    }

    setBroadcastConnection (socket) {
        this.connection = socket;
    }

    newUser (userName) {
        userName = cleanUserName(userName)

        if (!userName)
            throw new Error("NO_USERNAME")

        let isAdmin = this.config.adminUserName === userName;

        if (this.users[userName])
            throw new Error("USER_ALREADY_PRESENT")

        let user = new User(userName).setAdmin(isAdmin)
        this.users[userName] = user

        return user;
    }

    getUser (userName) {
        userName = cleanUserName(userName)

        if (!userName)
            throw new Error("NO_USERNAME")

        const user = this.users[userName];

        return user || false
    }

    getBannedUsersList () {
        return this.bannedUsers;
    }

    banUser (userName) {
        userName = cleanUserName(userName)

        if (!userName)
            throw new Error("NO_USERNAME")

        if (!this.users[userName])
            throw new Error("NO_USER")

        if (this.bannedUsers.indexOf(userName) < 0)
            this.bannedUsers.push(userName)
        
        return this;
    }
}