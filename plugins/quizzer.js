/**
 * QUIZZER
 * 
 * Main quizzer implementation. 
 */

const config = require(`${global.paths.config}`);

function quizzer () {
    let t = this, 
        users = [], 
        questions = [],
        gameStatus = {
            
        };

    t.loginUser = (userName) => {
        var userPresent = false;

        if (!userName)
            return {
                error: "NO_USERNAME"
            }

        userName = userName.trim().toLowerCase();

        users.forEach((user) => {
            if (user.name === userName)
                userPresent = true
        })

        if (userPresent)
            return {
                error: "USERNAME_ALREADY_USED"
            }
        
        users.push({
            name: userName
        })

        return {
            success: true
        }
    }

    t.insertQuestion = (userName, question) => {

    }

    return t;
}


module.exports = new quizzer()