const quizzer = require(global.paths.quizzer)();

module.exports = async function (socket, data) {
    if (!data.userId || !data.token)
        return fatalError();

    let user = false;

    try {
        user = quizzer.users.getUser(data.userId);
    } catch (e) {
        return fatalError();
    } 

    if (!user)
        return fatalError();

    user.setConnection(socket).setLoggedIn(true);
    this.session.userId = data.userId;

    await user.sendStatus()
    await quizzer.sendGameStatus(data.userId);
    
}

function fatalError () {
    socket.emit("error", {
        success: false,
        error: "RELOAD_PAGE"
    })
}