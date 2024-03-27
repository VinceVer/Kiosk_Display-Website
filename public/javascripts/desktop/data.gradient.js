import { status_database } from "../modules/dataStorage.js";
import { getCookie, getReadableTimeSince, getRgbFromHex, getUnixTimestamp, mapNumberToHex, setCookie } from "../modules/defaultFunctions.js";
import { enableTooltip, disableTooltip } from "../modules/tooltipHandler.js"
import { default_href, initial_query } from "../modules/dataStorage.js";

const databaseURL = '/database?query=';

const timingValues = {
    // Custom values are in seconds.
    FADE_IN_TIME: 0.5,
    FADE_IN_DEVIATION: 0.5,
    FADE_OUT_TIME: 0.5,
    FADE_OUT_DEVIATION: 0.1,

    // Predefined values:
    FADE_IN_TIME_MS: null,
    FADE_IN_DEVIATION_MS: null,
    FADE_OUT_TIME_MS: null,
    FADE_OUT_DEVIATION_MS: null
}
// Calculated values:
timingValues.FADE_IN_TIME_MS = timingValues.FADE_OUT_TIME * 1000,
timingValues.FADE_IN_DEVIATION_MS = timingValues.FADE_OUT_DEVIATION * 1000,
timingValues.FADE_OUT_TIME_MS = timingValues.FADE_OUT_TIME * 1000,
timingValues.FADE_OUT_DEVIATION_MS = timingValues.FADE_OUT_DEVIATION * 1000

const query_types = {
    coupons_printed: "SELECT kiosk_name, SUM(value_diff) AS value FROM (SELECT earliest.kiosk_name, earliest.device_name, (latest.${type} - earliest.${type}) AS value_diff FROM (SELECT device_name, kiosk_name, ${type}, MIN(time) as time FROM devicetimeline WHERE time BETWEEN ${start_time} AND ${end_time} GROUP BY device_name) AS earliest JOIN (SELECT device_name, ${type}, MAX(time) as time FROM devicetimeline WHERE time BETWEEN ${start_time} AND ${end_time} GROUP BY device_name) AS latest ON earliest.device_name = latest.device_name) AS subquery GROUP BY kiosk_name;",
    tags_printed: "SELECT kiosk_name, SUM(value_diff) AS value FROM (SELECT earliest.kiosk_name, earliest.device_name, (latest.${type} - earliest.${type}) AS value_diff FROM (SELECT device_name, kiosk_name, ${type}, MIN(time) as time FROM devicetimeline WHERE time BETWEEN ${start_time} AND ${end_time} GROUP BY device_name) AS earliest JOIN (SELECT device_name, ${type}, MAX(time) as time FROM devicetimeline WHERE time BETWEEN ${start_time} AND ${end_time} GROUP BY device_name) AS latest ON earliest.device_name = latest.device_name) AS subquery GROUP BY kiosk_name;",
    paper_jams: "SELECT kiosk_name, SUM(value_diff) AS value FROM (SELECT earliest.kiosk_name, earliest.device_name, (latest.${type} - earliest.${type}) AS value_diff FROM (SELECT device_name, kiosk_name, ${type}, MIN(time) as time FROM devicetimeline WHERE time BETWEEN ${start_time} AND ${end_time} GROUP BY device_name) AS earliest JOIN (SELECT device_name, ${type}, MAX(time) as time FROM devicetimeline WHERE time BETWEEN ${start_time} AND ${end_time} GROUP BY device_name) AS latest ON earliest.device_name = latest.device_name) AS subquery GROUP BY kiosk_name;",
    time_since_last_problem: "SELECT kiosk_name, MIN(${end_time} - time) AS value FROM devicetimeline WHERE from_urgency_level != -1 OR to_urgency_level != -1 GROUP BY kiosk_name"
}

const app = document.getElementById('hookT1S');
const gradientLowInput = document.querySelector('input[name=gradient_start]'),
    gradientHighInput = document.querySelector('input[name=gradient_end]');



/** Tries to execute App_I. */
const runApp_I = () => {
    const type = app.querySelector('.i_type').value,
        time = app.querySelector('.i_time').value;
    if (!type || !time) return;

    unloadData();

    setTimeout(() => {
        history.pushState(null, "", `${default_href}?type=${type}&range=${time}`);
        loadData(type, time);
    }, timingValues.FADE_OUT_TIME_MS + timingValues.FADE_OUT_DEVIATION_MS);
}
if (app) app.querySelectorAll('select').forEach(element => element.addEventListener('change', runApp_I));



