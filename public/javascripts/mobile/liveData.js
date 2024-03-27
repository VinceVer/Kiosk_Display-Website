/** This module does not come from a raw typescript file */

import { updateRow } from "../modules/defaultDisplayElements.js";
import * as storage from "../modules/dataStorage.js";
import { refreshIcons } from "../modules/iconHandler.js";
import { refreshList } from "./list.js";

export const socket = io();

// Mobile variables:
const statusElement = document.getElementById('connection_status');
const statusIcon = document.getElementById('connection_icon');
const timeoutLimitMs = 300000;



/** Updates the status element and indicator.
 * @param type - Icon type.
 * @param color - Icon color. (null for default)
 * @param innerHTML - Information as HTML.
 * @param dontRefresh - If true, stops the icons from refreshing.
 */
function updateStatus(type, color, innerHTML, dontRefresh) {
    statusElement.innerHTML = innerHTML;
    statusIcon.dataset.type = type;
    statusIcon.dataset.color = color || "";

    if (dontRefresh) return;

    refreshIcons();
}



/** Updates the status bar according to misc_data. */
function updateMiscStatus() {
    const timeSinceLastDataMs = (new Date() - new Date(storage.misc_data.last_data || storage.misc_data.last_check));
    if (timeSinceLastDataMs > timeoutLimitMs) return;

    storage.misc_data.score === 100
        ? updateStatus('emoji-happy', '#57c543', `<i class='ico' data-type='receipt-tax'></i><span color='green'>No issues. Kiosk display is happy.</span>`)
        : updateStatus('status-online', `hsl(${storage.misc_data.score-50 < 0 ? 0 : (storage.misc_data.score-50)*2}, 100%, 65%)`, `<i class='ico' data-type='receipt-tax'></i>Health Score: ${storage.misc_data.score}%`);
}

/** Updates the status bar according last_data, last_check and alert. */
function updateFetchStatus() {
    if (!socket.connected) return;

    const timeSinceLastDataMs = (new Date().getTime() - new Date(storage.misc_data.last_data || storage.misc_data.last_check).getTime());
    const timeSinceLastCheckMs = (new Date().getTime() - new Date(storage.misc_data.last_check).getTime());

    if (timeSinceLastDataMs > timeoutLimitMs && socket.connected) {
        timeSinceLastCheckMs > timeoutLimitMs
            ? updateStatus('mail', 'red', "<i class='ico' data-type='mail'></i>The server is not receiving any new data.")
            : updateStatus('server', 'red', "<i class='ico' data-type='server'></i>The server has stopped fetching new data.")
            
        if (storage.misc_data.alert.replaceAll(" ","")) {
            statusElement.innerHTML += `<br><i class='ico' data-type='flag' data-color='red'></i><span color='red'>${storage.misc_data.alert}</span>`;
        }

        refreshIcons();
    }
}



/** Event - Database Update */
socket.on('update status_database', (data) => {
    for (let kioskId in data) {
        const kiosk = data[kioskId];

        
        // Update the mobile list.
        updateRow(kiosk);

        // Update the grid.
        if (!kiosk.urgency_level || kiosk.urgency_level === storage.status_database[kioskId].urgency_level) continue;
        updateTile(kioskId, kiosk.urgency_level);
    }

    refreshList(); // refreshList is a function located at /mobile/list.js
    storage.setStatusDatabase(data);
});

/** Event - Misc Update */
socket.on('update misc_data', (data) => {
    storage.setMiscData(data);
    updateMiscStatus();
});

/** Event - Connection Started */
socket.on('connect', () => {
    console.info("Successfully connected to the io server.");
    updateMiscStatus();
    updateFetchStatus();
});

/** Event - Connection Ended */
socket.on('disconnect', () => {
    console.warn("The connection to the io server has been lost.");
    updateStatus('status-offline', 'red', "<i class='ico' data-type='status-offline'></i>You are not connected to the io server.");
    refreshIcons();
});

// Server or Nethink Timed out.
//setInterval(updateFetchStatus, 10000);