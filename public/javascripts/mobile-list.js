const config_data = JSON.parse(document.getElementById("data_storage").dataset.config_data);
let status_database = JSON.parse(document.getElementById("data_storage").dataset.status_database);
let misc_data = JSON.parse(document.getElementById("data_storage").dataset.misc_data);
const segment_contextMenu = document.getElementById("segment_CM");
const phone_contextMenu = document.getElementById("phone_CM");
const overlay = document.getElementById("overlay");
const settings = document.getElementById("settings");
const searchInput = document.querySelector('#search input');
const phone_anchor = document.querySelector('a[name=standby-phone]');
let pressTimer;

const clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window
});

if (window.innerWidth > window.innerHeight) {
    location.href = "/mobile/grid";
} else {
    document.getElementById("kiosk_table").style.height = (window.innerHeight - document.getElementById("header").offsetHeight - document.getElementById("search").offsetHeight - document.getElementById("footer").offsetHeight) + "px";
}

const loadGrid = () => {
    if (misc_data.alert.replaceAll(" ", "")) {
        document.getElementById("header").innerText = misc_data.alert;
        document.getElementById("header").classList.add("alert");
    }

    const tableRow = document.getElementById("tableRow");
    let urgencyID;

    for (let kioskIndex in status_database) {
        urgencyID = status_database[kioskIndex].urgency_level > 9 ? String(status_database[kioskIndex].urgency_level)[0] : status_database[kioskIndex].urgency_level;
        const row = tableRow.cloneNode(true);
        row.id = kioskIndex;
        row.querySelector('.name').innerText = status_database[kioskIndex].urgency_icon + kioskIndex;
        row.querySelector('.note').innerText = status_database[kioskIndex].note || "";
        row.querySelector('.note').innerText += getExtraNotes(status_database[kioskIndex]);

        try {
            document.getElementById("table_urgency"+urgencyID).appendChild(row);
        } catch (error) {
            document.getElementById("table_urgency0").appendChild(row);
        }

        row.addEventListener("touchstart", function (event) {
            pressTimer = setTimeout(function () {
                document.querySelectorAll(`tr`).forEach(element => element.style.filter = "brightness(0.2)");
                row.style.filter = "brightness(1.5)";
                loadContextMenu_SEGMENT(event, row);
                if ("vibrate" in navigator) {
                    navigator.vibrate([50, 1, 1, 1, 50]);
                }
            }, 500);
        });

        row.addEventListener("touchend", function (event) {
            clearTimeout(pressTimer);
        });
    }

    document.querySelectorAll('tbody').forEach(item => {
        const sortedList = sortElements(Array.from(item.querySelectorAll('tr')));
        item.innerHTML = "";
        sortedList.forEach(element => {
            item.appendChild(element)
            element.addEventListener("click", () => {
                let cm_opened = false;
                document.querySelectorAll('.contextMenu').forEach(menu => {
                    if (menu.style.display !== "none") {cm_opened = true;}
                });
                if (!cm_opened) {
                    history.pushState(null, null, `/mobile/k/${element.id}`);
                    openOverlay(element.id);
                }
            });
        });
    });

    document.querySelectorAll('tbody tr').forEach((item, index) => {
        if (index % 2 === 0) {
            item.style.backgroundColor = "var(--gray40)";
        }
    });

    document.getElementById("kiosk_table").addEventListener("scroll", function() {clearTimeout(pressTimer);})

    document.getElementById("display").style.visibility = "visible";

    if (location.href.includes("/k/")) openOverlay(location.href.split("/k/")[1]);
    //if (location.href.includes("/g/")) appendData_GROUP(location.href.split("/g/")[1]);

    setupLocationSelect();
}

