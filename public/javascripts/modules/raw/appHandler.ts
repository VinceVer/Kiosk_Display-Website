/**
 * appHandlers.ts
 * written by Vince Dekker: https://github.com/VinceVer
 */

import { createElementWithText, getCookie, getReadableTimeSince, setCookie } from "./defaultFunctions.js";
import { status_database, misc_data } from "./dataStorage.js";
import { addIcon, iconStatusDataMap, loadIcon } from "./iconHandler.js";

const pageHasHeader = document.querySelector('header')? true : false,
    pageHasFooter = document.querySelector('footer')? true : false;



/** Returns the width of the app as if it were minified.
 * @param element - App to convert.
 */
export const getElementBarWidth = (element: HTMLElement) => {
    const tempElement = element.cloneNode(true) as HTMLElement;
    tempElement.style.visibility = "hidden";
    tempElement.style.width = "fit-content";
    (tempElement.querySelectorAll('.flexBar') as NodeListOf<HTMLElement>).forEach(element => {
        element.style.removeProperty("margin")
        element.style.display = "inline-flex";
    });
    tempElement.querySelectorAll('table').forEach(element => element.style.removeProperty("font-size"));
    tempElement.querySelectorAll('p').forEach(element => {
        element.style.fontSize = "1.7rem";
        element.style.margin = "0";
    });
    document.body.appendChild(tempElement)
    const width = tempElement.offsetWidth;
    tempElement.remove();
    return width;
}



/** Returns a hook element if the x and y position collide with the hook.
 * @param x - X position of the mouse.
 * @param y - Y position of the mouse.
 */
export const getHookToSnapTo = (x: number, y: number) => {
    if (pageHasHeader && y < document.querySelector('header')!.offsetHeight) {
        return document.getElementById(x > window.innerWidth / 2 ? "hookT2" : "hookT1");
    }

    if (pageHasFooter && y > document.querySelector('footer')!.offsetTop) {        
        return document.getElementById(x > window.innerWidth / 2 ? "hookR" : "hookL");
    }

    return null;
}



/** Shrinks an app window and anchors it to a hook.
 * @param app - App to minify.
 * @param hook - Hook to anchor the app to.
 */
export function minifyApp(app: HTMLElement, hook: HTMLElement) {
    const minifiedApp = app.cloneNode(true) as HTMLElement;

    if (document.getElementById(hook.dataset.hooked_app+"Button")) {
        document.getElementById(hook.dataset.hooked_app+"Button")!.classList.remove("selected");
    }

    hook.innerHTML = "";
    hook.dataset.hooked_app = app.id;
    hook.style.width = "fit-content";

    hook.style.alignItems = minifiedApp.querySelector('table')
        ? hook.dataset.alt_align!
        : "center";

    (minifiedApp.querySelectorAll('.flexBar') as NodeListOf<HTMLElement>).forEach(element => {
        element.style.removeProperty("margin");
        element.style.display = "inline-flex";
    });
    (minifiedApp.querySelectorAll('table, p') as NodeListOf<HTMLElement>).forEach(element => {
        element.style.removeProperty("font-size");
    });

    for (let childElement of minifiedApp.children) {
        if (!childElement.classList || !childElement.classList.contains('header')) {
            hook.appendChild(childElement.cloneNode(true));
        }
    }

    app.style.display = "none";
    hook.style.removeProperty("filter");
    hook.dataset.app_width = String(hook.offsetWidth);

    setCookie(`hooks.${hook.id}.app`, app.id);

    resetAppCookies(app);
}



/** Opens or closes an app.
 * @param id - Id of the app to toggle.
 * @param button - Button associated to the app.
 */
export function toggleApp(id: string, button: HTMLElement) {
    const app = document.getElementById(id);
    if (!app) {
        button.remove();
        return;
    };

    button.classList.toggle('selected');

    if (button.classList.contains('selected')) { // Open the app.
        setCookie(`apps.${id}.display`, "block");
        app.style.display = "block";

        placeAppInFront(app);

        setTimeout(function () {
            app.style.top = app.offsetTop+"px";
            app.style.removeProperty("bottom");
            app.style.width = app.offsetWidth+"px";
            app.style.opacity = "1";
        }, 0);
    } else { // Close the app.
        setCookie(`apps.${id}.display`, "none");
        app.style.opacity = "0";
        setTimeout(function () {
            app.style.display = "none";
        }, 300);

        closeHook(app.id);
    }
}



/** Removes all cookies associated with an app.
 * @param app - App to reset.
 */
export const resetAppCookies = (app: HTMLElement) => {
    setTimeout(function() {
        app.querySelectorAll('table, p').forEach(element => {
            (element as HTMLElement).style.removeProperty("font-size");
        });
        
        app.style.display = "none";
        app.style.opacity = "0";
        app.style.bottom = "calc(var(--footer-height) + 10px)";
        app.style.left = "10px";
        app.style.removeProperty("height");
        app.style.removeProperty("top");
        app.style.removeProperty("width");
        setCookie(`apps.${app.id}.display`, null);
        setCookie(`apps.${app.id}.left`, null);
        setCookie(`apps.${app.id}.top`, null);
        setCookie(`apps.${app.id}.width`, null); 
        setCookie(`apps.${app.id}.height`, null);
    }, 0);
}



