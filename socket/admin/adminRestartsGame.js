const quizzer = require(`${global.paths.quizzer}`)();

module.exports = function (socket, data) {
    try {
        quizzer.adminRestartsGame(socket.session.userId, data.question);
    } catch (e) {
        return socket.emit("error-admin", {
            success: false,
            error: e.message
        })
    }
}