const alert = (info) => {
    console.log(info)
    const alertBox = document.getElementById("alertBox");

    with (alertBox) {
        style.display = "flex";

        querySelector('h2').style.display = info.title ? "inline" : "none";
        querySelector('h2').innerHTML = info.title;

        querySelector('h4').style.display = info.description ? "inline" : "none";
        (info.description && info.description.includes("\n"))
            ? querySelector('h4').innerText = info.description
            : querySelector('h4').innerHTML = info.description;

        querySelectorAll('.flexBar button').forEach(element => element.remove());
        for (let buttonIndex in info.buttons) {
            const button = document.createElement('button');
            button.innerText = info.buttons[buttonIndex].text;
            if (info.buttons[buttonIndex].invert) {button.style.filter = "invert("+ (isNaN(Number(button.invert)) ? "0.85" : String(button.invert)) +")"}
            console.log("invert("+ isNaN(Number(button.invert)) ? "0.85" : String(button.invert) +")")
            button.addEventListener("click", info.buttons[buttonIndex].action);
            querySelector('.flexBar').appendChild(button);
        }
    }

    document.body.querySelectorAll('nav, #display, #settingsInput').forEach(element => {
        //element.classList.add("blur");
        element.style.filter = "blur(3px) brightness(0.75)";
    });

    setTimeout(() => {document.getElementById("alertBox").style.opacity = 1}, 100);
}

