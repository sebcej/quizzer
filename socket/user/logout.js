const quizzer = require(global.paths.quizzer)();

module.exports = async function (socket, data) {
    if (this.session.userId) {
        const user = quizzer.users.getUser(this.session.userId);

        if (user) {
            user.setLoggedIn(false);

            socket.emit("moveTo", {
                page: "login"
            });
        }
    }
}