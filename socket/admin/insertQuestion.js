const quizzer = require(`${global.paths.quizzer}`)();

module.exports = function (socket, data) {
    console.log("Adding question", data.question);

    quizzer.insertQuestion(data.question);
}