const appendData = async (kiosk) => {
    document.getElementById("devices").innerHTML = "<h2>Connected Devices</h2>";
    document.getElementById("applications").innerHTML = "<h2>Applications</h2>";
    document.querySelector('.banner h1').innerText = kiosk.id;

    /* Devices. */
    for (let deviceName in kiosk.devices) {
        const segment = document.querySelector('#templates #segment').cloneNode(true);
        const device = kiosk.devices[deviceName];

        with (segment) {
            id = device.device_name;
            dataset.urgency_level = device.urgency_level;
            querySelector('h3').innerText = `${device.status_indicator} ${deviceName}`;
            querySelector('h4').innerText = device.status_message;
            querySelector('h5').innerText = device.urgency_level > 0
                ? getTimeSince(new Date() - new Date(device.last_update || devices.last_seen))
                : getTimeSince(new Date() - new Date(device.last_seen));

            for (let property in device) {
                if (!property.includes("status_") && !property.includes("urgency_")) {
                    const text = document.createElement('h5');
                    text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(device[property]) ? device[property].replaceAll("undefined","<span style='color: var(--alert-color)'>undefined</span>") : `<span style='color: var(--link-color)'>${device[property]}</span>`}`;
                    querySelector('.content div').appendChild(text);
                }
            }

            addEventListener("click", (event) => {
                if (window.getSelection().toString() !== '') {return;}
                let cm_opened = false;
                document.querySelectorAll('.contextMenu').forEach(menu => {
                    if (menu.style.display !== "none") {cm_opened = true;}
                });
                if (!cm_opened) {
                    const active = !querySelector('.content').classList.contains("active");
                    with (querySelector('.content')) {
                        classList.toggle("active");
                        style.height = active ? querySelector('div').offsetHeight + "px" : 0;
                    }
                    querySelector('.flexBar h5').style.transform = active ? `translateY(${segment.querySelector('.content div').offsetHeight + "px"})` : "none";
                    querySelector('.flexBar h4').style.overflow = active ? "visible" : "hidden";
                    querySelector('.flexBar h4').style.textAlign = active ? "start" : "center";
                }
            });

            addEventListener("touchstart", function (event) {
                if (event.target.classList.contains("flexBar") || event.target.parentNode.classList.contains("flexBar")) {
                    pressTimer = setTimeout(function () {
                        document.querySelectorAll(`.segment, .data h2`).forEach(element => element.style.filter = "brightness(0.2)");
                        segment.style.filter = "brightness(1.5)";
                        loadContextMenu_SEGMENT(event, segment)
                        if ("vibrate" in navigator) {
                            navigator.vibrate([50, 1, 1, 1, 50]);
                        }
                    }, 500);
                }
            });
              
            addEventListener("touchend", function (event) {
                clearTimeout(pressTimer);
            });
        }
        
        document.getElementById("devices").appendChild(segment);
    }
    /* -------- */

    /* Applications. */
    for (let appName in kiosk.applications) {
        const segment = document.querySelector('#templates #segment').cloneNode(true);
        const application = kiosk.applications[appName];

        with (segment) {
            id = appName+"."+kiosk.id;
            dataset.urgency_level = application.urgency_level;
            querySelector('h3').innerText = `${application.status_indicator} ${application.display_name || appName}`;
            querySelector('h4').innerText = application.status_message;
            //querySelector('h5').innerText += getTimeSince(new Date() - new Date(application.last_seen));
            querySelector('h5').innerText = application.urgency_level > 0
            ? getTimeSince(new Date() - new Date(application.last_update || application.last_seen))
            : getTimeSince(new Date() - new Date(application.last_seen));

            for (let property in application) {
                if (!property.includes("status_") && !property.includes("urgency_")) {
                    const text = document.createElement('h5');
                    text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(application[property]) ? application[property].replaceAll("undefined","<span style='color: var(--alert-color)'>undefined</span>") : `<span style='color: var(--link-color)'>${application[property]}</span>`}`;
                    querySelector('.content div').appendChild(text);
                }
            }

            querySelector('.content div').innerHTML += `<h5><span class=t-stress>app_id</span>: ${appName}</span></h5>`;

            addEventListener("click", (event) => {
                if (window.getSelection().toString() !== '') {return;}
                let cm_opened = false;
                document.querySelectorAll('.contextMenu').forEach(menu => {
                    if (menu.style.display !== "none") {cm_opened = true;}
                });
                if (!cm_opened) {
                    const active = !querySelector('.content').classList.contains("active");
                    with (querySelector('.content')) {
                        classList.toggle("active");
                        style.height = active ? querySelector('div').offsetHeight + "px" : 0;
                    }
                    querySelector('.flexBar h5').style.transform = active ? `translateY(${segment.querySelector('.content div').offsetHeight + "px"})` : "none";
                    querySelector('.flexBar h4').style.overflow = active ? "visible" : "hidden";
                    querySelector('.flexBar h4').style.textAlign = active ? "start" : "center";
                }
            });

            addEventListener("touchstart", function (event) {
                if (event.target.classList.contains("flexBar") || event.target.parentNode.classList.contains("flexBar")) {
                    pressTimer = setTimeout(function () {
                        document.querySelectorAll(`.segment, .data h2`).forEach(element => element.style.filter = "brightness(0.2)");
                        segment.style.filter = "brightness(1.5)";
                        loadContextMenu_SEGMENT(event, segment)
                        if ("vibrate" in navigator) {
                            navigator.vibrate([50, 1, 1, 1, 50]);
                        }
                    }, 500);
                }
            });
              
            addEventListener("touchend", function (event) {
                clearTimeout(pressTimer);
            });
        }
        
        document.getElementById("applications").appendChild(segment);
    }
    /* ------------- */

    /* Row coloring. */
    document.querySelectorAll('#devices .segment').forEach((item, index) => {
        if (index % 2 === 0) {
            item.style.backgroundColor = "var(--gray40)";
            item.querySelector('.content div').style.backgroundColor = "var(--gray40)";
        }
    });

    document.querySelectorAll('#applications .segment').forEach((item, index) => {
        if (index % 2 === 0) {
            item.style.backgroundColor = "var(--gray40)";
            item.querySelector('.content div').style.backgroundColor = "var(--gray40)";
        }
    });
    /* ------------- */

    document.getElementById("overlay").addEventListener("scroll", function() {clearTimeout(pressTimer);})

    /* Images. */
    fetch(`/images/${kiosk.location}.BANNER.jpg`)
        .then(async response => {
            if (response.ok) {
                const bannerURL = URL.createObjectURL(await response.blob());
                document.querySelector('.banner').style.backgroundImage = `url(${bannerURL})`;
            } else {
                document.querySelector('.banner').style.backgroundImage = `url('')`;
            }
        })
    
    fetch(`/images/${kiosk.location}.MAP.jpg`)
        .then(async response => {
            if (response.ok) {
                const mapURL = URL.createObjectURL(await response.blob());
                document.querySelector('.map').style.backgroundImage = `url(${mapURL})`;
                document.querySelector('.map').style.display = "block";
            } else {
                document.querySelector('.map').style.display = "none";
            }
        });
    /* ------- */
}

