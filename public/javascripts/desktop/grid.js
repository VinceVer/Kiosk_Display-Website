import * as displayElements from "../modules/defaultDisplayElements.js";
import * as defaultFunctions from "../modules/defaultFunctions.js";
import * as overlay from "../modules/defaultOverlays.js";
import * as contextMenus from "../modules/contextMenus.js";
import { status_database, config_data, default_href } from "../modules/dataStorage.js";

const groupContainer = document.getElementById("container");
const segmentTemplate = document.querySelector('template#segment');
const enableContextMenu = document.querySelector('.templates[for=contextmenus]') ? true : false;

/** Loads the grid of tiles, representing the kiosks. */
const loadGrid = () => {
    for (let group of config_data.groups) {
        const groupElement = displayElements.createGroup(group.name, groupContainer);
        groupElement.querySelector('h1').addEventListener('click', () => {
            const querySuffix = location.href.includes("?") ? "?"+location.href.split("?")[1] : "";
            history.pushState(null, "", `${default_href}/g/${group.name}${querySuffix}`);
            overlay.loadGroupData(group.name, segmentTemplate, enableContextMenu);
        });

        for (let location of group.locations) {
            displayElements.createLocation(location.name, groupElement);
        }

        defaultFunctions.sortElements(groupElement, '.location', 'id');
    }

    for (let kioskName in status_database) {
        const kiosk = status_database[kioskName];
        const locationElement = document.getElementById(kiosk.location);

        if (kiosk.location !== ".undefined" && locationElement) {
            const kioskElement = displayElements.createKiosk(kiosk.id, kiosk.urgency_level, locationElement);

            kioskElement.addEventListener('click', (event) => {
                if (event.target.closest('.tooltip')) return;
                const querySuffix = location.href.includes("?") ? "?"+location.href.split("?")[1] : "";
                history.pushState(null, "", `${default_href}/k/${kiosk.id}${querySuffix}`);
                overlay.loadKioskData(kiosk.id, segmentTemplate, enableContextMenu);
            });

            if (!enableContextMenu) continue;
            kioskElement.addEventListener("contextmenu", (event) => {
                contextMenus.loadKioskDesktop(event, kioskElement);
            });
        }
    }

    document.querySelectorAll('.group').forEach(group => displayElements.alignLocationTitle(group));
    document.querySelectorAll('.location').forEach(location => defaultFunctions.sortElements(location, '.kiosk', 'textContent'));

    document.getElementById("display").style.visibility = "visible";

    if (location.href.includes("/k/")) overlay.loadKioskData(status_database[location.href.split("/k/")[1].split("?")[0]].id, segmentTemplate, enableContextMenu);
    if (location.href.includes("/g/")) overlay.loadGroupData(location.href.split("/g/")[1].split("?")[0], segmentTemplate, enableContextMenu);
}; loadGrid();
defaultFunctions.loadWallpaper();



/** Adds an event listener for going back and forth between pages. */
window.addEventListener('popstate', () => {
    if (location.href.includes("/k/")) {overlay.loadKioskData(status_database[location.href.split("/k/")[1].split("?")[0]].id, segmentTemplate, enableContextMenu); return;}
    if (location.href.includes("/g/")) {overlay.loadGroupData(location.href.split("/g/")[1].split("?")[0], segmentTemplate, enableContextMenu); return;}
    if (document.getElementById("overlay").offsetHeight > 0) {overlay.close(); return;}
});