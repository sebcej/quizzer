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
    QUESTION_FAILED: "QUESTION_FAILED"
}

class Quizzer {
    constructor (config) {
        this.config = config;

        this.users = new Users(config)

        this.status = {
            questions: [],
            timers: {
                asking: false,
                responding: false
            },
            gameStatus: {
                step: gameStatus.WAITING_QUESTION,
                responseTimer: false,
                approvalTimer: false
            }
        }
    }

    checkResponseWithAdmin () {

    }

    insertQuestion (questionText) {
        this.status.questions.push(questionText);

        // Setting timer globally as someone can enter the game in a random moment
        // This way the user will receive the updated timer
        this.status.gameStatus.responseTimer = config.timeout.question;
        this.sendGameStatus()

        this.status.timers.asking = setInterval(() => {
            this.status.gameStatus.responseTimer -=1;

            if (this.status.gameStatus.responseTimer === 0)
                this.status.gameStatus.responseTimer = false;

            this.sendGameStatus()
        }, 1000)
    }

    reserveResponse (questionId, userId) {
        clearInterval(this.status.timers.asking);
        this.status.timers.asking = false;


    }

    getQuestion (questionIdOverride) {
        const questionId = questionIdOverride || (this.status.questions.length - 1),
              question = this.status.questions[questionId] || {};

        if (this.status.questions.length === 0)
            return {}
            
        return {
            id: questionId,
            text: question[questionId]
        }
    }

    sendGameStatus (userId) {
        const question = this.getQuestion()

        let data = {}

        data = {
            step: this.status.gameStatus.step,
            ...question,
            responseTimer: this.status.gameStatus.responseTimer,
            approvalTimer: this.status.gameStatus.approvalTimer
        }

        if (userId)
            quizzer.users.getUser(userId).sendMessage("questionStatus", data);
        else
            quizzer.users.sendMessage("questionStatus", data);
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