const User = require("../../../plugins/quizzer/User"),
      chai = require("chai"),
      sinon = require("sinon");

describe("plugins", function () {
    context("@quizzer-User", () => {
        context("checkToken()", () => {
            it("Should create hash and confirm it", () => {
                const user = new User(1, "tester");

                chai.expect(user.checkToken(1, user.getToken())).to.equal(true);
            })

            it("Should fail as userId has been tampered", () => {
                const user = new User(2, "tester");

                chai.expect(user.checkToken(1, user.getToken())).to.equal(false);
            })

            it("Should fail as hash has been tampered", () => {
                const user = new User(2, "tester");

                chai.expect(user.checkToken(1, user.getToken() + "blah")).to.equal(false);
            })

            it("Should fail as user accout has been recreated", () => {
                const user = new User(2, "tester");

                user.creationTime = user.creationTime + 1

                chai.expect(user.checkToken(1, user.getToken())).to.equal(false);
            })
        })
    })
})