import io from 'socket.io-client';
import api from "./api"

const socket = io(`//${window.location.host}/`);

let user = false

/**
 * 
 * @param {String} eventName Messagwe to be received from server
 * @param {Function} callback Callback to execute for each received message
 */

export function registerEvent (eventName, callback) {
    return socket.on(eventName, data => callback(data));
}

/**
 * 
 * @param {String} eventName Event to send to server
 * @param {*} data Data to send to server
 */

export function sendEvent (eventName, data) {
    if (!user)
        throw new Error("NO_USER")
    socket.emit("action", {
        name: eventName,
        user,
        data
    });
}

/**
 * 
 * @param {String} eventName Name of the event to unregister
 * @param {Function} callback Specific function to unregister in the scope of the event
 */
export function unregisterEvent(eventName, callback) {
    return socket.off(eventName, callback)
}

/**
 * 
 * @param {String} token Register token for current user
 */

export function registerUser (userId, token) {
    user = {
        userId, 
        token
    }
}