const closeOverlay = () => {
    history.pushState(null, null, `/mobile`);

    document.querySelector('table').style.overflowY = "auto";
    document.querySelectorAll('.overlay').forEach(element => element.style.opacity = 0);
    document.querySelectorAll('.banner, .data, .map').forEach(element => {
        element.style.removeProperty("translate");
    });

    setTimeout(function() {
        document.querySelectorAll('.overlay').forEach(element => element.style.display = "none");
    }, 300);
}

const getExtraNotes = (kiosk) => {
    let manuallySet = "";

    for (let deviceName in kiosk.devices) {
        if (kiosk.devices[deviceName].status_message && kiosk.devices[deviceName].status_message.includes("[Manually Set]")) {
            manuallySet = " [Manually Set]"
            break;
        } else if (!kiosk.devices[deviceName].status_message) {
            console.log(kiosk.devices[deviceName])
        }
    }
    for (let appName in kiosk.applications) {
        if (kiosk.applications[appName].status_message && kiosk.applications[appName].status_message.includes("[Manually Set]")) {
            manuallySet = " [Manually Set]"
            break;
        } else if (!kiosk.applications[appName].status_message) {
            console.log(kiosk.applications[appName])
        }
    }

    return manuallySet;
}

const getTimeSince = (millisecondsDiff) => {
    let secondsDiff = millisecondsDiff / 1000;
    // Return correct time interval:
    let interval = secondsDiff / 31536000;
    if (interval > 2) {
        return Math.floor(interval) + " years ago.";
    }
    interval = secondsDiff / 2592000;
    if (interval > 2) {
        return Math.floor(interval) + " months ago.";
    }
    interval = secondsDiff / 86400;
    if (interval > 2) {
        return Math.floor(interval) + " days ago.";
    }
    interval = secondsDiff / 3600;
    if (interval > 2) {
        return Math.floor(interval) + " hours ago.";
    }
    interval = secondsDiff / 60;
    if (interval > 1) {
        return Math.floor(interval) + " minutes ago.";
    }
    if (secondsDiff > 10) {
        return Math.floor(secondsDiff) + " seconds ago.";
    }
    return "Now.";
}

const loadContextMenu_PHONE = (event, element) => {
    event.preventDefault();
    
    phone_contextMenu.querySelector('button[name=call]').ontouchend = (e) => {
        location.href = "tel:" + element.innerText;
    }

    phone_contextMenu.querySelector('button[name=cancel]').ontouchend = () => {
        document.dispatchEvent(clickEvent);
    }

    with (phone_contextMenu) {
        querySelector('button.title').innerText = element.parentNode.querySelector('span').innerText + element.innerText;
        style.top = "30vh";
        style.display = 'flex';
    }

    setTimeout(() => {
        phone_contextMenu.style.height = phone_contextMenu.querySelector('div').scrollHeight + "px";
        phone_contextMenu.style.opacity = 1;
    }, 1);
}

const loadContextMenu_SEGMENT = (event, segment) => {
    event.preventDefault();
    const touch = event.touches[0];

    segment_contextMenu.querySelector('button[name=online]').ontouchend = (e) => {
        sendRequest(`/update/queue.json/${segment.id}`,{value: "ONLINE"});
        document.dispatchEvent(clickEvent);
    }

    with (segment_contextMenu) {
        querySelector('button.title').innerText = segment.id;
        if (touch.clientY > window.innerHeight / 2) {
            style.top = "30vh";
        } else {
            style.top = "50vh";
        }
        style.display = 'flex';
    }

    if (segment.dataset.urgency_level === "-1") {
        segment_contextMenu.querySelector('button[name=online]').ontouchend = () => {};
        segment_contextMenu.querySelector('button[name=online]').style.filter = "saturate(0.4) brightness(0.4)"
    } else {
        segment_contextMenu.querySelector('button[name=online]').style.removeProperty("filter");
    }

    setTimeout(() => {
        segment_contextMenu.style.height = segment_contextMenu.querySelector('div').scrollHeight + "px";
        segment_contextMenu.style.opacity = 1;
    }, 1);
}