/** Updates the data of all (specified) apps.
 * @param apps - Array of app names to update.
 */
export function updateApps(apps?: Array<string>) {
    if (document.getElementById("alert")) document.getElementById("alert")!.innerText = misc_data.alert;

    if (apps === undefined) {
        updateApp_5();
        updateApp_Hs();
        updateApp_S();
        updateApp_T();
        return;
    }

    for (let appId of apps) {
        switch(appId.toUpperCase().split("_")[1]) {
            case "5":
                updateApp_5();
                break;
            case "HS":
                updateApp_Hs();
                break;
            case "S":
                updateApp_S();
                break;
            case "T":
                updateApp_T();
                break;
        }
    }
}



/** Updates the data of App_5, which shows a list of current problems.
 */
export function updateApp_5() {
    const problemTable = document.querySelector('#app_5.app table tbody');
    if (!problemTable) return;

    const problemList = new Array<any>;
    const includedUrgencies = [null, 1, 3, 4, 5];
    const hook = document.querySelector('.hook[data-hooked_app=app_5] table tbody');
    const loadIcons = getCookie('layout.icons') !== "false";

    for (let kioskName in status_database) {
        const devices = status_database[kioskName].devices;
        
        for (let deviceType in devices) {
            if (includedUrgencies.includes(devices[deviceType].urgency_level)) {
                const device = devices[deviceType];
                problemList.push({time: new Date().getTime() - new Date(device.last_update || device.last_seen).getTime(), name: device.device_name, icon: device.status_indicator})
            }
        }
    }

    problemList.sort((a, b) => b.time - a.time);

    problemTable.innerHTML = "";
    if (hook) {hook.innerHTML = "";}

    for (let row of problemList) {
        const newRowHTML = `<tr><td class='name'><div></div></td><td class='time'>${getReadableTimeSince(row.time)}</td></tr>`;

        problemTable.innerHTML += newRowHTML;
        if (hook) {hook.innerHTML += newRowHTML;}

        const divQuery = 'tr:last-of-type td.name div'
        const iconData = iconStatusDataMap[row.icon];
        const icon = addIcon(problemTable.querySelector(divQuery)!, iconData.name, iconData.color).cloneNode(true) as HTMLElement;
        problemTable.querySelector(divQuery)!.appendChild(createElementWithText('span', row.name));

        if (!hook) continue;
        hook.querySelector(divQuery)!.appendChild(icon);
        hook.querySelector(divQuery)!.appendChild(createElementWithText('span', row.name));
        loadIcon(icon);
    }
}

/** Updates the data of App_P, which shows the current health score.
 */
export function updateApp_Hs() {
    (document.querySelectorAll('.health_score') as NodeListOf<HTMLElement>).forEach(element => {
        element.style.color = `hsl(${misc_data.score-50 < 0 ? 0 : (misc_data.score-50)*2}, 100%, 65%)`;
        element.textContent = `Health Score: ${misc_data.score}%`;
    });
}

/** Updates the data of App_S, which shows the current standby information.
 */
export function updateApp_S() {
    const dataElement = document.querySelector('.flexBar[for=standby]') as HTMLDivElement;

    if (!dataElement || (dataElement.dataset.name === misc_data.standby.name && dataElement.dataset.phone === misc_data.standby.phone)) return;

    (document.querySelectorAll('.flexBar[for=standby]') as NodeListOf<HTMLElement>).forEach(element => {
        element.dataset.name = misc_data.standby.name
        element.dataset.phone = misc_data.standby.phone
    });
    document.querySelectorAll('.flexBar[for=standby] input[name=name]').forEach(element => (element as HTMLInputElement).value = misc_data.standby.name);
    document.querySelectorAll('.flexBar[for=standby] input[name=phone]').forEach(element => (element as HTMLInputElement).value = misc_data.standby.phone);
}

/** Updates the data of App_T, which shows the time since the last database check.
 */
export function updateApp_T() {
    const hook = document.querySelector('.hook[data-hooked_app=app_T]') as HTMLElement;
    if (misc_data.last_check === "Fetching...") {
        document.querySelectorAll('.last_check').forEach(element => element.textContent = "Fetching...");
    } else {
        const millisecondsDiff = new Date().getTime() - new Date(misc_data.last_check).getTime();
        document.querySelectorAll('.last_check').forEach(element => element.textContent = (millisecondsDiff > 600000 ? "⚠️ " : "") + "Last check: " + getReadableTimeSince(millisecondsDiff));
    }

    if (!hook) return;
    hook.dataset.app_width = String(hook.offsetWidth);
}

/** Handler for App_I is located in 'data.gradient.js' as it is specific to the data/gradient page. **/



/** Close the hook containing an app, if present.
 * @param appId - Id of the app to unhook.
 */
