/**
 * defaultDisplayElements.ts
 * written by Vince Dekker: https://github.com/VinceVer
 */
import { createElementWithText, getCookie, getMobileUrgencyLevel } from "./defaultFunctions.js";
import { addIcon, iconStatusDataMap, loadIcon } from "./iconHandler.js";
var StyleValues;
(function (StyleValues) {
    StyleValues["IGNORE"] = "0.2";
})(StyleValues || (StyleValues = {}));
/** Creates and returns a new grid group.
 * @param name - Name of the group.
 * @param parent - Parent of the new group. This is usually a container.
 */
export function createGroup(name, parent) {
    const group = document.createElement('div');
    group.classList.add('group');
    group.id = name;
    const groupTitle = document.createElement('h1');
    groupTitle.textContent = name;
    group.appendChild(groupTitle);
    parent.appendChild(group);
    return group;
}
/** Creates and returns a new grid location.
 * @param name - Name of the location.
 * @param parent - Parent of the new location. This is usually a group.
 */
export function createLocation(name, parent) {
    const location = document.createElement('div');
    location.classList.add('location');
    location.id = name;
    const locationTitle = document.createElement('h2');
    locationTitle.textContent = name + ":";
    location.appendChild(locationTitle);
    parent.appendChild(location);
    return location;
}
/** Creates and returns a new kiosk tile.
 * @param name - Name of the kiosk.
 * @param urgenyLevel - Urgency level of the kiosk.
 * @param parent - Parent of the new tile. This is usually a location.
 */
export function createKiosk(name, urgenyLevel, parent) {
    const kiosk = document.createElement('div');
    kiosk.classList.add('kiosk', 'urgency_' + urgenyLevel);
    kiosk.id = name;
    kiosk.title = name;
    kiosk.style.opacity = localStorage.getItem(name + ".IGNORE") === "true" ? StyleValues.IGNORE : "1";
    const kioskLabel = document.createElement('p');
    kioskLabel.textContent = name.slice(-3);
    kiosk.appendChild(kioskLabel);
    parent.appendChild(kiosk);
    return kiosk;
}
export function toggleIgnoreKiosk(id) {
    const kiosk = document.getElementById(id);
    if (!kiosk)
        return;
    const ignore = localStorage.getItem(id + ".IGNORE") !== "true";
    ignore
        ? localStorage.setItem(id + ".IGNORE", 'true')
        : localStorage.removeItem(id + ".IGNORE");
    kiosk.style.opacity = ignore ? StyleValues.IGNORE : "1";
    return ignore;
}
/** Creates and returns a new kiosk row.
 *
 */
export function createRow(name, icon, note, parent) {
    var _a;
    const nameLength = Number(getCookie('layout.short_names') || 0);
    name = name.slice(-nameLength);
    const row = document.createElement('tr');
    row.id = "R." + name;
    row.innerHTML = `<td class='name'><div></div></td><td class='note'>${note || ""}</td>`;
    parent.appendChild(row);
    const iconData = iconStatusDataMap[icon];
    addIcon(row.querySelector('.name div'), iconData.name, iconData.color).cloneNode(true);
    (_a = row.querySelector('.name div')) === null || _a === void 0 ? void 0 : _a.appendChild(createElementWithText('span', name));
    return row;
}
/** Returns the lowest span values that fit the locationTitle
 * @param locationElement - The group container.
 * @returns An array containing the column and row span values.
 */
export function alignLocationTitle(groupElement) {
    let maxSpan = 0;
    if (getCookie("layout.tile.align") === "true") {
        groupElement.querySelectorAll('.location').forEach(locationElement => {
            if (locationElement.children.length > 1) {
                const labelWidth = locationElement.querySelector('h2').offsetWidth;
                if (labelWidth > maxSpan) {
                    maxSpan = labelWidth;
                }
                ;
            }
        });
    }
    else {
        maxSpan = NaN;
    }
    groupElement.querySelectorAll('.location').forEach(locationElement => {
        if (locationElement.children.length < 2) {
            locationElement.remove();
            return;
        }
        const locationHtmlElement = locationElement;
        const labelWidth = maxSpan || locationHtmlElement.querySelector('h2').offsetWidth;
        const gridGap = getComputedStyle(locationElement).gap || getComputedStyle(locationElement).columnGap;
        const tileWidth = locationHtmlElement.querySelector('div').offsetWidth + parseInt(gridGap);
        const tiles = locationElement.querySelectorAll('.kiosk').length;
        const columnsToFitLabel = Math.round(labelWidth / tileWidth);
        const rowsToFitLabel = Math.ceil(tiles / (Math.floor(locationHtmlElement.offsetWidth / tileWidth) - columnsToFitLabel - 1));
        locationHtmlElement.querySelector('h2').style.gridColumn = "span " + columnsToFitLabel;
        locationHtmlElement.querySelector('h2').style.gridRow = "span " + rowsToFitLabel;
    });
}
/** Updates the row representing a kiosk.
 * @param kioskId - Id of the kiosk to update.
 * @param newUrgency - New urgency value (null for no response).
 */
export function updateRow(kiosk) {
    const loadIcons = getCookie('layout.icons') !== "false";
    const row = document.getElementById("R." + kiosk.id);
    if (!row)
        return;
    row.dataset.urgency = getMobileUrgencyLevel(kiosk.urgency_level);
    row.querySelector('.note').textContent = kiosk.note;
    if (!loadIcons)
        return;
    const iconElement = row.querySelector('.name .ico');
    if (!iconElement)
        return;
    const iconData = iconStatusDataMap[kiosk.urgency_icon];
    iconElement.dataset.type = iconData.name;
    iconElement.dataset.color = iconData.color;
    loadIcon(iconElement);
}
/** Updates the image of a kiosk.
 * @param kioskId - Id of the kiosk to update.
 * @param newUrgency - New urgency value (null for no response).
 */
export function updateTile(kioskId, newUrgency) {
    const kiosk = document.getElementById(kioskId);
    if (!kiosk)
        return;
    kiosk.classList.forEach(className => {
        if (className.includes("urgency_"))
            kiosk.classList.remove(className);
    });
    kiosk.classList.add("urgency_" + String(newUrgency));
}
/** [Default behaviour]
 * Recalculates and -positions grid tiles when the windows gets resized.
 */
window.addEventListener('resize', () => {
    document.querySelectorAll('.group').forEach(group => {
        alignLocationTitle(group);
    });
});
/** [Default behaviour]
 * Enables the functionality of dropdown menus.
 */
document.querySelectorAll('.dropdown').forEach(element => {
    const content = element.querySelector('.content');
    if (!content)
        return;
    element.addEventListener('mouseenter', () => {
        content.style.height = content.scrollHeight + "px";
    });
    element.addEventListener('mouseleave', () => {
        content.style.height = "0";
    });
    element.querySelectorAll('.content div').forEach(item => {
        item.onclick = () => item.querySelector('a').click();
    });
});
