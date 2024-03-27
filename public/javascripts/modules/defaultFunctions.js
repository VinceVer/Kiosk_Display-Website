/**
 * defaultFunction.ts
 * written by Vince Dekker: https://github.com/VinceVer
 */
var _a;
import { config_data } from "./dataStorage.js";
const Months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];
/** Creates and returns an element including its textContent or innerHTML.
 * @param type - Element type.
 * @param text - Text to add.
 * @param html - If true, sets innerHTML instead of textContent. (Optional)
 */
export const createElementWithText = (type, text, html) => {
    const element = document.createElement(type);
    html
        ? element.innerHTML = text
        : element.textContent = text;
    return element;
};
/** Replaces the ES2019 Object.fromEntries method with an ES6 compatible function.
 * @param iterable - Array with key-value pairs.
 * @returns an object created from key-value pairs.
 */
export const getObjectFromEntries = (iterable) => {
    return [...iterable].reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
    }, {});
};
/** Returns the value of a cookie.
 * @param id - Identifier of the cookie.
 */
export const getCookie = (id) => {
    const cookies = getObjectFromEntries(document.cookie.split(';').map(cookie => cookie.trim().split('=')));
    return cookies[id] || null;
};
/** Sets the value of a cookie.
 * @param id - Identifier of the cookie.
 * @param value - Value of the cookie. Setting this to null deletes the cookie.
 * @param length - Custom length for the length.
 */
const unix0 = "Thu, 01 Jan 1970 00:00:00 UTC";
export function setCookie(id, value, length) {
    const expirationDate = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);
    if (value === null)
        length = unix0;
    document.cookie = `${id}=${value}; expires=${length ? length : expirationDate.toUTCString()}; path=/`;
}
/** Imports a template and converts it to an HTMLElement.
 * @param template - Template to import and convert.
 */
export const getElementFromTemplate = (template) => {
    const tempElement = document.createElement('div');
    tempElement.appendChild(document.importNode(template.content, true));
    return tempElement.firstChild;
};
/** Returns the formatted value of a property.
 * @param property - The property to format.
 * @param value - The value of the property.
 */
export const getFormattedPropertyValue = (property, value) => {
    return `<span class='t-stress'>${property}</span>: 
            ${typeof value === "string"
        ? value //value.replace(/undefined/gi,"<span style='color: var(--alert-color)'>undefined</span>")
        : `<span style='color: var(--link-color)'>${value}</span>`}`;
};
/** Returns a random value within a range.
 * @param lowerLimit - Minimum value.
 * @param upperLimit - Maximum value.
 * @param lambda - Lambda = 1 results in no bias. Lambda > 1 results in bias towards higher values. Lambda < 1 results in bias for lower values.
 * @param round - If true, returns an integer by rounding the result down.
 */
export const getRandomValue = (lowerLimit, upperLimit, lambda, round) => {
    const randomValue = -Math.log(1 - Math.random()) * (lambda || 1);
    const scaledValue = randomValue * (upperLimit - lowerLimit) + lowerLimit;
    const lowestValue = Math.min(upperLimit, scaledValue);
    if (round)
        return Math.floor(lowestValue);
    return lowestValue;
};
export function getRgbFromHex(hex, array) {
    hex = hex.replace("#", "");
    if (hex.length === 3)
        hex = hex.split("").map(s => s + s).join("");
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    if (array)
        return [r, g, b];
    return { r, g, b };
}
/** Converts an RGB component to HEX. */
const rgbComponentToHex = (value) => {
    const hex = value.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
};
/** Returns a HEX value created from an RGB value.
 * @param r - Red value.
 * @param g - Green value.
 * @param b - Blue value.
 */
export function getHexFromRgb(r, g, b) {
    return "#" + rgbComponentToHex(r) + rgbComponentToHex(g) + rgbComponentToHex(b);
}
/** Returns a corrected value of an urgency level.
 * @param urgency - Original urgency level.
 */
