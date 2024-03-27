const config_data = JSON.parse(document.getElementById("data_storage").dataset.config_data);
let status_database = JSON.parse(document.getElementById("data_storage").dataset.status_database);
let misc_data;
const segment_contextMenu = document.getElementById("segment_CM");
const tile_contextMenu = document.getElementById("tile_CM");

const clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window
});

const sendRequest = (url, value, alertInfo) => {
    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json', // Set the content type to form data
        },
        body: JSON.stringify(value)
    })
    .then(response => response.json())
    .then(data => {
        alertInfo ? alert(alertInfo) : location.reload();
        
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

const submitForm = (event, form, url, alertInfo) => {
    event.preventDefault();

    const formData = new FormData(form);

    const putData = {};

    formData.forEach((value, key) => {
        if (!(value instanceof File)) {
            switch(value) {
                case "[]":
                    putData[key] = [];
                    break;
                case "{}":
                    putData[key] = {};
                    break;
                default:
                    putData[key] = value;
            }
        };
    });

    console.log(putData)

    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json', // Set the content type to form data
        },
        body: JSON.stringify(putData)
    })
    .then(response => response.json())
    .then(data => {
        alertInfo ? alert(alertInfo) : location.reload();
        
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

const updateFontSize = (app) => {
    switch(app.id) {
        case "app_5":
            app.querySelector('table').style.fontSize = `${(app.offsetWidth-20)/22}px`;
            break;
        case "app_Hs":
            app.querySelector('p').style.fontSize = `${(app.offsetWidth-20)/10}px`;
            break;
        case "app_T":
            app.querySelector('p').style.fontSize = `${(app.offsetWidth-20)/15}px`;
            break;
    }
}



if (!location.href.includes("desktop/layout")) {
    misc_data = JSON.parse(document.getElementById("data_storage").dataset.misc_data);

    updateAppT();
    updateApp5();
    updateAppP();
    updateAppS();
    loadApps();

    setInterval(async function() {
        if (!skipUpdate) {
            status_database = await (await fetch('/status-database')).json();

            updateApp5();
            misc_data = await (await fetch('/storage/misc.json')).json();
            updateAppP();
            updateAppS();
            updateAppT();
            document.getElementById("alert").innerText = misc_data.alert;

            let fullGreen = true;
            for (let kioskIndex in status_database) {
                if (status_database[kioskIndex].urgency_level !== -1 && document.getElementById(kioskIndex)) {
                    fullGreen = false;
                    break;
                }
            }

            if (misc_data.score < 100 || document.querySelector('.kiosk:not(.urgency_-1)')) {
                if (document.getElementById("overlay").style.display !== "block") {
                    let tile;
                    for (let kioskIndex in status_database) {
                        tile = document.getElementById(kioskIndex);
                        if (tile && !tile.classList.contains("urgency_"+status_database[kioskIndex].urgency_level)) {
                            animateTile(tile, status_database[kioskIndex].urgency_level, status_database[kioskIndex].last_update)
                            /* OLD
                            tile.classList.forEach(className => {
                                if (className.includes("urgency_")) {
                                    tile.classList.remove(className)
                                }
                            });
                            tile.classList.add("urgency_"+status_database[kioskIndex].urgency_level);
                            */
                        }
                    }

                    document.querySelectorAll('.location').forEach(location => sortTiles(location));
                } else {
                    const kiosk = status_database[overlay.querySelector('h1').innerText]
                    let application, device, segment;

                    for (let deviceName in kiosk.devices) {
                        device = kiosk.devices[deviceName];
                        segment = document.getElementById(device.device_name);

                        with (segment) {
                            dataset.urgency_level = device.urgency_level;
                            querySelector('h3').innerText = `${device.status_indicator} ${deviceName}`;
                            querySelector('h4').innerText = device.status_message;
                            querySelector('h5').innerText = device.urgency_level > 0
                                ? getTimeSince(new Date() - new Date(device.last_update))
                                : getTimeSince(new Date() - new Date(device.last_seen));

                            segment.querySelector('.content div').innerHTML = "";

                            for (let property in device) {
                                if (!property.includes("status_") && !property.includes("urgency_")) {
                                    const text = document.createElement('h5');
                                    text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(device[property]) ? device[property].replaceAll("undefined","<span style='color: var(--alert-color)'>undefined</span>") : `<span style='color: var(--link-color)'>${device[property]}</span>`}`;
                                    querySelector('.content div').appendChild(text);
                                }
                            }
                        }
                    }

                    for (let appName in status_database[overlay.querySelector('h1').innerText].applications) {
                        application = kiosk.applications[appName];
                        segment = document.getElementById(appName+"."+kiosk.id);

                        with (segment) {
                            dataset.urgency_level = application.urgency_level;
                            querySelector('h3').innerText = `${application.status_indicator} ${application.display_name || appName}`;
                            querySelector('h4').innerText = application.status_message;
                            querySelector('h5').innerText += getTimeSince(new Date() - new Date(application.last_seen));

                            segment.querySelector('.content div').innerHTML = "";

                            for (let property in application) {
                                if (!property.includes("status_") && !property.includes("urgency_")) {
                                    const text = document.createElement('h5');
                                    text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(application[property]) ? application[property].replaceAll("undefined","<span style='color: var(--alert-color)'>undefined</span>") : `<span style='color: var(--link-color)'>${application[property]}</span>`}`;
                                    querySelector('.content div').appendChild(text);
                                }
                            }
                        }
                    }
                }
            } else {
                animatePlay_Green();
            }
        }
    }, 15000);
}