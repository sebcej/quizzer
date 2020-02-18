import io from 'socket.io-client';
import api from "./api"

const socket = io(`http://localhost:8080`);

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
    socket.emit("action", {
        name: eventName,
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