export function getMobileUrgencyLevel(urgency) {
    const yellowBeforePurple = getCookie("layout.yellow_first") === "true";
    let translatedUrgency = urgency === null
        ? "-12"
        : String(urgency);
    if (!yellowBeforePurple)
        return translatedUrgency;
    switch (translatedUrgency) {
        case "1":
            translatedUrgency = "2";
            break;
        case "2":
            translatedUrgency = "1";
            break;
    }
    return translatedUrgency;
}
/** Returns the date in an easily readable format.
 * @param timestamp - Unix timestamp representing the date.
 * @param monthLength - Length of month string. (Optional)wd
 * @param split - If true, returns an array in the form of [date, time].
 */
export const getReadableTime = (timestamp, monthLength, split) => {
    const now = new Date(Number(timestamp) * 1000);
    const day = now.getDate();
    const month = Months[now.getMonth()].slice(0, monthLength);
    const hour = ('0' + now.getHours()).slice(-2);
    const minute = ('0' + now.getMinutes()).slice(-2);
    if (split)
        return [`${day} ${month}`, `${hour}:${minute}`];
    return `${day} ${month} ${hour}:${minute}`;
};
/** Returns the difference between 2 dates in an easily readable format.
 * @param millisecondsDiff - Difference in miliseconds.
 */
export const getReadableTimeSince = (millisecondsDiff) => {
    const secondsDiff = millisecondsDiff / 1000;
    let interval = secondsDiff / 31536000;
    if (interval > 2)
        return Math.floor(interval) + " years ago.";
    interval = secondsDiff / 2592000;
    if (interval > 2)
        return Math.floor(interval) + " months ago.";
    interval = secondsDiff / 86400;
    if (interval > 2)
        return Math.floor(interval) + " days ago.";
    interval = secondsDiff / 3600;
    if (interval > 2)
        return Math.floor(interval) + " hours ago.";
    interval = secondsDiff / 60;
    if (interval > 1)
        return Math.floor(interval) + " minutes ago.";
    return Math.floor(secondsDiff) + " seconds ago.";
};
/** Returns a Unix timestamp based on the time string.
 * @param type - Time string to decode. Leave empty for current date.
 */
export const getUnixTimestamp = (type) => {
    const currentDate = new Date();
    if (!type)
        return Math.floor(currentDate.getTime() / 1000);
    switch (type) {
        case "thisWeek":
        case "curWeek":
            const difference = currentDate.getDay() - 1;
            const startOfWeek = new Date(currentDate);
            startOfWeek.setHours(0, 0, 0, 0);
            startOfWeek.setDate(currentDate.getDate() - difference);
            return Math.floor(startOfWeek.getTime() / 1000);
        case "thisMonth":
        case "curMonth":
            currentDate.setDate(1);
            currentDate.setHours(0, 0, 0, 0);
            return Math.floor(currentDate.getTime() / 1000);
        case "thisYear":
        case "curYear":
            currentDate.setDate(1);
            currentDate.setHours(0, 0, 0, 0);
            currentDate.setMonth(0);
            return Math.floor(currentDate.getTime() / 1000);
        case "pastDay":
        case "past24h":
        case "lastDay":
        case "last24h":
            return Math.floor((currentDate.getTime() - (1 * 24 * 60 * 60 * 1000)) / 1000);
        case "pastWeek":
        case "lastWeek":
            return Math.floor((currentDate.getTime() - (7 * 24 * 60 * 60 * 1000)) / 1000);
        case "pastMonth":
        case "lastMonth":
            return Math.floor((currentDate.getTime() - (30 * 24 * 60 * 60 * 1000)) / 1000);
        case "pastYear":
        case "lastYear":
            return Math.floor((currentDate.getTime() - (365 * 24 * 60 * 60 * 1000)) / 1000);
    }
};
/** Returns true is the variable is an array or object.
 * @param variable - Variable to test.
 */