const openOverlay = (kioskIndex) => {
    document.body.style.overflowY = "hidden";
    appendData(status_database[kioskIndex])

    overlay.style.display = "block";

    setTimeout(function() {
        overlay.style.opacity = 1;
        document.querySelectorAll('.data, .banner, .map').forEach(element => {
            element.style.opacity = 1;
            element.style.translate = "0 0";
        });
    }, 0);
}

const openSettings = () => {
    console.log("HI")
    settings.style.display = "block";

    setTimeout(function() {
        settings.style.opacity = 1;
        document.querySelectorAll('.data').forEach(element => {
            element.style.opacity = 1;
            element.style.translate = "0 0";
        });
    }, 0);
}

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

const setupLocationSelect = async () => {
    const connectedLocations = await (await fetch(document.getElementById("data_storage").dataset.hub_adress+'/connections')).json();
    const location_select = document.getElementById("location_select");

    for (let location in connectedLocations) {
        const option = document.createElement('option');

        console.log(window.location.href, connectedLocations[location], window.location.href.includes(connectedLocations[location].split("//")[connectedLocations[location].split("//").length-1].split(":")[0]))

        with (option) {
            disabled = window.location.href.includes(connectedLocations[location].split("//")[connectedLocations[location].split("//").length-1].split(":")[0]) ? true : false;
            innerText = location + (window.location.href.includes(connectedLocations[location].split("//")[connectedLocations[location].split("//").length-1].split(":")[0]) ? " [Loaded]" : "");
            value = connectedLocations[location]+'/mobile';
        }

        location_select.appendChild(option);
    }
}

const sortElements = (elements) => {
    if (elements.length <= 1) {
        return elements;
    }
  
    const pivot = elements[Math.floor(elements.length / 2)].id;
  
    const less = elements.filter(element => element.id < pivot);
    const equal = elements.filter(element => element.id === pivot);
    const greater = elements.filter(element => element.id > pivot);

    return [...sortElements(less), ...equal, ...sortElements(greater)];
}

const updateAppP = () => {
    with (document.querySelector('.health_score')) {
        style.color = `hsl(${misc_data.score-50 < 0 ? 0 : (misc_data.score-50)*2}, 100%, 65%)`;
        innerText = `${misc_data.score}%`;
    };
}

const updateAppT = () => {
    if (misc_data.last_check === "Fetching...") {
        document.querySelector('.last_check').innerText = "Fetching...";
    } else {
        const millisecondsDiff = new Date() - new Date(misc_data.last_check);
        document.querySelector('.last_check').innerText = (millisecondsDiff > 600000 ? "⚠️ " : "") + "Last check: " + getTimeSince(millisecondsDiff);
    }
}

const updateAppS = () => {
    with (document.getElementById("standby")) {
        querySelector('span').innerText = misc_data.standby.name + " - ";
        querySelector('a').innerText = misc_data.standby.phone;
    }
}

loadGrid();
updateAppT();

document.querySelectorAll('.clickToClose').forEach(element => {
    element.addEventListener("click", (event) => {
        if (event.target.classList.contains("clickToClose")) {closeOverlay()};
    });
});

addEventListener("resize", (event) => {
    if (window.innerWidth > window.innerHeight) {
        location.href = "/mobile/grid"+location.href.split("/mobile")[1];
    } else {
        document.getElementById("kiosk_table").style.height = window.innerHeight - document.getElementById("header").offsetHeight - document.getElementById("footer").offsetHeight + "px";
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.parentNode.classList.contains("contextMenu")) {
        document.querySelectorAll(`tr, .data h2, .segment`).forEach(element => element.style.removeProperty("filter"));
        phone_anchor.style.removeProperty("filter");
        document.querySelectorAll('.contextMenu').forEach(element => {
            element.style.height = 0;
            element.style.opacity = 0;
            setTimeout(function() {
                element.style.display = 'none';
            }, 300);
        });
    }
});

