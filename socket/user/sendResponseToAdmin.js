const quizzer = require(`${global.paths.quizzer}`)();

module.exports = async function (socket, data) {
    try {
        await quizzer.sendResponseToAdmin(data.questionId, this.session.userId, data.question);
    } catch (e) {
        return socket.emit("error-question", {
            success: false,
            error: e.message
        })
    }
}