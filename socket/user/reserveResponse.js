const quizzer = require(`${global.paths.quizzer}`)();

module.exports = function (socket, data) {
    try {
        quizzer.reserveResponse(socket.session.userId, data.question);
    } catch (e) {
        return socket.emit("error-question", {
            success: false,
            error: e.message
        })
    }
}