document.querySelectorAll('.contextMenu').forEach(element => {
    element.addEventListener('touchend', (event) => {
        event.stopPropagation();
    });
});

searchInput.addEventListener('input', function() {
    searchInput.value = searchInput.value.toUpperCase();

    document.querySelectorAll('#kiosk_table table tbody tr').forEach(row => {
        if (row.id.includes(searchInput.value)) {
            row.style.display = "table-row";
        } else {
            row.style.display = "none"
        }
    });
});

phone_anchor.addEventListener("touchstart", function (event) {
    event.preventDefault();
    pressTimer = setTimeout(function () {
        document.querySelectorAll(`tr`).forEach(element => element.style.filter = "brightness(0.2)");
        phone_anchor.style.filter = "brightness(1.5)";
        loadContextMenu_PHONE(event, phone_anchor);
        if ("vibrate" in navigator) {
            navigator.vibrate([50, 1, 1, 1, 50]);
        }
    }, 500);
});
phone_anchor.addEventListener("touchend", function (event) {
    clearTimeout(pressTimer);
});

setInterval(async function() {
    status_database = await (await fetch('/status-database')).json();
    
    if (!overlay.offsetHeight > 0) {
        let bar;
        for (let kioskIndex in status_database) {
            bar = document.getElementById(kioskIndex);

            if (bar && !bar.classList.contains("urgency_"+status_database[kioskIndex].urgency_level)) {
                bar.classList.forEach(className => {
                    if (className.includes("urgency_")) {
                        bar.classList.remove(className);
                    }
                });
                bar.classList.add("urgency_"+status_database[kioskIndex].urgency_level);
                bar.querySelector('.name').innerText = status_database[kioskIndex].urgency_icon + kioskIndex;
                bar.querySelector('.note').innerText = status_database[kioskIndex].note || "";
                bar.querySelector('.note').innerText += getExtraNotes(status_database[kioskIndex]);
            }

            try {
                document.getElementById("table_urgency"+status_database[kioskIndex].urgency_level).appendChild(bar);
            } catch (error) {
                document.getElementById("table_urgency0").appendChild(bar);
            }
        }

        document.querySelectorAll('tbody').forEach(item => {
            const sortedList = sortElements(Array.from(item.querySelectorAll('tr')));
            item.innerHTML = "";
            sortedList.forEach(element => {
                item.appendChild(element)
            });
        });

        document.querySelectorAll('tbody tr').forEach((item, index) => {
            if (index % 2 === 0) {
                item.style.backgroundColor = "var(--gray40)";
            } else {
                item.style.removeProperty("background-color");
            }
        });
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

                querySelector('.content div').innerHTML = "";

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
                querySelector('h5').innerText = application.urgency_level > 0
                    ? getTimeSince(new Date() - new Date(application.last_update || application.last_seen))
                    : getTimeSince(new Date() - new Date(application.last_seen));

                querySelector('.content div').innerHTML = "";

                for (let property in application) {
                    if (!property.includes("status_") && !property.includes("urgency_")) {
                        const text = document.createElement('h5');
                        text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(application[property]) ? application[property].replaceAll("undefined","<span style='color: var(--alert-color)'>undefined</span>") : `<span style='color: var(--link-color)'>${application[property]}</span>`}`;
                        querySelector('.content div').appendChild(text);
                    }
                }

                querySelector('.content div').innerHTML += `<h5><span class=t-stress>app_id</span>: ${appName}</span></h5>`;
            }
        }
    }

    misc_data = await (await fetch('/storage/misc.json')).json();
    updateAppP();
    updateAppT();
    updateAppS();
    if (misc_data.alert.replaceAll(" ", "")) {
        document.getElementById("header").innerText = misc_data.alert;
        document.getElementById("header").classList.add("alert");
    } else {
        document.getElementById("header").innerText = "KIOSKS";
        document.getElementById("header").classList.remove("alert");
    }
    document.getElementById("kiosk_table").style.height = window.innerHeight - document.getElementById("header").offsetHeight - document.getElementById("footer").offsetHeight + "px";
    //document.getElementById("alert").innerText = misc_data.alert;
}, 15000);