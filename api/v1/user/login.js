const quizzer = require(`${global.paths.quizzer}`)();

module.exports = {
    method: "POST",
    onRequest (req, res) {
        try {
            var user = quizzer.users.loginUser(req.body.username);
            
            res.send({
                success: true,
                userId: user.getId(),
                token: user.getToken()
            })
        } catch (e) {
            return res.send({
                success: false,
                error: e.message
            })
        }
    }
}