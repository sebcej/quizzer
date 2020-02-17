const quizzer = require(`${global.paths.plugins}/quizzer`)(),
      config = require(global.paths.config);

module.exports = function (socket) {
    if (socket.session.username && socket.session.username === config.adminUserName && socket.session.isAdmin) {
        quizzer.setAdminConnection(socket);
    }
}