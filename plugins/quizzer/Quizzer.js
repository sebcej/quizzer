/**
 * QUIZZER
 * 
 * Main quizzer implementation. 
 */

const Users = require("./Users"),
      config = require(global.paths.config);

let quizzerInstance = false;

const gameStatus = {
    WAITING_QUESTION: "WAITING_QUESTION",
    ASKING: "ASKING",
    RESERVED: "RESERVED",
    WAIT_CONFIRM: "WAIT_CONFIRM",
    USER_FAILED: "USER_FAILED",
    QUESTION_FAILED: "QUESTION_FAILED",
    QUESTION_SUCCESS: "QUESTION_SUCCESS"
}

class Quizzer {
    constructor (config) {
        this.config = config;

        this.users = new Users(config)

        this.status = {
            questions: [],
            adminRecover: false,
            intervals: {
                asking: false,
                responding: false
            },
            gameStatus: {
                step: gameStatus.WAITING_QUESTION,
                reservedUser: false,
                points: {},
                reserveTimer: false,
                respondTimer: false
            }
        }
    }

    async insertQuestion (questionText) {
        this.status.questions.push({
            text: questionText,
            resolvedBy: false
        });

        this.users.unbanUsers();

        this.status.gameStatus.step = gameStatus.ASKING;

        // Setting timer globally as someone can enter the game in a random moment
        // This way the user will receive the updated timer
        this.status.gameStatus.reserveTimer = config.timeout.question;
        this.sendGameStatus();

        this.status.timers.asking = setInterval(() => {
            this.status.gameStatus.reserveTimer -=1;

            if (this.status.gameStatus.reserveTimer === 0) {
                this.status.gameStatus.reserveTimer = false;

                this.status.gameStatus.step = gameStatus.QUESTION_FAILED;
                clearInterval(this.status.timers.asking);
            }

            this.sendGameStatus();
        }, 1000)
    }

    async reserveResponse (questionId, userId) {
        if (this.status.gameStatus.step !== gameStatus.ASKING)
            throw new Error("BROKEN_FLOW");

        if (this.status.questions.length - 1 !== questionId)
            throw new Error("QUESTION_ID_MISMATCH");

        const user = this.users.getUser(userId);

        if (user.isBanned())
            return;

        clearInterval(this.status.timers.asking);
        this.status.gameStatus.reserveTimer = 0;

        this.status.gameStatus.respondTimer = config.timeout.respond;
        await user.sendMessage("reservationAccepted", {
            questionId
        });
        this.sendGameStatus()

        this.status.timer.responding = setInterval(() => {
            this.status.gameStatus.respondTimer -=1;

            if (this.status.gameStatus.respondTimer === 0) {
                this.status.gameStatus.respondTimer = false;

                this.status.gameStatus.step = gameStatus.USER_FAILED;
                clearInterval(this.status.timer.responding)
            }

            this.sendGameStatus();
        }, 1000)
    }

    async sendResponseToAdmin (userId, questionId, responseText) {
        if (this.status.gameStatus.step !== gameStatus.RESERVED)
            throw new Error("BROKEN_FLOW");

        if (responseText.trim() == "")
            return;

        if (this.status.questions.length - 1 !== questionId)
            throw new Error("QUESTION_ID_MISMATCH");

        this.status.gameStatus.step = gameStatus.WAIT_CONFIRM;

        const admin = this.users.getUserByName(config.adminUserName),
            user = this.users.getUser(userId);

        if (admin && admin.isAdmin() && user)
            await admin.sendMessage("responseFromUser", {
                user: user.getUserName(),
                questionId,
                responseText
            });
        
        // In case the amin log out the system will wait until reenters. This data must be saved
        this.status.adminRecover = {
            userId,
            questionId,
            responseText
        }
    }

    adminDecided (questionId, accepted) {
        if (this.status.gameStatus.step !== gameStatus.WAIT_CONFIRM)
            throw new Error("BROKEN_FLOW");
        
        if (this.status.questions.length - 1 !== questionId)
            throw new Error("QUESTION_ID_MISMATCH");

        this.status.adminRecover = false;

        if (accepted) {
            this.status.gameStatus.step = gameStatus.QUESTION_SUCCESS;

            return;
        }

        this.status.gameStatus.step = gameStatus.QUESTION_SUCCESS;
    }

    getQuestion (questionIdOverride) {
        const questionId = questionIdOverride || (this.status.questions.length - 1),
              question = this.status.questions[questionId] || {};

        if (this.status.questions.length === 0)
            return {}

        return {
            id: questionId,
            text: question[questionId].text
        }
    }

    sendGameStatus (userId) {
        const question = this.getQuestion()

        let data = {}

        data = {
            step: this.status.gameStatus.step,
            ...question,
            responseTimer: this.status.gameStatus.responseTimer,
            sendTimer: this.status.gameStatus.sendTimer
        }

        if (userId)
            quizzer.users.getUser(userId).sendMessage("questionStatus", data);
        else
            quizzer.users.sendMessage("questionStatus", data);
    }


    recoverAdminStatus (adminId) {
        const admin = this.users.getUser(adminId);

        if (this.status.adminRecover && admin && admin.isAdmin())
            admin.sendMessage("responseFromUser", this.status.adminRecover);
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