/** Updates the gradient colors. */
const updateGradient = () => {
    const color1 = gradientLowInput.value,
        color2 = gradientHighInput.value;

    const lowerLimit = document.getElementById("min_data").innerText,
        upperLimit = document.getElementById("max_data").innerText;

    setCookie(`color.gradient.start`, color1);
    setCookie(`color.gradient.end`, color2);
    document.getElementById("hookT2S").style.background = `linear-gradient(to right, rgb(${getRgbFromHex(color1, true).join(", ") || "255, 0, 0"}), rgb(${getRgbFromHex(color2, true).join(", ") || "0, 255, 0"}))`;

    document.querySelectorAll('.kiosk').forEach(tile => {
        tile.style.backgroundColor = mapNumberToHex(color1, color2, (Number(tile.dataset.tooltip) - lowerLimit) / upperLimit);
    });
}
gradientLowInput.addEventListener('input', updateGradient);
gradientHighInput.addEventListener('input', updateGradient);



/** Unloads currently displayed data. */
const unloadData = async () => {
    document.querySelectorAll('.kiosk').forEach(tile => {
        tile.style.transition = `opacity ${timingValues.FADE_OUT_TIME}s ease`;
        disableTooltip(tile);

        setTimeout(() => {
            tile.style.removeProperty("background-color");
            tile.style.opacity = "0";
        }, Math.random() * timingValues.FADE_OUT_DEVIATION_MS);
    });
}



/** Fetches and loads new data. */
const loadData = async (type, time) => {
    const query = query_types[type].replaceAll("${type}",type).replaceAll("${start_time}", getUnixTimestamp(time.replaceAll("_",""))).replaceAll("${end_time}", getUnixTimestamp());
    const data = (await (await fetch(databaseURL + query)).json()).data;
    if (data.length === 0) return document.getElementById("alert").innerHTML = "<span style='color: var(--alert-color)'>The database returned an empty array.</span>";

    const color1 = getCookie("color.gradient.start") || "FF0000", // lower limit.
        color2 = getCookie("color.gradient.end") || "00FF00"; // upper limit.

    let upperLimit = data[0].value || 0,
        lowerLimit = data[0].value || 2147483647;

    for (let row of data) {
        if (row.value < 0) row.value = getCurrentValue(row.kiosk_name, type);
        if (row.value > upperLimit) {upperLimit = row.value; continue}
        if (row.value < lowerLimit) lowerLimit = row.value;
    }

    for (let row of data) {
        const tile = document.getElementById(row.kiosk_name);
        if (!tile) return;

        tile.dataset.tooltip = getFormattedValue(row.value, type);
        tile.style.backgroundImage = "url(/images/tileOverlay.png)";
        tile.style.backgroundColor = mapNumberToHex(color1, color2, (row.value - lowerLimit) / upperLimit);
        tile.style.transition = `opacity ${timingValues.FADE_IN_TIME}s ease`;
        enableTooltip(tile);

        (function(currentTile) {
            setTimeout(() => {
                currentTile.style.opacity = "1";
            }, Math.random() * timingValues.FADE_IN_DEVIATION_MS);
        })(tile);
    }

    document.getElementById("min_data").innerText = getFormattedValue(lowerLimit, type);
    document.getElementById("max_data").innerText = getFormattedValue(upperLimit, type);

    document.getElementById("alert").innerHTML = `<span style="color: var(--text-color1)">Currently displaying:</span> <span class=t-stress>${type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")} over ${app.querySelector('.i_time').value.replaceAll("_"," ")}</span>`;
}



/** Returns a formatted value based on the currently selected type. */
const getFormattedValue = (value, type) => {
    if (type === "time_since_last_problem") return getReadableTimeSince(value).replace(" ago","");
    return value;
}



/** Returns the total value of a kiosks devices from the current database. */
const getCurrentValue = (kioskId, field) => {
    return "Negative Value";

    const kiosk = status_database[kioskId];
    let totalValue = 0;

    for (let deviceName in kiosk.devices) totalValue += kiosk.devices[deviceName][field] || 0;
    return totalValue;
}



/** Page initiation. */
if (/(?=.*type=)(?=.*range=)/.test(initial_query)) {
    const type = initial_query.split("type=")[1].split("&")[0];
    const time = initial_query.split("range=")[1].split("&")[0];

    loadData(type, time);
    app.querySelector('.i_type').value = type;
    app.querySelector('.i_time').value = time;
} else {
    setTimeout(function() {
        document.getElementById("hookT1S").style.boxShadow = "0 0 15px 3px rgba(255, 255, 255, 0.8)";
    }, 1000);
    setTimeout(function() {
        document.getElementById("hookT1S").style.removeProperty("box-shadow");
    }, 1500);
    setTimeout(function() {
        document.getElementById("hookT1S").style.boxShadow = "0 0 15px 3px rgba(255, 255, 255, 0.8)";
    }, 3000);
    setTimeout(function() {
        document.getElementById("hookT1S").style.removeProperty("box-shadow");
    }, 3500);
}