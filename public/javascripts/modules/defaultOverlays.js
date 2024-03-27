/**
 * defaultOverlays.ts
 * written by Vince Dekker: https://github.com/VinceVer
 */
import { getReadableTimeSince, getFormattedPropertyValue, sortElements, getElementFromTemplate, getCookie, createElementWithText } from "./defaultFunctions.js";
import { status_database } from "./dataStorage.js";
import { loadSegmentDesktop, loadSegmentMobile, setupSwipeActions } from "./contextMenus.js";
import { default_href } from "./dataStorage.js";
import { iconStatusDataMap, addIcon, refreshIcons } from "./iconHandler.js";
const usingMobile = /Mobi|Android/i.test(navigator.userAgent);
const overlay = document.getElementById('overlay');
/** Fills a segment with data.
 * @param segment - Segment element
 * @param data - Data to use for filling the segment.
 */
function populateSegment(segment, data) {
    segment.querySelector('h4').textContent = data.status_message;
    segment.querySelector('h5').textContent = data.urgency_level > 0
        ? (usingMobile ? "" : "Problem since: ") + getReadableTimeSince(new Date().getTime() - new Date(data.last_update || data.last_seen).getTime())
        : (usingMobile ? "" : "Last Seen: ") + getReadableTimeSince(new Date().getTime() - new Date(data.last_seen).getTime());
    for (let property in data) {
        if (property.includes("status_")) {
            continue;
        }
        segment.querySelector(`.content div[name${property}]`)
            ? segment.querySelector(`.content div h5[name=${property}]`).innerHTML = getFormattedPropertyValue(property, data[property])
            : segment.querySelector('.content div').innerHTML += `<h5 name='${property}'>${getFormattedPropertyValue(property, data[property])}</h5>`;
    }
    sortElements(segment.querySelector('.content div'), 'h5', 'innerHTML');
    // Extra event listener(s) for mobile devices:
    usingMobile
        ? setupMobileEventListeners(segment)
        : setupDesktopEventListeners(segment);
}
/** Loads the data of a kiosk and opens the overlay.
 * @param kiosk - Kiosk object from the database.
 * @param template - Template element to create segments.
 * @param contextMenu - Set to true to enable the contextmenu.
 */
export function loadKioskData(kioskId, template, contextMenu) {
    const kiosk = status_database[kioskId];
    const segmentTemplate = getElementFromTemplate(template);
    const loadIcons = getCookie('layout.icons') !== "false";
    document.getElementById('devices').innerHTML = "<h2>Connected Devices</h2>";
    document.getElementById('applications').innerHTML = "<h2>Applications</h2>";
    document.querySelector('.banner h1').textContent = kiosk.id;
    for (let deviceType in kiosk.devices) {
        const device = kiosk.devices[deviceType];
        const segment = segmentTemplate.cloneNode(true);
        const iconData = iconStatusDataMap[device.status_indicator];
        document.getElementById('devices').appendChild(segment);
        segment.id = device.device_name;
        if (loadIcons)
            addIcon(segment.querySelector('h3'), iconData.name, iconData.color);
        segment.querySelector('h3').appendChild(createElementWithText('span', `${!loadIcons ? device.status_indicator : ""} ${deviceType}`));
        populateSegment(segment, device);
        if (!contextMenu)
            continue;
        segment.addEventListener('contextmenu', (event) => {
            usingMobile
                ? loadSegmentMobile(event, segment)
                : loadSegmentDesktop(event, segment);
        });
        if (usingMobile)
            setupSwipeActions(segment);
    }
    for (let applicationType in kiosk.applications) {
        const application = kiosk.applications[applicationType];
        const segment = segmentTemplate.cloneNode(true);
        const iconData = iconStatusDataMap[application.status_indicator];
        document.getElementById('applications').appendChild(segment);
        segment.id = applicationType + "." + kiosk.id;
        if (loadIcons)
            addIcon(segment.querySelector('h3'), iconData.name, iconData.color);
        segment.querySelector('h3').appendChild(createElementWithText('span', `${!loadIcons ? application.status_indicator : ""} ${application.display_name || applicationType}`));
        populateSegment(segment, application);
        if (!contextMenu)
            continue;
        segment.addEventListener('contextmenu', (event) => {
            usingMobile
                ? loadSegmentMobile(event, segment)
                : loadSegmentDesktop(event, segment);
        });
        if (usingMobile)
            setupSwipeActions(segment);
    }
    sortElements(document.getElementById('devices'), 'id', '.segment');
    sortElements(document.getElementById('applications'), 'id', '.segment');
    refreshIcons();
    open();
    fetch(`/images/${kiosk.location}.BANNER.jpg`)
        .then(async (response) => {
        if (response.ok) {
            const bannerURL = URL.createObjectURL(await response.blob());
            document.getElementById('banner').style.backgroundImage = `url(${bannerURL})`;
        }
        else {
            document.getElementById('banner').style.removeProperty("background-image");
        }
    });
    fetch(`/images/${kiosk.location}.MAP.jpg`)
        .then(async (response) => {
        if (response.ok) {
            const mapURL = URL.createObjectURL(await response.blob());
            document.querySelectorAll('.map').forEach(map => {
                map.style.backgroundImage = `url(${mapURL})`;
                map.style.visibility = "visible";
            });
        }
        else {
            document.querySelectorAll('.map').forEach(map => {
                map.style.removeProperty("background-image");
                map.style.visibility = "hidden";
            });
        }
    });
}
/** Loads the data of a kiosk and opens the overlay.
 * @param groupName - Name of the group to load.
 * @param template - Template element to create segments.
 * @param contextMenu - Set to true to enable the contextmenu.
 */