export const isArrayOrObject = (variable) => {
    return Array.isArray(variable) || typeof variable === 'object' && variable !== null;
};
/** Loads the personal wallpaper of the user.
 * If no personal file is found, the default will be loaded instead.
 */
export function loadWallpaper() {
    let background_file = getCookie("background_file") || "defaultWallpaper.png";
    if (background_file && !background_file.includes("."))
        background_file = `${background_file}.${getCookie(`background_extension[${config_data.location}]`)}`;
    setTimeout(async () => {
        document.body.style.backgroundImage = `url(/images/defaultWallpaper.png)`;
        setTimeout(async () => document.body.style.backgroundImage = `url(/images/${background_file})`, 1);
    }, 0);
}
/** Calculates and sets the font size of an element to perfectly fit its parent.
 * @param textElement - Element(s) to calculate the font size for.
 */
export function makeTextFitContainer(textElement) {
    if (textElement instanceof HTMLElement)
        textElement = [textElement];
    for (let element of textElement) {
        element.style.removeProperty('font-size');
        let fontSize = parseFloat(getComputedStyle(element).fontSize);
        while (element.scrollWidth > element.offsetWidth && fontSize > 0) {
            fontSize--;
            element.style.fontSize = fontSize + "px";
        }
    }
}
/** Maps and returns a HEX value based on a gradient and a value from 0 to 1*10^(n).
 * @param color1 - HEX value representing the lower limit.
 * @param color2 - HEX value representing the upper limit.
 * @param value - Value to map to HEX representation.
 */
export const mapNumberToHex = (color1, color2, value) => {
    while (value > 1)
        value /= 10;
    const Rgb1 = getRgbFromHex(color1, true), Rgb2 = getRgbFromHex(color2, true);
    let interpolatedColor = [];
    for (let i = 0; i < 3; i++) {
        interpolatedColor.push(Math.round(Rgb1[i] + (Rgb2[i] - Rgb1[i]) * value));
    }
    return "#" + interpolatedColor.map(c => c.toString(16).padStart(2, "0")).join("");
};
/** Sends a PUT request with a JSON body.
 * @param url - Url to send request to.
 * @param body - Data to send as an object.
 * @returns a promise.
 */
export const sendRequest = (url, body) => {
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(response => response.json())
            .then(data => resolve(data))
            .catch(error => reject(error));
    });
};
/** Sorts the elements of a container by their property value.
 * @param container - The parent element.
 * @param selector - Only elements with this selector will be sorted.
 * @param property - Property of the elements used to compare.
 * @param descending - If true, the elements will be sorted descending.
 */
export function sortElements(container, selector, property, descending) {
    if (selector === null) {
        selector = "*";
    }
    const elements = Array.from(container.querySelectorAll(selector));
    const quickSort = (array) => {
        if (array.length <= 1) {
            return array;
        }
        const pivot = array[Math.floor(array.length / 2)].getAttribute(property);
        const left = array.filter(item => item.getAttribute(property) < pivot);
        const middle = array.filter(item => item.getAttribute(property) == pivot);
        const right = array.filter(item => item.getAttribute(property) > pivot);
        // Secondary sorting layer
        middle.sort((a, b) => a.id.localeCompare(b.id));
        return [...quickSort(left), ...middle, ...quickSort(right)];
    };
    let sortedElements = quickSort(elements);
    if (descending) {
        sortedElements = sortedElements.reverse();
    }
    // Clear the container
    container.querySelectorAll(selector).forEach(element => element.remove());
    // Append sorted tiles back to the container
    for (const element of sortedElements) {
        container.appendChild(element);
    }
}
/** [Default behaviour]
 * Reset the z-index of all apps when a user clicks on anything other than an app.
 */
(_a = document.querySelector('*')) === null || _a === void 0 ? void 0 : _a.addEventListener('contextmenu', (event) => {
    if (event.ctrlKey)
        return;
    event.preventDefault();
});
