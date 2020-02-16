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

    }

    t.insertQuestion = (userName, question) => {

    }

    return t;
}


module.exports = new quizzer()