export function loadGroupData(groupName, template, contextMenu) {
    const segmentTemplate = getElementFromTemplate(template);
    const loadIcons = getCookie('layout.icons') !== "false";
    document.getElementById('devices').innerHTML = "<h2>Connected Devices</h2>";
    document.getElementById('applications').innerHTML = "<h2>Applications</h2>";
    document.querySelector('.banner h1').textContent = groupName;
    for (let kioskName in status_database) {
        if (status_database[kioskName].group !== groupName)
            continue;
        const kiosk = status_database[kioskName];
        for (let deviceType in kiosk.devices) {
            if (kiosk.devices[deviceType].urgency_level === -1)
                continue;
            const device = kiosk.devices[deviceType];
            const segment = segmentTemplate.cloneNode(true);
            const iconData = iconStatusDataMap[device.status_indicator];
            document.getElementById('devices').appendChild(segment);
            segment.id = device.device_name;
            if (loadIcons)
                addIcon(segment.querySelector('h3'), iconData.name, iconData.color);
            segment.querySelector('h3').appendChild(createElementWithText('span', `${!loadIcons ? device.status_indicator : ""} ${deviceType}`));
            populateSegment(segment, device);
            if (!contextMenu)
                continue;
            segment.addEventListener('contextmenu', (event) => {
                usingMobile
                    ? loadSegmentMobile(event, segment)
                    : loadSegmentDesktop(event, segment);
            });
            if (usingMobile)
                setupSwipeActions(segment);
        }
        for (let applicationType in kiosk.applications) {
            if (kiosk.applications[applicationType].urgency_level === -1)
                continue;
            const application = kiosk.applications[applicationType];
            const segment = segmentTemplate.cloneNode(true);
            const iconData = iconStatusDataMap[application.status_indicator];
            document.getElementById('applications').appendChild(segment);
            segment.id = applicationType + "." + kiosk.id;
            if (loadIcons)
                addIcon(segment.querySelector('h3'), iconData.name, iconData.color);
            segment.querySelector('h3').appendChild(createElementWithText('span', `${!loadIcons ? application.status_indicator : ""} ${application.display_name || applicationType}`));
            populateSegment(segment, application);
            if (!contextMenu)
                continue;
            segment.addEventListener('contextmenu', (event) => {
                usingMobile
                    ? loadSegmentMobile(event, segment)
                    : loadSegmentDesktop(event, segment);
            });
            if (usingMobile)
                setupSwipeActions(segment);
        }
    }
    sortElements(document.getElementById('devices'), 'id', '.segment');
    sortElements(document.getElementById('applications'), 'id', '.segment');
    open();
    fetch(`/images/${groupName}.BANNER.jpg`)
        .then(async (response) => {
        if (response.ok) {
            const bannerURL = URL.createObjectURL(await response.blob());
            document.getElementById('banner').style.backgroundImage = `url(${bannerURL})`;
        }
        else {
            document.getElementById('banner').style.removeProperty("background-image");
        }
    });
}
/** Sets up event listeners for desktop devices.
 * @param segment - Segment to add event listeners to.
 */
export function setupDesktopEventListeners(segment) {
    const content = segment.querySelector('.content');
    segment.addEventListener('click', (event) => {
        if (!content || content.contains(event.target))
            return;
        content.classList.toggle('active');
        content.style.height = content.classList.contains('active')
            ? content.querySelector('div').offsetHeight + "px"
            : "0";
    });
}
/** Sets up event listeners for mobile devices.
 * @param segment - Segment to add event listeners to.
 */
export function setupMobileEventListeners(segment) {
    segment.addEventListener("click", () => {
        var _a;
        if (((_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.toString()) !== '') {
            return;
        }
        const content = segment.querySelector('.content');
        if (!content)
            return;
        const active = content.classList.toggle('opened');
        content.style.height = active
            ? content.querySelector('div').offsetHeight + "px"
            : "0";
        segment.querySelector('.header h5').style.transform = active ? `translateY(${content.querySelector('div').offsetHeight + "px"})` : "none";
        segment.querySelector('.header h4').style.overflow = active ? "visible" : "hidden";
        segment.querySelector('.header h4').style.textAlign = active ? "start" : "center";
    });
}
/** Opens the overlay.
 */
export function open() {
    if (!overlay)
        return;
    overlay.classList.add('opened');
    setTimeout(function () {
        document.getElementById("overlay").style.opacity = "1";
        document.querySelectorAll('.data, .info div').forEach(element => {
            element.style.opacity = "1";
            element.style.translate = "0 0";
        });
    }, 0);
}
/** Closes the overlay.
 */
export function close() {
    if (!overlay)
        return;
    const querySuffix = location.href.includes("?") ? "?" + location.href.split("?")[1] : "";
    if (location.href !== default_href + querySuffix)
        history.pushState(null, "", default_href + querySuffix);
    overlay.style.opacity = "0";
    document.querySelectorAll('.info div').forEach(element => {
        element.style.translate = "0 -100px";
    });
    document.querySelectorAll('.data').forEach(element => {
        element.style.translate = "0 100px";
    });
    setTimeout(function () {
        overlay.classList.remove('opened');
    }, 300);
}
;
overlay === null || overlay === void 0 ? void 0 : overlay.addEventListener('click', (event) => {
    if (!event.target || !event.target.classList.contains("clickToClose"))
        return;
    close();
});
