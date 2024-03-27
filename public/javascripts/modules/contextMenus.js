/**
 * defaultDisplayElements.ts
 * written by Vince Dekker: https://github.com/VinceVer
 */
import { config_data, status_database } from "./dataStorage.js";
import { toggleIgnoreKiosk } from "./defaultDisplayElements.js";
import { getElementFromTemplate, sendRequest } from "./defaultFunctions.js";
const usingMobile = /Mobi|Android/i.test(navigator.userAgent);
/** Changes the status of a kiosk to Online.
 * @param element - Active contextmenu.
 * @param id - Id of the kiosk, device or application.
 */
const setOnline = async (element, id) => {
    element.querySelector('button[name=online]').textContent = "...";
    const response = await sendRequest(`/update/queue.json/${id}`, { value: "ONLINE" });
    if (response.message === 'success') {
        element.querySelector('button[name=online]').textContent = "Success!";
        setTimeout(() => close(element), 500);
    }
    else {
        element.querySelector('button[name=online]').textContent = "Unknown Error...";
    }
};
/** Changes the status of a kiosk to Online.
 * @param element - Active contextmenu.
 * @param id - Id of the kiosk, device or application.
 */
const setDelete = async (element, id) => {
    const removeButton = element.querySelector('button[name=remove]');
    const clicks = Number(removeButton.dataset.clicks || 0) + 1;
    removeButton.dataset.clicks = String(clicks);
    const getText = () => {
        switch (clicks) {
            case 1: return "Are you sure?";
            case 2: return "You cannot undo this action.";
            case 3: return "Past data will still be saved.";
            case 4: return "Click here to proceed.";
            case 5: return "Last chance.";
            default: return "...";
        }
    };
    removeButton.textContent = getText();
    if (clicks < 6)
        return;
    const response = await sendRequest(`/update/queue.json/${id}`, { value: "DELETE" });
    if (response.message === 'success') {
        removeButton.textContent = "Success!";
        setTimeout(() => close(element), 500);
    }
    else {
        removeButton.textContent = "Unknown Error...";
    }
};
/** Creates and returns a new contextmenu.
 * @param name - Name of the button.
 * @param text - Template element used for the contextmenu.
 * @param data - Object containing data for each button.
 */
function createContextMenu(name, template, data) {
    const contextMenu = getElementFromTemplate(template);
    if (!usingMobile)
        contextMenu.dataset.linked_to = name;
    contextMenu.querySelector('.title').innerHTML = name;
    for (let buttonData of data) {
        const button = contextMenu.querySelector(`button[name=${buttonData.name}]`);
        if (!button)
            continue;
        if (buttonData.text)
            button.textContent = buttonData.text;
        if (buttonData.inactive) {
            button.style.filter = "saturate(0.4) brightness(0.4)";
            continue;
        }
        if (buttonData.action) {
            button.addEventListener('click', () => {
                buttonData.action(contextMenu);
            });
        }
    }
    return contextMenu;
}
/** Moves the defined contextmenu to a new position.
 * @param menu - Contextmenu to move.
 * @param x - X value of the position.
 * @param y - Y value of the position.
 */
function moveContextMenu(menu, x, y) {
    menu.style.left = x + "px";
    menu.style.top = y + "px";
}
/** Loads the desktop version of the contextmenu for the kiosk tiles.
 * @param event - Event of the contextmenu, used to override the default event.
 */