function closeHook(appId: string) {
    const hook = document.querySelector(`.hook[data-hooked_app=${appId}]`) as HTMLElement;
    if (!hook) return;

    setCookie(`hooks.${hook.id}.app`, null);
    hook.innerHTML = "";
    hook.dataset.hooked_app = undefined;
    hook.dataset.app_width = "0";
    hook.style.removeProperty("width");
}



/** Places the app in front of all other apps.
 * @param app - App to place in front.
 */
function placeAppInFront(app: HTMLElement) {
    (document.querySelectorAll(`.app:not(#${app.id})`) as NodeListOf<HTMLElement>).forEach(element => element.style.zIndex = "0");
    app.style.zIndex = "2";
    //document.body.insertBefore(app, document.querySelector('.app'));
}



/** Update the font size of an app.
 * @param app - App to update.
 */
function updateFontSize(app: HTMLElement) {
    switch (app.id.toUpperCase().split("_")[1]) {
        case "HS":
            app.querySelector('p')!.style.fontSize = app.offsetHeight+"px";
            break;
    }
}



/** [Default behaviour]
 * Reset the z-index of all apps when a user clicks on anything other than an app.
 */
document.addEventListener('click', (event) => {
    if (!(event.target as HTMLElement).closest('.contextMenu')) return;
    (document.querySelectorAll('.app') as NodeListOf<HTMLElement>).forEach(item => item.style.zIndex = "0");
});



/** Loads all apps.
 */
export function loadApps() {
    document.querySelectorAll('.hook').forEach(hook => {
        const linkedApp = getCookie(`hooks.${hook.id}.app`);
        if (!linkedApp) return;
        minifyApp(document.getElementById(linkedApp) as HTMLDivElement, hook as HTMLDivElement);
        document.getElementById(linkedApp+"Button")?.classList.add('selected');
    });

    (document.querySelectorAll('.app') as NodeListOf<HTMLElement>).forEach(app => {
        const header = app.querySelector('.header')!;
        const button = document.getElementById(app.id+"Button");

        let isDragging = false;
        let offsetX:number, offsetY:number;

        if (getCookie(`apps.${app.id}.display`) !== null) {
            app.style.display = getCookie(`apps.${app.id}.display`)!;
            app.style.top = getCookie(`apps.${app.id}.top`)!;
            app.style.left = getCookie(`apps.${app.id}.left`)!;
            app.style.height = getCookie(`apps.${app.id}.height`) || "null";
            app.style.width = getCookie(`apps.${app.id}.width`) || "null";
            button?.classList.add('selected');
        }

        // Move the app in front of all other apps.
        app.addEventListener('mousedown', () => placeAppInFront(app));

        // Close the app.
        app.querySelector('.header button')?.addEventListener('click', () => toggleApp(app.id, button as HTMLElement));

        // Get the initial position when starting to move the app.
        header.addEventListener('mousedown', event => {
            const mouseEvent = event as MouseEvent;
            isDragging = true;
            offsetX = mouseEvent.clientX - app.getBoundingClientRect().left;
            offsetY = mouseEvent.clientY - app.getBoundingClientRect().top;
        });

        // Move the app and check if it overlaps with a hook.
        document.addEventListener('mousemove', event => {
            if (!isDragging) return;
            const mouseEvent = event as MouseEvent;
            app.style.left = mouseEvent.clientX - offsetX + "px";
            app.style.top = mouseEvent.clientY - offsetY + "px";

            const hook = getHookToSnapTo(mouseEvent.clientX, mouseEvent.clientY);
            if (!hook || event.target !== header) {
                (document.querySelectorAll('.hook') as NodeListOf<HTMLElement>).forEach(element => {
                    element.style.width = (Number(element.dataset.app_width) - 10 || "0") + "px";
                    element.style.removeProperty("filter");
                });
                return;
            };

            hook.style.width = Math.max(getElementBarWidth(app), (Number(hook.dataset.app_width) || 0)) + "px";
            hook.style.filter = "invert(0.1)";

            (document.querySelectorAll(`.hook:not(#${hook.id})`) as NodeListOf<HTMLElement>).forEach(element => {
                element.style.width = (element.dataset.app_width || "0") + "px";
                element.style.removeProperty('filter');
            });
        });

        // Settle the app when it gets dropped.
        document.addEventListener('mouseup', (event) => {
            if (!isDragging) return;
            isDragging = false;

            const mouseEvent = event as MouseEvent;

            const hook = getHookToSnapTo(mouseEvent.clientX, mouseEvent.clientY);
            if (!hook) {
                setCookie(`apps.${app.id}.left`, app.offsetLeft+"px");
                setCookie(`apps.${app.id}.top`, app.offsetTop+"px");
                setCookie(`apps.${app.id}.height`, app.offsetHeight+"px");
                setCookie(`apps.${app.id}.width`, app.offsetWidth+"px");
                return;
            }

            minifyApp(app, hook);
        });

        if (!button) return;

        button.addEventListener('click', () => toggleApp(app.id, button));

        // Reset the app when the footer button gets right clicked.
        button.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            button.classList.remove('selected');

            resetAppCookies(app);

            closeHook(app.id);
        });
    });
};
loadApps();
updateApps();