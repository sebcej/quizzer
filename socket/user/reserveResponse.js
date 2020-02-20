const quizzer = require(`${global.paths.quizzer}`)();

module.exports = async function (socket, data) {
    try {
        await quizzer.reserveResponse(data.questionId, this.session.userId);
    } catch (e) {
        return socket.emit("error-question", {
            success: false,
            error: e.message
        })
    }
}