export function loadKioskDesktop(event, kiosk) {
    event.preventDefault();
    const mouseEvent = event;
    const template = document.querySelector('template#cm_tile');
    if (!template)
        return;
    const buttons = [
        {
            name: "ignore",
            text: localStorage.getItem(`${kiosk.id}.IGNORE`) === "true" ? "Show status" : "Ignore status",
            action: (element) => {
                const ignored = toggleIgnoreKiosk(kiosk.id);
                element.querySelector('button[name=ignore]').textContent = ignored ? "Show status" : "Ignore status";
            }
        },
        {
            name: "online",
            text: kiosk.classList.contains("urgency_-1") ? "No device issues" : "Change devices to Online",
            inactive: kiosk.classList.contains("urgency_-1") || kiosk.classList.contains("urgency_0") || kiosk.classList.contains("urgency_2"),
            action: (element) => setOnline(element, kiosk.id)
        },
        {
            name: "remove",
            action: (element) => setDelete(element, kiosk.id)
        }
    ];
    const contextMenu = createContextMenu(kiosk.id, template, buttons);
    moveContextMenu(contextMenu, mouseEvent.clientX, mouseEvent.clientY);
    document.body.querySelectorAll('.contextMenu').forEach(element => element.remove());
    document.body.appendChild(contextMenu);
    contextMenu.style.height = contextMenu.scrollHeight + "px";
    contextMenu.style.opacity = "1";
}
/** Loads the desktop version of the contextmenu for the kiosk rows.
 * @param event - Event of the contextmenu, used to override the default event.
 */
export function loadKioskMobile(event, row) {
    var _a, _b;
    event.preventDefault();
    const template = document.querySelector('template#cm_row');
    if (!template)
        return;
    const mouseEvent = event;
    const noDeviceIssues = /(-1|0|2)/.test(String(row.dataset.real_urgency));
    const buttons = [
        {
            name: "online",
            text: noDeviceIssues ? "No device issues" : "Change devices to Online",
            inactive: noDeviceIssues,
            action: (element) => setOnline(element, row.id)
        },
        {
            name: "cancel",
            text: "Cancel",
            action: close
        }
    ];
    const title = ((_b = (_a = document.getElementById(row.id)) === null || _a === void 0 ? void 0 : _a.querySelector('.name')) === null || _b === void 0 ? void 0 : _b.innerHTML) || "An unexpected error occurred";
    const contextMenu = createContextMenu(title, template, buttons);
    document.body.querySelectorAll('.contextMenu').forEach(element => element.remove());
    document.body.appendChild(contextMenu);
    mouseEvent.clientY < window.innerHeight * 0.45
        ? contextMenu.querySelector('div').style.bottom = "35vh"
        : contextMenu.querySelector('div').style.top = "20vh";
    contextMenu.querySelector('div').style.height = contextMenu.querySelector('div').scrollHeight + "px";
    contextMenu.style.opacity = "1";
    contextMenu.addEventListener('click', (event) => { if (event.target === contextMenu)
        close(contextMenu); });
}
/** Loads the desktop version of the contextmenu for the overylay segments.
 * @param event - Event of the contextmenu, used to override the default event.
 */
export function loadSegmentDesktop(event, segment) {
    event.preventDefault();
    const mouseEvent = event;
    const template = document.querySelector('template#cm_segment');
    if (!template)
        return;
    const kioskName = segment.id.split(".")[segment.id.split(".").length - 1];
    const segmentName = segment.id.replace(`.${kioskName}`, "");
    const segmentObject = status_database[kioskName].devices[segmentName] || status_database[kioskName].applications[segmentName];
    let statusHref;
    for (let statusType in config_data.status_messages) {
        const statusObject = config_data.status_messages[statusType];
        for (let statusCode in statusObject) {
            if (parseFloat(statusCode) !== parseFloat(segmentObject[statusType]))
                continue;
            if (!statusObject.codes[statusCode].messages.includes(segmentObject.status_message))
                continue;
            statusHref = `/settings/status/${statusType}/${statusCode}`;
        }
    }
    const buttons = [
        {
            name: "online",
            text: segmentObject.urgency_level === -1 ? "Already Online" : "Change to Online",
            inactive: segmentObject.urgency_level === -1,
            action: (element) => setOnline(element, segment.id)
        },
        {
            name: "status"
        },
        {
            name: "remove",
            action: (element) => setDelete(element, segment.id)
        }
    ];
    const contextMenu = createContextMenu(segment.id, template, buttons);
    moveContextMenu(contextMenu, mouseEvent.clientX, mouseEvent.clientY);
    document.body.querySelectorAll('.contextMenu').forEach(element => element.remove());
    document.body.appendChild(contextMenu);
    contextMenu.style.height = contextMenu.scrollHeight + "px";
    contextMenu.style.opacity = "1";
}
/** Loads the mobile version of the contextmenu for the overylay segments.
 * @param event - Event of the contextmenu, used to override the default event.
 */
