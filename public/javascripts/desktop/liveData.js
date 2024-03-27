/** This module does not come from a raw typescript file */

import { updateTile } from "../modules/defaultDisplayElements.js";
import { updateApps } from "../modules/appHandler.js";
import * as animations from "../modules/animationHandler.js";
import * as storage from "../modules/dataStorage.js";

export const socket = io();



/** Updates the grid display. */
const updateGrid = (kioskId, kiosk) => {
    if (!kiosk.urgency_level || kiosk.urgency_level === storage.status_database[kioskId].urgency_level) return;

    const availabeAnimations = animations.getTileAnimations(document.getElementById(kioskId), kiosk.urgency_level);

    if (!availabeAnimations) {
        updateTile(kioskId, kiosk.urgency_level);
        return;
    }

    // Play a random animation from availableAnimations.
    const randomIndex = Math.floor(Math.random()*availabeAnimations.length);
    animations.playAnimation(kioskId, availabeAnimations[randomIndex].id, availabeAnimations[randomIndex].args);
}



/** Event - Database Update */
socket.on('update status_database', (data) => {
    for (let kioskId in data) {
        const kiosk = data[kioskId];

        // Update the grid.
        updateGrid(kioskId, kiosk);
    }

    storage.setStatusDatabase(data);
});

/** Event - Misc Update */
socket.on('update misc_data', (data) => {
    storage.setMiscData(data);
    updateApps();
});