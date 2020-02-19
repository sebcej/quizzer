const apiPath = "../../plugins/socketLoader";

const proxyquire = require("proxyquire").noCallThru(),
      chai = require("chai"),
      sinon = require("sinon"),
      fs = require("fs-extra");

// Stub require in order to return an arbitrary object
let socketLoaderStub = {
    "socket.io" () {
        return {
            on: function (type, callback) {
                // Save the event function in order to call it in a second moment
                actionsStack[type] = callback;
            },
            send: function (action, data) {
                actionsStack["socketSend"] = {
                    action,
                    data
                }
            }
        }
    },
    "/socket/login.js" (socket, actionData) {
        actionsStack["login"] = actionData
    }
}, actionsStack = {};
const socketLoader = proxyquire(apiPath, socketLoaderStub);

describe("plugins", () => {

    afterEach(async () => {
        sinon.restore();
        actionsStack = {}
        return sinon.resetBehavior();
    });

    context("@socketLoader", () => {
        it("Should do nothing as no routes are loaded", async () => {
            const fastifyStub = {
                decorate () {return {}}
            }
            // Stub filesystem apis
            sinon.replace(fs, "readdir", sinon.fake.returns([]))

            let apiSession = await socketLoader(fastifyStub, {
                root: ""
            });

            chai.expect(fs.readdir.called).to.equal(true);
        })

        it("Should load one file in directory root and call it", async () => {
            const fastifyStub = {
                decorate () {return {}},
                log: {
                    debug: () => {}
                }
            }

            // Stub filesystem apis
            let statIsFileFake = sinon.fake.returns(true)
            sinon.replace(fs, "readdir", sinon.fake.returns(["login.js"]))
            sinon.replace(fs, "stat", sinon.fake.returns({
                isFile: statIsFileFake
            }));

            let apiSession = await socketLoader(fastifyStub, {
                root: ""
            });

            chai.expect(actionsStack.connection).to.not.be.undefined;

            let socketStub = {
                on: sinon.fake()
            }
            
            actionsStack.connection(socketStub);

            chai.expect(socketStub.on.called).to.equal(true)

            chai.expect(fs.readdir.called).to.equal(true)
            chai.expect(statIsFileFake.called).to.equal(true)
        });

        it("Should save object and get it on action", async () => {
            const fastifyStub = {
                decorate () {return {}},
                log: {
                    debug: () => {}
                }
            }

            // Stub filesystem apis
            let statIsFileFake = sinon.fake.returns(true)
            sinon.replace(fs, "readdir", sinon.fake.returns(["login.js"]))
            sinon.replace(fs, "stat", sinon.fake.returns({
                isFile: statIsFileFake
            }));

            let apiSession = await socketLoader(fastifyStub, {
                root: ""
            });

            chai.expect(actionsStack.connection).to.not.be.undefined;
            actionsStack.connection(socketLoaderStub["socket.io"]());

            chai.expect(actionsStack.action).to.not.be.undefined; // Check if action has been called from connection
            
            actionsStack.action({
                name: "login",
                data: {
                    test: true
                }
            })

            chai.expect(actionsStack.login).to.not.be.undefined; // Check if the object has been updated, so the socket function has been called
        });

        it("Should fail as not existent route was called", async () => {
            const fastifyStub = {
                decorate () {return {}},
                log: {
                    debug: () => {}
                }
            }

            // Stub filesystem apis
            let statIsFileFake = sinon.fake.returns(true)
            sinon.replace(fs, "readdir", sinon.fake.returns(["login.js"]))
            sinon.replace(fs, "stat", sinon.fake.returns({
                isFile: statIsFileFake
            }));

            let apiSession = await socketLoader(fastifyStub, {
                root: ""
            });

            chai.expect(actionsStack.connection).to.not.be.undefined;
            actionsStack.connection(socketLoaderStub["socket.io"]());

            chai.expect(actionsStack.action).to.not.be.undefined; // Check if action has been called from connection
            
            actionsStack.action({
                name: "login.user",
                data: {
                    test: true
                }
            })

            // Sent error response
            chai.expect(actionsStack.socketSend).to.not.be.undefined;
        });
    });
});