const quizzer = require(`${global.paths.quizzer}`)();

module.exports = {
    method: "POST",
    onRequest (req, res) {
        try {
            var user = quizzer.users.loginUser(req.body.username);

            req.session.username = user.getUserName()
            req.session.isAdmin = user.isAdmin()
            req.session.userId = user.getId()

            console.log("Fastify session", req.session.sessionId);
        } catch (e) {
            return res.send({
                success: false,
                error: e.message
            })
        }
    }
}