export function loadSegmentMobile(event, segment) {
    var _a, _b;
    event.preventDefault();
    const template = document.querySelector('template#cm_segment');
    if (!template)
        return;
    const mouseEvent = event;
    const kioskName = segment.id.split(".")[segment.id.split(".").length - 1];
    const segmentName = segment.id.replace(`.${kioskName}`, "");
    const segmentObject = status_database[kioskName].devices[segmentName] || status_database[kioskName].applications[segmentName];
    const buttons = [
        {
            name: "online",
            text: segmentObject.urgency_level === -1 ? "Already Online" : "Change to Online",
            inactive: segmentObject.urgency_level === -1,
            action: (element) => setOnline(element, segment.id)
        },
        {
            name: "cancel",
            text: "Cancel",
            action: close
        }
    ];
    const title = ((_b = (_a = document.getElementById(segment.id)) === null || _a === void 0 ? void 0 : _a.querySelector('.header h3')) === null || _b === void 0 ? void 0 : _b.innerHTML) || "An unexpected error occurred";
    const contextMenu = createContextMenu(title, template, buttons);
    document.body.querySelectorAll('.contextMenu').forEach(element => element.remove());
    document.body.appendChild(contextMenu);
    mouseEvent.clientY < window.innerHeight * 0.45
        ? contextMenu.querySelector('div').style.bottom = "35vh"
        : contextMenu.querySelector('div').style.top = "20vh";
    contextMenu.querySelector('div').style.height = contextMenu.querySelector('div').scrollHeight + "px";
    contextMenu.style.opacity = "1";
    contextMenu.addEventListener('click', (event) => { if (event.target === contextMenu)
        close(contextMenu); });
}
/** Closes a contextmenu smoothly.
 */
function close(element) {
    var _a;
    usingMobile
        ? (_a = element.querySelector('div')) === null || _a === void 0 ? void 0 : _a.style.removeProperty('height')
        : element.style.removeProperty('height');
    element.style.removeProperty('opacity');
    setTimeout(() => {
        element.remove();
    }, 300);
}
/** Sets up swipe actions for an element to trigger the contextmenu.
 * @param element - Element to add swipe actions to.
 */
export function setupSwipeActions(element) {
    let startX = 0, startY = 0, currentX = 0, currentY = 0;
    let isMoving = false;
    // Press:
    const touchStart = (event) => {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        isMoving = true;
    };
    // Move:
    const touchMove = (event) => {
        currentX = event.touches[0].clientX;
        currentY = event.touches[0].clientY;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        // Return if user is scrolling through table.
        if (Math.abs(deltaY) > Math.abs(deltaX) && !element.classList.contains('selected')) {
            isMoving = false;
            return;
        }
        // Return if user has not swiped far enough.
        if (!isMoving || (deltaX < 10 && !element.classList.contains('selected')))
            return;
        element.classList.add('selected');
        element.style.translate = deltaX + "px";
        if (Math.abs(deltaX) > window.innerWidth * 0.4) {
            // Dispatch contextmenu event.
            element.dispatchEvent(new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: currentX,
                clientY: currentY
            }));
            touchEnd();
        }
    };
    // Release:
    const touchEnd = () => {
        isMoving = false;
        element.classList.remove('selected');
        element.style.removeProperty('translate');
        startX = 0;
        currentX = 0;
    };
    // Event listeners:
    element.addEventListener('touchstart', touchStart, { passive: true });
    element.addEventListener('touchmove', touchMove, { passive: true });
    element.addEventListener('touchend', touchEnd, { passive: true });
}
/** [Default behaviuor]
 * Remove all contextmenus when a user clicks on anything other than a contextmenu.
 */
document.addEventListener('click', (event) => {
    if (event.target.closest('.contextMenu'))
        return;
    document.querySelectorAll('.contextMenu').forEach(close);
});
