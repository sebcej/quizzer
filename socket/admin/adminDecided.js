const quizzer = require(`${global.paths.quizzer}`)();

module.exports = async function (socket, data) {
    try {
        await quizzer.adminDecided(this.session.userId, data.question);
    } catch (e) {
        return socket.emit("error-admin", {
            success: false,
            error: e.message
        })
    }
}