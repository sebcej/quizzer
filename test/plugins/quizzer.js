const apiPath = "../../plugins/quizzer";

const proxyquire = require("proxyquire").noCallThru(),
      chai = require("chai"),
      sinon = require("sinon")
      
      config = require("../../config.json"),
      quizzer = require(apiPath);

describe("plugins", () => {
    let quizzerInstance = null

    // Reinitialize quizzer instance in order to have a clean environment before each test
    beforeEach(() => {
        quizzerInstance = quizzer(config, true);
    })

    context("@quizzer", () => {
        context("login()", () => {
            it("Should login user and return it", () => {
                let response = quizzerInstance.loginUser("tester");
    
                chai.expect(quizzerInstance.getUser("tester")).to.be.an("object")
                chai.expect(quizzerInstance.getUser("nonexistant")).to.equal(false)
                chai.expect(quizzerInstance.getUser("tester")).to.have.property("isAdmin", false)
                chai.expect(response).to.have.property("success", true)
            })
    
            it("Should return error as user is empty string", () => {
                let response = quizzerInstance.loginUser("");
    
                chai.expect(response).to.have.property("error", "NO_USERNAME")
            })
    
            it("Should return error the second time as user is already logged", () => {
                let response = quizzerInstance.loginUser("tester");
                let response2 = quizzerInstance.loginUser("tester");
    
    
                chai.expect(response).to.have.property("success", true)
                chai.expect(response2).to.have.property("error", "USERNAME_ALREADY_USED")
            })
    
            it("Should login admin", () => {
                let response = quizzerInstance.loginUser("admin");
    
                chai.expect(response).to.have.property("success", true)
                chai.expect(quizzerInstance.getUser("admin")).to.have.property("isAdmin", true)
            })
        })

        context("setAdminConnection()", () => {
            it("Should add connection to admin object", () => {
                let response = quizzerInstance.loginUser("admin");

                quizzerInstance.setAdminConnection({})

                chai.expect(response).to.have.property("success", true)
                chai.expect(quizzerInstance.getUser("admin")).to.have.property("connection")
            })

            it("Should fail as no admin is present", () => {
                let response = quizzerInstance.loginUser("tester");

                let connection = quizzerInstance.setAdminConnection({})

                chai.expect(connection).to.have.property("error", "ADMIN_CONNECTION_FAILED")
            })
        })

        context("banUser()", () => {
            it("Should not ban a not present user", () => {
                let banResponse = quizzerInstance.banUser("tester")

                chai.expect(banResponse).to.have.property("error", "NO_USER")
                chai.expect(quizzerInstance.getBannedUsers()).to.be.an('array').lengthOf(0)
            })

            it("Should ban an user and put it in banned array", () => {
                let response = quizzerInstance.loginUser("tester");

                let banResponse = quizzerInstance.banUser("tester")

                chai.expect(response).to.have.property("success", true)
                chai.expect(banResponse).to.have.property("success", true)
                chai.expect(quizzerInstance.getBannedUsers()).to.be.an('array').that.does.include("tester")
            })
        })
    })
})