import { getReadableTime, getUnixTimestamp } from "../modules/defaultFunctions.js";
import { enablePersistentTooltip, updateValue, updatePosition } from "../modules/tooltipHandler.js";
import { status_database, setStatusDatabase } from "../modules/dataStorage.js";

const databaseURL = '/database?query=';
const query = "SELECT time, kiosk_name, device_name, from_urgency_level, to_urgency_level FROM devicetimeline WHERE time BETWEEN ${start_time} AND ${end_time} AND from_urgency_level != to_urgency_level ORDER BY time";
const secondsInDay = 86400;

const slider = document.getElementById('time_slider');
const tooltip = enablePersistentTooltip(document.querySelector('footer'));

let timestampMonthStart = getUnixTimestamp('curMonth'),
    timestampMonthEnd = getUnixTimestamp();

let database;



/** Switches the displayed day of the grid. */
const switchDay = (multiplier) => {
    updateValue(tooltip, "Loading...");
    const unixTimestamp = getUnixTimestamp();

    if (slider.max > unixTimestamp && multiplier > 0) {
        slider.value = unixTimestamp;
        updateValue(tooltip, getReadableTime(unixTimestamp, 3));
        return;
    };

    const increment = secondsInDay * multiplier
    const newTimestamp = Number(slider.value) + increment > unixTimestamp
        ? unixTimestamp
        : Number(slider.value) + increment;

    slider.min = Number(slider.min) + increment;
    slider.max = Number(slider.max) + increment;

    slider.value = newTimestamp;

    if (slider.min < timestampMonthStart || slider.max > timestampMonthEnd) {
        timestampMonthStart = getStartOfMonth();
        timestampMonthEnd = getEndOfMonth();
        return updateData();
    }

    updateTooltip();
}



/** Updates the grid and local database. */
const updateData = async () => {
    updateValue(tooltip, "Loading...");

    database = {};
    const data = (await (await fetch(databaseURL+query.replaceAll("${start_time}", timestampMonthStart).replaceAll("${end_time}", timestampMonthEnd))).json()).data;
    const groupedData = {};

    for (let row of data) {
        if (!groupedData[row.kiosk_name]) groupedData[row.kiosk_name] = [];
        groupedData[row.kiosk_name].push(row);
    }

    for (let kioskName in groupedData) {
        const group = groupedData[kioskName];
        console.log(group)

        const lastFromUrgencyLevels = {};
        const lastToUrgencyLevels = {};

        for (let row of group) {
            if (!database[row.kiosk_name]) database[row.kiosk_name] = {};

            for (let rowJ of group) {
                if (rowJ.time < row.time) continue;
                if (rowJ.time > row.time) break;
                lastFromUrgencyLevels[rowJ.device_name+".from"] = rowJ.from_urgency_level;
                lastToUrgencyLevels[rowJ.device_name+".to"] = rowJ.to_urgency_level;
            }

            database[row.kiosk_name][row.time] = {};

            let maxFrom = -2,
                maxTo = -2;

            console.log(Object.values(lastToUrgencyLevels))
            for (let deviceName in lastFromUrgencyLevels) maxFrom = Math.max(maxFrom, lastFromUrgencyLevels[deviceName]);
            for (let deviceName in lastToUrgencyLevels) maxTo = Math.max(maxTo, lastToUrgencyLevels[deviceName]);

            database[row.kiosk_name][row.time].from = maxFrom;
            database[row.kiosk_name][row.time].to = maxTo;
        }

        console.log(database);
        return;
    }

    updateTooltip();
}
updateData();



/** Updates the data displayed on the grid. */
const updateGrid = async () => {
    const unixTimestamp = slider.value;

    for (let i = database.length-1; i >= 0; i--) {
        //console.log('i')
        if (database[i].time > unixTimestamp) continue;
    }
}



/** Updates the value of the tooltip. */
const updateTooltip = () => {
    const dateTime = getReadableTime(slider.value, 3, true);
    updateValue(tooltip, `${dateTime[0]} ${dateTime[1]}`);
}



/** Returns a Unix Timestamp representing the start of the month of a Unix Timestamp. */
const getStartOfMonth = () => {
    const date = new Date(Number(slider.value) * 1000);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date.getTime() / 1000;
}

/** Returns a Unix Timestamp representing the end of the month of a Unix Timestamp. */
const getEndOfMonth = () => {
    const date = new Date(Number(slider.value) * 1000);
    date.setDate(1);
    date.setMonth(date.getMonth() + 2);
    date.setHours(0, 0, 0, 0);
    return date.getTime() / 1000;
}



/** Adds an event listener for click the day arrows. */
document.querySelectorAll('#time_selectors button').forEach(element => {
    element.addEventListener('click', () => switchDay(Number(element.dataset.multiplier)));
});

/** Adds an event listener for moving the slider. */
slider.addEventListener('input', () => {
    if (slider.value > getUnixTimestamp()) slider.value = getUnixTimestamp();
    updateGrid();
    updateTooltip();
});
