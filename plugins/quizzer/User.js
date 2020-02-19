const md5 = require('md5');

function makeToken (userId, user) {
    return md5(`${userId} + ${process.env.SECRET} + token + ${user.userName}`)
}

module.exports = class User {
    constructor (id, userName) {
        this.user = {
            id,
            userName,
            isLogged: false,
            isAdmin: false,
            isBanned: false,
            connection: false
        }

        this.token = makeToken(id, this.user);
        this.lastInteraction = new Date().getTime();
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
        return this.token;
    }

    areTokensEqual (token) {
        return token === this.token;
    }

    isLoggedIn () {
        return this.user.isLogged || false;
    }

    isAdmin () {
        return this.user.isAdmin || false;
    }

    isBanned () {
        return this.user.isBanned || false;
    }

    setLoggedIn (isLoggedIn) {
        this.user.isLogged = isLoggedIn;

        return this
    }

    setAdmin (isAdmin) {
        this.user.isAdmin = isAdmin || false;

        return this;
    }

    setBanned (isBanned) {
        return this.user.isBanned = isBanned || false;
    }

    setLogged (isLogged) {
        this.user.isLogged = isLogged || false;

        return this;
    }

    checkToken (userId) {
        return makeToken(userId, this.user) === this.token
    }

    setConnection (connection) {
        this.lastInteraction = new Date().getTime();
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
        });
    }
}