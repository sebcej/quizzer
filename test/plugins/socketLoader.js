const apiPath = "../../plugins/socketLoader";

const proxyquire = require("proxyquire").noCallThru(),
      chai = require("chai"),
      sinon = require("sinon"),
      fs = require("fs-extra");

// Stub require in order to return an arbitrary object
let socketLoaderStub = {
    "socket.io" () {
        return {
            on: sinon.fake()
        }
    },
    "/login.js" (socket, actionData) {
        return true
    }
};
const socketLoader = proxyquire(apiPath, socketLoaderStub);

describe("@plugins", () => {

    afterEach(async () => {
        sinon.restore();
        return sinon.resetBehavior();
    });

    context("socketLoader()", () => {
        it("Should do nothing as no routes are loaded", async () => {
            const fastifyStub = {
                decorate () {return {}}
            }
            // Stub filesystem apis
            sinon.replace(fs, "readdir", sinon.fake.returns([]))

            let apiSession = await socketLoader(fastifyStub, {});

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

            let apiSession = await socketLoader(fastifyStub, {});

            chai.expect(fs.readdir.called).to.equal(true)
            chai.expect(statIsFileFake.called).to.equal(true)
        })
    });
});