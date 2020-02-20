const quizzer = require(`${global.paths.quizzer}`)();

module.exports = function (socket, data) {
    try {
        quizzer.sendResponseToAdmin(socket.session.userId, data.question);
    } catch (e) {
        return socket.emit("error-question", {
            success: false,
            error: e.message
        })
    }
}