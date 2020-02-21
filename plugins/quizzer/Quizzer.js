/**
 * QUIZZER
 * 
 * Main quizzer implementation. 
 */

const Users = require("./Users");

let quizzerInstance = false;

const gameStatus = {
    WAITING_QUESTION: "WAITING_QUESTION",
    ASKING: "ASKING",
    RESERVED: "RESERVED",
    WAIT_CONFIRM: "WAIT_CONFIRM",
    USER_FAILED: "USER_FAILED",
    QUESTION_FAILED: "QUESTION_FAILED",
    QUESTION_RESPONSE_SUCCESS: "QUESTION_RESPONSE_SUCCESS",
    QUESTION_RESPONSE_FAILED: "QUESTION_RESPONSE_FAILED",
    GAME_FINISH: "GAME_FINISH"
}

class Quizzer {
    constructor (config) {
        this.config = config;

        this.users = new Users(config)

        this.users.attachEvent("login", () => this.sendGameStatus());

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
                timer: false
            }
        }
    }

    /**
     * -----------------
     * 
     * Game logic
     */

    /**
     * First step of game. The administrator asks a question to all users.
     * 
     * @param {Number} adminId Id of admin user
     * @param {String} questionText Text of question that will be asked to all available users
     */

    async insertQuestion (adminId, questionText) {

        // Case when user has waited too much or has failed the response
        // The user is banned and the question restarts with new timer
        if (questionText !== false && adminId !== false) {
            if (this.status.gameStatus.step === gameStatus.ASKING)
                throw new Error("DUPLICATE_REQUEST")

            const admin = this.users.getUser(adminId);

            if (!admin.isAdmin())
                throw new Error("NO_ADMIN")

            if (questionText === "")
                throw new Error("NO_TEXT")

            this.users.unbanAll();
            this.status.gameStatus.reservedUser = false;

            // Setting timer globally as someone can enter the game in a random moment
            // This way the user will receive the updated timer
            this.status.gameStatus.timer = this.config.timeouts.question;

            this.status.questions.push({
                text: questionText,
                resolvedBy: false
            });
        } else {
            // After first time the users have only 10 seconds to respond
            this.status.gameStatus.timer = this.config.timeouts.questionAfterFailure;
        }

        clearInterval(this.status.intervals.asking);
        clearInterval(this.status.intervals.responding);

        this.status.gameStatus.step = gameStatus.ASKING;
        this.sendGameStatus();

        this.status.intervals.asking = setInterval(() => {
            this.status.gameStatus.timer -=1;

            if (this.status.gameStatus.timer === 0) {
                this.status.gameStatus.timer = false;

                this.status.gameStatus.step = gameStatus.QUESTION_FAILED;

                // Show failure message and then move forward
                setTimeout(() =>  {
                    clearInterval(this.status.intervals.asking);
                    clearInterval(this.status.intervals.responding);
                    this.status.gameStatus.step = gameStatus.WAITING_QUESTION
                    this.sendGameStatus();
                }, 5000)
                clearInterval(this.status.intervals.asking);
            }

            this.sendGameStatus();
        }, 1000)
    }

    /**
     * The user that knows the answer will click on the button and halt the game.
     * 
     * @param {Number} questionId Id of question. Used to check if the user is synced with the correct question
     * @param {Number} userId Id of user that is responding
     */

    async reserveResponse (questionId, userId) {
        if (this.status.gameStatus.step !== gameStatus.ASKING)
            throw new Error("BROKEN_FLOW");

        if (this.status.questions.length - 1 !== questionId)
            throw new Error("QUESTION_ID_MISMATCH");

        const user = this.users.getUser(userId);

        if (user.isBanned())
            throw new Error("BANNED_USER");

        this.status.gameStatus.reservedUser = user;

        clearInterval(this.status.intervals.asking);


        this.status.gameStatus.timer = this.config.timeouts.respond;
        this.status.gameStatus.step = gameStatus.RESERVED;
        user.sendMessage("reservationAccepted", {
            questionId
        });

        this.sendGameStatus()

        this.status.intervals.responding = setInterval(() => {
            this.status.gameStatus.timer -=1;

            // User failed to respond in time
            // Banning it and restarting with same question
            if (this.status.gameStatus.timer === 0) {
                this.status.gameStatus.timer = this.config.timeouts.questionAfterFailure;
                
                this.users.banUser(userId);

                this.status.gameStatus.step = gameStatus.USER_FAILED;

                // Return to first step again
                setTimeout(() =>  this.insertQuestion(false, false), 5000);
                clearInterval(this.status.intervals.responding)
            }

            this.sendGameStatus();
        }, 1000)
    }

    /**
     * The user will respond to question and send it to administrator
     * 
     * @param {Number} questionId Id of question
     * @param {String} responseText Answer to question
     */

    async sendResponseToAdmin (questionId, userId, responseText) {
        if (this.status.gameStatus.step !== gameStatus.RESERVED)
            throw new Error("BROKEN_FLOW");

        if (!responseText || responseText.trim() == "")
            throw new Error("NO_RESPONSE");

        if (this.status.questions.length - 1 !== questionId)
            throw new Error("QUESTION_ID_MISMATCH");

        const admin = this.users.getUserByName(this.config.adminUserName),
            user = this.status.gameStatus.reservedUser,
            requestedUser = this.users.getUser(userId);

        if (!requestedUser || !user || (user.getId() !== requestedUser.getId()))
            throw new Error("USER_MISMATCH")

        if (user.isBanned())
            throw new Error("USER_BANNED")

        clearInterval(this.status.intervals.responding);

        this.status.gameStatus.step = gameStatus.WAIT_CONFIRM;

        if (admin && admin.isAdmin() && user)
            admin.sendMessage("responseFromUser", {
                user: user.getUserName(),
                userId: user.getId(),
                questionId,
                responseText
            });

        this.sendGameStatus();
        
        // In case the admin log out the system will wait until reenters. This data must be saved
        this.status.adminRecover = {
            user: user.getUserName(),
            userId: user.getId(),
            questionId,
            responseText
        }
    }

    /**
     * The administrator will check the answer and choose if the response is correct or not
     * 
     * @param {Number} questionId Id of question processed
     * @param {Number} adminId Id of admin
     * @param {Boolean} accepted 
     */

    adminDecided (questionId, adminId, accepted) {
        if (this.status.gameStatus.step !== gameStatus.WAIT_CONFIRM)
            throw new Error("BROKEN_FLOW");
        
        if (this.status.questions.length - 1 !== questionId)
            throw new Error("QUESTION_ID_MISMATCH");

        this.status.adminRecover = false;

        const responder = this.status.gameStatus.reservedUser,
              admin = this.users.getUser(adminId);

        if (!admin || !admin.isAdmin())
            throw new Error("NO_ADMIN");

        // Answer to question is correct!
        if (accepted) {
            this.status.gameStatus.step = gameStatus.QUESTION_RESPONSE_SUCCESS;
            responder.increasePoints();
            
            // We have a winner!!! :D
            if (responder.getPoints() === this.config.pointsToWin)
                this.status.gameStatus.step = gameStatus.GAME_FINISH;
            else
                setTimeout(() =>  {
                    // Winned only the round

                    this.status.gameStatus.step = gameStatus.WAITING_QUESTION;
                    this.sendGameStatus();
                }, 3000);

            this.sendGameStatus();

            return;
        }

        this.status.gameStatus.step = gameStatus.QUESTION_RESPONSE_FAILED;
        responder.setBanned(true);

        this.sendGameStatus();

        // Return to question
        setTimeout(() =>  this.insertQuestion(false, false), 3000);
    }

    /**
     * Admin can in every moment reset game and restart it.
     * 
     */
    adminRestartsGame (adminId) {
        const admin = this.users.getUser(adminId);

        if (!admin || !admin.isAdmin())
            throw new Error("NO_ADMIN");

        this.status.gameStatus.step = gameStatus.WAITING_QUESTION;
        this.status.questions = []

        clearInterval(this.status.intervals.asking);
        clearInterval(this.status.intervals.responding);

        this.status.gameStatus.timer = false;
        this.status.gameStatus.reservedUser = false

        this.users.unbanAll();
        this.users.resetAllPoints();
        this.sendGameStatus();
    }


    /**
     * ------------------------
     * Game management
     */

    getQuestion (questionIdOverride) {
        const questionId = questionIdOverride || (this.status.questions.length - 1),
              question = this.status.questions[questionId] || {};

        if (this.status.questions.length === 0)
            return {}

        return {
            id: questionId,
            text: question.text
        }
    }

    sendGameStatus (userId) {
        const question = this.getQuestion()

        let data = {},
            user = this.status.gameStatus.reservedUser,
            userObj = false;

        if (user)
            userObj = {
                userName: user.getUserName(),
                id: user.getId()
            }

        data = {
            step: this.status.gameStatus.step,
            reservedUser: userObj,
            bannedUsers: this.users.getBannedUsersList(),
            points: this.users.getUsersPointsList(),
            loggedInUsers: this.users.getLoggedUsersList(),
            maxPoints: this.config.pointsToWin,
            ...question,
            timer: this.status.gameStatus.timer
        }

        if (userId)
            this.users.getUser(userId).sendMessage("questionStatus", data);
        else
            this.users.sendMessage("questionStatus", data);
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
        throw new Error("Config is needed for initialization");
    return quizzerInstance = new Quizzer(config)
}