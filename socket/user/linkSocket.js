const quizzer = require(global.paths.quizzer)();

module.exports = async function (socket, data) {
    if (!data.userId || !data.token)
        return;

    const user = quizzer.users.getUser(data.userId)

    if (!user)
        return;

    // Check if userId corresponds to user token
    if (data.token === user.getToken()) {
        user.setConnection(socket).setLogged(true);
        this.session.userId = data.userId;

        await user.sendStatus()
        await quizzer.sendGameStatus(data.userId);
    }
     
}