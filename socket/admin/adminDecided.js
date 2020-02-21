const quizzer = require(`${global.paths.quizzer}`)();

module.exports = async function (socket, data) {
    try {
        await quizzer.adminDecided(data.questionId, this.session.userId, data.response);
    } catch (e) {
        return socket.emit("error-admin", {
            success: false,
            error: e.message
        })
    }
}