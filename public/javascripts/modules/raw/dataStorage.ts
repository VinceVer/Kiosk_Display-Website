/**
 * dataStorage.ts
 * written by Vince Dekker: https://github.com/VinceVer
 */

import { isArrayOrObject } from "./defaultFunctions.js";

let statusDatabase: any, miscData: any, configData: any;



/** Loads preloaded data. */
const dataStorageElement = document.getElementById("data_storage")
if (dataStorageElement) {
    statusDatabase = JSON.parse(dataStorageElement.dataset.status_database || "{}");
    miscData = JSON.parse(dataStorageElement.dataset.misc_data || "{}");
    configData = JSON.parse(dataStorageElement.dataset.config_data || "{}");
    dataStorageElement.remove();
}



/**  */
function updateData(object: any, data: any) {
    for (let property in data) {
        isArrayOrObject(data[property])
            ? updateData(object[property], data[property])
            : object[property] = data[property];
    }
}



/** Data exports. */
export const status_database = statusDatabase;
export const misc_data = miscData;
export const config_data = configData;
export const default_href = location.href.split(/(\/g\/|\/k\/|\?)/)[0];
export const initial_query = location.href.split("?")[1];

export function setStatusDatabase(data: any) {
    if (!data) return;
    updateData(statusDatabase, data);
}

export function setMiscData(data: any) {
    if (!data) return;
    updateData(miscData, data);
}

export function setConfigData(data: any) {
    if (!data) return;
    updateData(configData, data);
}