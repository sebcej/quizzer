/**
 * User class
 * 
 * Contains all main single user data. 
 * 
 * - Socket connection to server
 * - Auth token
 * - Points
 * - Ban status
 */

const md5 = require('md5');

function makeToken (userId, user) {
    return md5(`${userId} + ${process.env.SECRET} + token + ${user.userName} + ${user.creationTime}`)
}

module.exports = class User {
    constructor (id, userName) {
        this.user = {
            id,
            userName,
            isLogged: false,
            isAdmin: false,
            isBanned: false,
            points: 0,
            connection: false,
            creationTime: new Date().getTime()
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

    getPoints () {
        return this.user.points;
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

    setPoints (number) {
        this.user.points = number || 0;

        return this;
    }

    increasePoints (number) {
        this.user.points += number || 1;

        return this;
    }

    /**
     * Chedck that token corresponds to the one present on client side. Check also that the userId has not been tampered
     * 
     * @param {Number} userId User id
     * @param {String} receivedToken Authentication token
     */

    checkToken (userId, receivedToken) {
        return makeToken(userId, this.user) === this.token && this.token  === receivedToken;
    }

    /**
     * Set connection to frontend
     * 
     * @param {Socket} connection User's socket
     */

    setConnection (connection) {
        this.lastInteraction = new Date().getTime();

        // Force disconnection from old frontend if present
        if (this.user.connection && this.user.connection !== connection)
            this.user.connection.disconnect();

        this.user.connection = connection;

        return this;
    }

    /**
     * 
     * @param {String} action Action that code must perform on client's side
     * @param {Object} data Data to be sent to frontend
     */

    async sendMessage (action, data) {
        if (this.user.connection)
            return new Promise((s, f) => {
                try {
                    this.user.connection.emit(action, data, s)
                } catch (e) {
                    f(e)
                }
            });
        throw Error("NO_CONNECTION")
    }

    /**
     * Send user status directly to user's terminal
     */

    async sendStatus () {
        return await this.sendMessage("userStatusUpdate", {
            loggedAs: this.getUserName(),
            isAdmin: this.isAdmin(),
            userId: this.getId()
        });
    }
}