/**
 * QUIZZER
 * 
 * Main quizzer implementation. 
 */

let quizzerInstance = false;

function setTimers (status, config) {

}

function cleanUserName (userName) {
    if (!userName)
        return undefined
    return userName.trim().toLowerCase()
}
class Quizzer {
    constructor (config) {
        this.config = config;
        this.connection = false;

        this.status = {
            users: {},
            questions: [],
            gameStatus: {
                bannedUsers: [],
                userResponding: false,
                awaitingResponse: false,
                awaitingApproval: false
            }
        }
    }

    setConnection (io) {
        if (!this.connection)
            this.connection = io;
    }

    loginUser (userName) {
        if (!userName)
            return {
                error: "NO_USERNAME"
            }

        userName = cleanUserName(userName);

        let user = this.status.users[userName]

        if (user && user.loggedIn === true)
            return {
                error: "USERNAME_ALREADY_USED"
            }
        else if (user) {
            this.status.users[userName].loggedIn = true
        } else {
            let isAdmin = this.config.adminUserName === userName;

            this.status.users[userName] = {
                loggedIn: true,
                isAdmin,
                isBanned: this.status.gameStatus.bannedUsers.indexOf(userName) >= 0
            }
        }

        return {
            success: true
        }
    }

    getUser (userName) {
        return this.status.users[userName] || false
    }

    setAdminConnection (socket) {
        let adminUser = this.status.users[this.config.adminUserName];

        if (adminUser && adminUser.loggedIn)
            this.status.users[this.config.adminUserName].connection = socket;
        else
            return {
                error: "ADMIN_CONNECTION_FAILED"
            }
    }

    checkResponseWithAdmin () {

    }

    banUser (userName) {
        userName = cleanUserName(userName)
        if (!this.status.users[userName])
            return {
                error: "NO_USER"
            }

        if (userName !== "" && this.status.gameStatus.bannedUsers.indexOf(userName) < 0)
            this.status.gameStatus.bannedUsers.push(userName)

        return {
            success: true
        }
    }

    getBannedUsers () {
        return this.status.gameStatus.bannedUsers;
    }

    setUserResponding (userName) {
        userName = cleanUserName(userName)
        if (!this.status.users[userName])
            return {
                error: "NO_USER"
            }

        this.status.gameStatus.userResponding = userName;
        this.updateUsers()
    }

    insertQuestion (questionText) {

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