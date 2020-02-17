/**
 * QUIZZER
 * 
 * Main quizzer implementation. 
 */

const Users = require("./Users");

let quizzerInstance = false;

class Quizzer {
    constructor (config) {
        this.config = config;

        this.users = new Users(config)

        this.status = {
            questions: [],
            gameStatus: {
                userResponding: false,
                awaitingResponse: false,
                awaitingApproval: false
            }
        }
    }

    setConnection (socket, user) {
        if (user) {
            let userObject = this.users.getUser(user)
            if (!userObject)
                throw Error("NO_USER")
            userObject.setConnection(socket);
        } else {
            this.users.setBroadcastConnection(socket);
        }
        
        return this;
    }

    loginUser (userName) {
        try {
            let user = this.users.getUser(userName);

            if (!user)
                user = this.users.newUser(userName);
                
            if (user.isLoggedIn())
                throw new Error("USER_ALREADY_LOGGED");

            user.setLoggedIn(true);

            return user
        } catch (e) {
            return {
                success: false,
                error: e.message
            }
        }
    }

    getUser (userName) {
        return this.users.getUser(userName) || false;
    }

    getUsers () {
        return this.users || false;
    }

    checkResponseWithAdmin () {

    }

    banUser (userName) {
        try {
            this.users.banUser(userName);
        } catch(e) {
            return {
                success: false,
                error: e
            }
        }

        return {
            success: true
        }
    }

    getBannedUsers () {
        return this.users.getBannedUsers();
    }

    setUserResponding (userName) {
        this.status.gameStatus.userResponding = this.users.getUser(userName);
        
        return this;
    }

    insertQuestion (questionText) {

    }

    broadcastQuestion (questionIndex, userFilter) {
        const questionId = questionIndex || (this.status.questions.length - 1),
              question = this.status.questions[questionId] || {};

        let data = {
            userFilter: userFilter || false,
            id: questionId,
            text: question.text,
            awaitingResponse: question.awaitingResponse,
            awaitingApproval: question.awaitingApproval
        }

        // Send data to a single user. Use direct connection if available, fallback to broadcast filtered by client side if errors has occurred
        if (userFilter) {
            if (!this.getUser(userFilter))
                return {
                    error: "NO_USER"
                }

            let user = this.getUser(userFilter);

            if (user.connection)
                user.connection.emit("questionStatus", data);
            return;
        }
            

        this.connection.broadcast("questionStatus", data);
    }
}


module.exports = function (config, reinit) {
    if (reinit)
        quizzerInstance = false;
    if (quizzerInstance)
        return quizzerInstance
    if (!config)
        return new Error("Config is needed for initialization");
    return quizzerInstance = new Quizzer(config)
}