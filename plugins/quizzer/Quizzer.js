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

    checkResponseWithAdmin () {

    }

    insertQuestion (questionText) {

    }

    getQuestion (questionIdOverride) {
        const questionId = questionIdOverride || (this.status.questions.length - 1),
              question = this.status.questions[questionId] || {};

        return {
            id: questionIdOverride,
            text: question[questionId]
        }
    }

    sendGameStatus (userId) {
        const question = this.getQuestion()

        let data = {}

        if (question)
            data = {
                status: "asking",
                id: question.id,
                text: question.text,
                awaitingResponse: question.awaitingResponse,
                awaitingApproval: question.awaitingApproval
            }
        else 
            data = {
                status: "awaitingQuestion"
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