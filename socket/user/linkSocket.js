const quizzer = require(global.paths.quizzer)();

module.exports = function (socket, data) {
    const userId = socket.session.userId;

    console.log("Connectiong session of user: ", data.userId, userId);
    if (data.userId === userId) {
        const user = quizzer.users.getUser(userId);
        user.setConnection(socket);
        quizzer.sendGameStatus(userId);
        user.sendStatus()
    }
        
}