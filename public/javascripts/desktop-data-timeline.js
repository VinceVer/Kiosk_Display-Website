const slider = document.getElementById("time_slider");
const tooltip = document.querySelector('.tooltip[for=time_slider]');
const config_data = JSON.parse(document.getElementById("data_storage").dataset.config_data);
let status_database = JSON.parse(document.getElementById("data_storage").dataset.status_database);
let misc_data = JSON.parse(document.getElementById("data_storage").dataset.misc_data);
//const dataBar = document.getElementById("dataBar");
let timeline_data, grouped_data = {};
const maxRange = 86400;
let todayTimestamp = new Date().setHours(0, 0, 0, 0) / 1000;

const status_indicators = {
    _1: "🟢",
    null: "❔",
    0: "🔵",
    1: "🟡",
    2: "🟣",
    3: "🟠",
    4: "🔴",
    5: "⚠️",
    12: "🟣",
    42: "🔴"
}

const loadGrid = async () => {
    const currentTime = new Date();
    const endTime = Math.floor(currentTime.getTime() / 1000);
    currentTime.setHours(0, 0, 0, 0);
    const startTime = Math.floor(currentTime.getTime() / 1000) - 172800;

    timeline_data = (await (await fetch(`database?query=SELECT time, kiosk_name, from_urgency_level, to_urgency_level FROM kiosktimeline WHERE time BETWEEN ${startTime} AND ${endTime} ORDER BY kiosk_name, time DESC`)).json()).data;

    console.log(timeline_data);

    for (let item of timeline_data) {
        if (!grouped_data[item.kiosk_name]) grouped_data[item.kiosk_name] = [];
        grouped_data[item.kiosk_name].push(item);
    }

    for (let group of config_data.groups) {
        const groupElement = document.createElement('div');

        with (groupElement) {
            id = group.name;
            classList.add("group");
            appendChild(document.createElement('h1'));
            querySelector('h1').innerText = group.name;
            querySelector('h1').addEventListener("click", () => {
                //history.pushState(null, null, `/desktop/data/timeline/g/${group.name}`);
                appendData_GROUP(group.name);
            });

            for (let location of group.locations) {
                const locationElement = document.createElement('div');
                
                with (locationElement) {
                    id = location.name;
                    classList.add("location");
                    appendChild(document.createElement('h2'));
                    querySelector('h2').innerText = location.name+":";
                }

                appendChild(locationElement);
            }
        }

        document.getElementById("container").appendChild(groupElement);
        sortItems(groupElement, '.location');
    }

    for (let kioskIndex in status_database) {
        if (status_database[kioskIndex].location !== ".undefined" && document.getElementById(status_database[kioskIndex].location)) {
            const div = document.createElement('div');

            div.id = status_database[kioskIndex].id;
            div.dataset.oldest_report = status_database[kioskIndex].oldest_report;
            div.dataset.urgency_level = status_database[kioskIndex].urgency_level;
            div.style.opacity = localStorage.getItem(`${div.id}.IGNORE`) === "true" ? 0.2 : 1;
            div.appendChild(document.createElement('p'))
            div.querySelector('p').innerText = status_database[kioskIndex].id.slice(-3);
            div.classList.add("kiosk", "urgency_"+status_database[kioskIndex].urgency_level);
            div.addEventListener("click", () => {
                //history.pushState(null, null, `/desktop/data/timeline/k/${kioskIndex}`);
                appendData(kioskIndex);
            });
            div.addEventListener("contextmenu", (event) => {
                loadContextMenu_TILE(event, div);
            });

            document.getElementById(status_database[kioskIndex].location).appendChild(div);
        }
    }

    document.querySelectorAll('.location').forEach(location => sortTiles(location));

    updateLocations();

    document.getElementById("display").style.visibility = "visible";

    loadApps();

    if (location.href.includes("/k/")) appendData(location.href.split("/k/")[1]);
    if (location.href.includes("/g/")) appendData_GROUP(location.href.split("/g/")[1]);

    let background_file = getCookie("background_file");
    console.log(background_file, "&", getCookie(`background_extension[${config_data.location}]`));
    if (!background_file.includes(".")) background_file = `${background_file}.${getCookie(`background_extension[${config_data.location}]`)}`;
    document.body.style.backgroundImage = `url(images/${background_file})`;
}

const appendData = async (kioskIndex) => {
    const kiosk = status_database[kioskIndex];
    kiosk.devices = [];
    const currentTime = new Date(slider.value * 1000);

    document.getElementById("devices").innerHTML = "<h2>Connected Devices</h2>";
    document.getElementById("applications").innerHTML = "<h2>Applications</h2>";
    document.querySelector('.banner h1').innerText = kiosk.id;

    /* Devices. */
    const device_data = (await (await fetch(`database?query=SELECT * FROM ( SELECT *, ROW_NUMBER() OVER(PARTITION BY device_name ORDER BY time DESC) AS rn FROM devicetimeline WHERE time BETWEEN ${slider.min} AND ${slider.value} AND kiosk_name = '${kioskIndex}' ) ranked WHERE rn = 1;`)).json()).data;
    console.log(slider.value, device_data)

    for (let row of device_data) {
        console.log(row.to_urgency_level, row.time);

        delete row.from_urgency_level;
        delete row.rn;
        delete row.time;

        const deviceName = row.device_name.replace(row.kiosk_name, "");
        kiosk.devices[deviceName] = {};

        for (let property in row) {
            kiosk.devices[deviceName][property] = row[property];
        }
        for (let property in kiosk.devices[deviceName]) {
            if (!kiosk.devices[deviceName][property]) {delete kiosk.devices[deviceName][property]}
            kiosk.devices[deviceName].urgency_level = row.to_urgency_level;
            kiosk.devices[deviceName].status_indicator = status_indicators[String(row.to_urgency_level).replace("-","_")];
            delete kiosk.devices[deviceName].to_urgency_level;
        }
    }

    for (let deviceName in kiosk.devices) {
        const segment = document.querySelector('#templates #segment').cloneNode(true);
        const device = kiosk.devices[deviceName];

        with (segment) {
            id = device.device_name;
            dataset.urgency_level = device.urgency_level;
            querySelector('h3').innerText = `${device.status_indicator} ${deviceName}`;
            querySelector('h4').innerText = device.status_message;
            querySelector('h5').innerHTML = device.urgency_level > 0
                ? `Updated: ${getTimeSince(currentTime - new Date(device.last_update || devices.last_seen)).replace("ago",`<span class=t-stress>before ${getCurrentTime(slider.value)}</span>`)}`
                : `Seen: ${getTimeSince(currentTime - new Date(device.last_seen)).replace("ago",`<span class=t-stress>before ${getCurrentTime(slider.value)}</span>`)}`;

            for (let property in device) {
                if (!property.includes("status_")) {
                    const text = document.createElement('h5');
                    text.id = property;
                    text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(device[property]) ? device[property].replaceAll("undefined","<span style='color: var(--alert-color)'>undefined</span>") : `<span style='color: var(--link-color)'>${device[property]}</span>`}`;
                    querySelector('.content div').appendChild(text);
                }
            }

            addEventListener("click", (event) => {
                if (querySelector('.content').contains(event.target)) {return;}
                with (querySelector('.content')) {
                    classList.toggle("active");
                    style.height = classList.contains("active") ? querySelector('div').offsetHeight + "px" : 0;
                }
            });

            addEventListener("contextmenu", (event) => {
                loadContextMenu_SEGMENT(event, segment);
            });
        }
        
        sortItems(segment.querySelector('.content div'), 'h5');
        document.getElementById("devices").appendChild(segment);
    }
    /* -------- */

    /* Applications. */
    document.getElementById("applications").innerHTML += "<h3 style='width: 100%; text-align: center;'>NO APPLICATION DATABASE FOUND</h3>"
    /* ------------- */

    sortItems(document.getElementById("devices"), '.segment')
    sortItems(document.getElementById("applications"), '.segment')
    openOverlay();

    /* Images. */
    fetch(`images/${kiosk.location}.BANNER.jpg`)
        .then(async response => {
            if (response.ok) {
                const bannerURL = URL.createObjectURL(await response.blob());
                document.querySelector('.banner').style.backgroundImage = `url(${bannerURL})`;
            } else {
                document.querySelector('.banner').style.backgroundImage = `url('')`;
            }
        })
    
    fetch(`images/${kiosk.location}.MAP.jpg`)
        .then(async response => {
            if (response.ok) {
                const mapURL = URL.createObjectURL(await response.blob());
                document.querySelector('.map').style.backgroundImage = `url(${mapURL})`;
                document.querySelector('.map').style.visibility = "visible";
            } else {
                document.querySelector('.map').style.visibility = "hidden";
            }
        });
    /* ------- */
}

const calculateSpan = (container) => {
    document.querySelectorAll('.group').forEach(element => {
        let maxSpan = 0;

        if (getCookie("align_labels") === "true") {
            container.querySelectorAll('.location').forEach(element => {
                if (element.children.length !== 1) {
                    const labelWidth = element.querySelector('h2').offsetWidth;
                    if (labelWidth > maxSpan) {maxSpan = labelWidth};
                }
            });
        } else {
            maxSpan = null;
        }

        container.querySelectorAll('.location').forEach((element) => {
            if (element.children.length !== 1) {
                element.style.display = "grid";
                const listWidth = element.parentNode.offsetWidth;
                const labelWidth = maxSpan || element.querySelector('h2').offsetWidth;
                const tileWidth = element.querySelector('div').offsetWidth + 4;
                const tiles = element.children.length - 1;

                const fitTiles = Math.round(labelWidth / tileWidth);
                element.querySelector('h2').style.gridColumn = "span "+fitTiles;

                const fitHeight = Math.ceil(tiles / (Math.floor(listWidth / tileWidth) - fitTiles))
                element.querySelector('h2').style.gridRow = "span "+fitHeight;

                element.dataset.tiles_per_row = Math.floor(listWidth / tileWidth) - fitTiles;
            } else {
                element.style.display = "none";
            }
        });
    });
}

const checkHookSnap = (x, y) => {
    if (y > document.getElementById("footer").offsetTop) {        
        return document.getElementById(x > document.getElementById("footer").offsetWidth / 2 ? "hookR" : "hookL");
    }
    if (y < document.getElementById("header").offsetHeight) {
        return document.getElementById(x > document.getElementById("header").offsetWidth / 2 ? "hookT2" : "hookT1");
    }
}

const closeOverlay = () => {
    //history.pushState(null, null, `/desktop/data/timeline`);

    document.getElementById("overlay").style.opacity = 0;
    document.querySelectorAll('.info div').forEach(element => {
        element.style.translate = "0 -100px";
    });
    document.querySelectorAll('.data').forEach(element => {
        element.style.translate = "0 100px";
    });

    setTimeout(function() {
        document.getElementById("overlay").style.display = "none";
    }, 300);
}

const getCurrentTime = (timestamp) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
    const now = new Date(timestamp * 1000);
    const day = now.getDate();
    const month = months[now.getMonth()];
    const hours = ('0' + now.getHours()).slice(-2);
    const minutes = ('0' + now.getMinutes()).slice(-2);
    
    const formattedTime = `${day} ${month} ${hours}:${minutes}`;

    return formattedTime
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

const loadApps = () => {
    let appID, checkSize;
    document.querySelectorAll('.hook').forEach(hook => {
        appID = getCookie(hook.id+"_app")
        if (appID && document.getElementById(appID)) {
            minifyApp(document.getElementById(appID), hook);
            document.getElementById(appID+"Button").classList.add("selected");
        }
    });

    document.querySelectorAll('.app').forEach(app => {
        const header = app.querySelector('.header');
        const button = document.getElementById(app.id+"Button");
        let isDragging = false;
        let offsetX, offsetY;

        if (app.offsetHeight > 10) {
            console.log(app.offsetTop);
            app.style.top = app.offsetTop+"px";
        };

        app.addEventListener("mousedown", (e) => {
            document.querySelectorAll('.app').forEach(item => item.style.zIndex = 0);
            app.style.zIndex = 2;
            checkSize = setInterval(detectSizeChange, 50);
        });

        header.addEventListener("mousedown", (e) => {
            isDragging = true;
            offsetX = e.clientX - app.getBoundingClientRect().left;
            offsetY = e.clientY - app.getBoundingClientRect().top;
        });

        document.addEventListener("mousemove", (e) => {
            if (isDragging) {
                const x = e.clientX - offsetX;
                const y = e.clientY - offsetY;

                app.style.left = x + "px";
                app.style.top = y + "px";

                hook = checkHookSnap(e.clientX, e.clientY);
                if (hook && e.target === header) {
                    const barWidth = getElementBarWidth(app)

                    hook.style.width = barWidth+"px";
                    hook.style.filter = "invert(0.1)";

                    document.querySelectorAll('.hook').forEach(element => {
                        if (element.id !== hook.id) {
                            element.style.width = "0";
                            element.style.removeProperty("filter");
                        }
                    });
                } else {
                    document.querySelectorAll('.hook').forEach(element => {
                        element.style.width = "0";
                        element.style.removeProperty("filter");
                    });
                }
            }
        });

        /* Drop app window. */
        document.addEventListener("mouseup", (e) => {
            hook = checkHookSnap(e.clientX, e.clientY);
            if (hook && e.target === header) {
                minifyApp(app, hook)
            }
            isDragging = false;
            clearInterval(checkSize);
        });
        /* ---------------- */

        header.addEventListener("click", () => {
            const expirationDate = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);
            document.cookie = `${app.id}_left=${app.style.left}; expires=${expirationDate.toUTCString()}; path=/`;
            document.cookie = `${app.id}_bottom="calc(100vh - ${app.style.top} - ${app.offsetHeight}px)"; expires=${expirationDate.toUTCString()}; path=/`;
        })

        let lastWidth;
        let lastHeight;

        const detectSizeChange = () => {
            const currentWidth = Math.round(app.offsetWidth);
            const currentHeight = Math.round(app.offsetHeight);

            if (currentWidth > 10 && (currentWidth !== lastWidth || currentHeight !== lastHeight)) {
                const expirationDate = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);
                document.cookie = `${app.id}_width=${currentWidth}px; expires=${expirationDate.toUTCString()}; path=/`;
                document.cookie = `${app.id}_height=${currentHeight}px; expires=${expirationDate.toUTCString()}; path=/`;

                lastWidth = currentWidth;
                lastHeight = currentHeight;
            }
        }

        button.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            button.classList.remove("selected");

            const hook = document.querySelector(`.hook[data-hooked_app=${app.id}]`);
            if (hook) {
                with (hook){
                    innerHTML = "";
                    document.cookie = `${hook.id}_app=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
                    dataset.hooked_app = undefined;
                }
            }
            app.style.opacity = 0;

            resetAppCookies(app);

            setTimeout(function () {
                if (!button.classList.contains("selected")) {app.style.display = "none";}
            }, 300);
        });
    });

    document.querySelectorAll('.appButton').forEach(button => {
        
    });
}

const minifyApp = (app, hook) => {
    const toHook = app.cloneNode(true);

    if (String(hook.dataset.hooked_app) !== "undefined") {
        document.getElementById(hook.dataset.hooked_app+"Button").classList.remove("selected");
    }

    hook.innerHTML = "";
    hook.dataset.hooked_app = app.id;
    hook.style.width = "fit-content";

    if (toHook.querySelector('table')) {
        console.log("TABLE")
        hook.style.alignItems = hook.dataset.alt_align;
    } else {
        hook.style.alignItems = "center";
    }

    toHook.querySelectorAll('.flexBar').forEach(element => {
        element.style.removeProperty("margin");
        element.style.display = "inline-flex";
    });
    toHook.querySelectorAll('table, p').forEach(element => {
        element.style.removeProperty("font-size");
    });

    for (let childNode of toHook.childNodes) {
        if (!childNode.classList || !childNode.classList.contains("header")) {
            hook.appendChild(childNode.cloneNode(true));
        }
    }

    app.style.display = "none";
    hook.style.removeProperty("filter");

    const expirationDate = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);
    document.cookie = `${hook.id}_app=${app.id}; expires=${expirationDate.toUTCString()}; path=/`;

    resetAppCookies(app);
}

const openCloseApp = (id, button, close) => {
    const expirationDate = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);
    const app = document.getElementById(id);

    close ? button.classList.remove("selected") : button.classList.toggle("selected");

    if (button.classList.contains("selected")) {
        document.cookie = `${id}_display=block; expires=${expirationDate.toUTCString()}; path=/`;
        app.style.display = "block";
        app.style.zIndex = 1;

        setTimeout(function () {
            app.style.top = app.offsetTop+"px";
            app.style.removeProperty("bottom");
            app.style.width = app.offsetWidth+"px";
            app.style.opacity = 1;
        }, 0);
    } else {
        document.cookie = `${id}_display=none; expires=${expirationDate.toUTCString()}; path=/`;
        const hook = document.querySelector(`.hook[data-hooked_app=${app.id}]`);
        if (hook) {
            with (hook){
                innerHTML = "";
                document.cookie = `${hook.id}_app=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
                dataset.hooked_app = undefined;
            }
        }
        app.style.opacity = 0;

        setTimeout(function () {
            if (!button.classList.contains("selected")) {app.style.display = "none";}
        }, 300);
    }
}

const openOverlay = () => {
    document.getElementById("overlay").style.display = "flex";

    setTimeout(function() {
        document.getElementById("overlay").style.opacity = 1;
        document.querySelectorAll('.data, .info div').forEach(element => {
            element.style.opacity = 1;
            element.style.translate = "0 0";
        });
    }, 0);
}

const resetAppCookies = (app) => {
    setTimeout(function() {
        app.querySelectorAll('table, p').forEach(element => {
            element.style.removeProperty("font-size");
        });
        
        app.style.bottom = "calc(var(--footer-height) + 10px)";
        app.style.left = "10px";
        app.style.removeProperty("height");
        app.style.removeProperty("top");
        app.style.removeProperty("width");
        document.cookie = `${app.id}_display=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
        document.cookie = `${app.id}_left=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
        document.cookie = `${app.id}_bottom=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
        document.cookie = `${app.id}_width=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
        document.cookie = `${app.id}_height=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    }, 100);
}

const sortItems = (container, selector) => {
    const locations = Array.from(container.querySelectorAll(selector));
    
    const quickSort = (arr) => {
        if (arr.length <= 1) {
            return arr;
        }
        
        const pivot = arr[Math.floor(arr.length / 2)].id;
        const left = arr.filter(item => item.id < pivot);
        const middle = arr.filter(item => item.id == pivot);
        const right = arr.filter(item => item.id > pivot);
        
        return [...quickSort(left), ...middle, ...quickSort(right)];
    }

    const sortedLocations = quickSort(locations);

    // Clear the container
    container.querySelectorAll(selector).forEach(location => location.remove())

    // Append sorted tiles back to the container
    for (const location of sortedLocations) {
        container.appendChild(location);
    }
}

const sortTiles = (container) => {
    const tiles = Array.from(container.querySelectorAll('.kiosk'));
    
    const quickSort = (arr) => {
        if (arr.length <= 1) {
            return arr;
        }
        
        const pivot = arr[Math.floor(arr.length / 2)].id.slice(-3);
        const left = arr.filter(item => item.id.slice(-3) < pivot);
        const middle = arr.filter(item => item.id.slice(-3) == pivot);
        const right = arr.filter(item => item.id.slice(-3) > pivot);
        
        return [...quickSort(left), ...middle, ...quickSort(right)];
    }

    const sortedTiles = quickSort(tiles);

    // Clear the container
    container.querySelectorAll('.kiosk').forEach(tile => tile.remove())

    // Append sorted tiles back to the container
    for (const tile of sortedTiles) {
        container.appendChild(tile);
    }
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

    fetch(base+url, {
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

let dayOffset = 0, timeToReach = 0, switchingDay = false;
const switchDay = async (multiplier) => {
    // dayOffset -= multiplier;

    slider.min = Number(slider.min) + multiplier * 86400;
    slider.max = Number(slider.max) + multiplier * 86400;
    // slider.value = sliderValue + multiplier * 86400;

    const endTime = Math.floor(new Date(Number(slider.max) * 1000).getTime() / 1000);
    let startTime = new Date(Number(slider.min) * 1000);
    startTime.setHours(0, 0, 0, 0);
    startTime = Math.floor(new Date(startTime).getTime() / 1000) - 172800;

    timeline_data = (await (await fetch(`database?query=SELECT time, kiosk_name, from_urgency_level, to_urgency_level FROM kiosktimeline WHERE time BETWEEN ${startTime} AND ${endTime} ORDER BY kiosk_name, time DESC`)).json()).data;

    grouped_data = {};

    for (let item of timeline_data) {
        if (!grouped_data[item.kiosk_name]) grouped_data[item.kiosk_name] = [];
        grouped_data[item.kiosk_name].push(item);
    }
}

const switchDay_Anim = async (multiplier) => {
    slider.disabled = true;
    timeToReach = Number(slider.value) + multiplier * 86400;

    if (multiplier === -1) {
        while (timeToReach < Number(slider.value)) {
            slider.value = Number(slider.value) + Math.floor((timeToReach - Number(slider.value)) / 86400) * 600;

            updateGrid(Number(slider.value));
            updateTooltip();

            await new Promise(resolve => {setTimeout(() => {resolve()}, 0);});

            if (slider.value === slider.min) switchDay(-1);
        }
    } else {
        while (timeToReach > Number(slider.value)) {
            slider.value = Number(slider.value) + Math.ceil((timeToReach - Number(slider.value)) / 86400) * 600;

            updateGrid(Number(slider.value));
            updateTooltip();

            await new Promise(resolve => {setTimeout(() => {resolve()}, 0);});

            if (slider.value === slider.max) switchDay(1);
        }
    }

    slider.disabled = false;
}

const switchDay_Handler = (direction) => {
    // dayOffset += direction;
    if (!slider.disabled) {
        switchDay_Anim(direction)
    } else {
        timeToReach += direction * 86400;
    }
}

const updateGrid = (time) => {
    const unixTimestamp = time;
    const currentTime = Math.floor((new Date()).getTime() / 1000);

    let currentUrgency, group;
    for (let kioskName in grouped_data) {
        if (!document.getElementById(kioskName)) continue;
        currentUrgency = Number(document.getElementById(kioskName).dataset.urgency_level);
        let found = false;

        for (let item of grouped_data[kioskName]) {
            if (item.time < unixTimestamp || unixTimestamp > currentTime) {
                if (item.to_urgency_level !== currentUrgency) {
                    updateUrgency(document.getElementById(kioskName), item.to_urgency_level);
                }
                found = true;
                break;
            }
        }

        if (!found) {updateUrgency(document.getElementById(kioskName), grouped_data[kioskName][grouped_data[kioskName].length-1].from_urgency_level)}
    }
}

const updateLocations = () => {
    document.querySelectorAll('.group').forEach(element => {
        calculateSpan(element);
    });
}

const updateOverlaySize = () => {
    let fontSize = 50;
    document.getElementById("text_overlay").style.fontSize = fontSize + "rem";

    while (document.getElementById("text_overlay").offsetWidth > window.innerWidth) {
        fontSize--;
        document.getElementById("text_overlay").style.fontSize = fontSize + "rem";
    }
    while (document.getElementById("text_overlay").offsetHeight > window.innerHeight) {
        fontSize--;
        document.getElementById("text_overlay").style.fontSize = fontSize + "rem";
    }
}

const updateTooltip = () => {
    const thumbWidth = 20; // Width of the thumb (adjust as needed)
    const tooltipWidth = tooltip.offsetWidth;
    
    const thumbPosition = ((slider.value - slider.min) / (slider.max - slider.min)) * (slider.offsetWidth - thumbWidth);
    tooltip.style.display = 'block';

    tooltip.style.left = `${(window.innerWidth / 2 - (slider.offsetWidth / 2)) + thumbPosition + (thumbWidth / 2) - tooltipWidth / 2}px`;

    tooltip.querySelector('.tooltip-content').textContent = getCurrentTime(Number(slider.value));
}

const updateUrgency = (tile, newUrgency) => {
    tile.classList.forEach(className => {
        if (className.includes("urgency_")) {
            tile.classList.remove(className)
        }
    });
    tile.classList.add("urgency_"+newUrgency);
    tile.dataset.oldest_report = status_database[tile.id].oldest_report;
    tile.dataset.urgency_level = newUrgency;
}

loadGrid();
updateTooltip();
updateOverlaySize();

slider.addEventListener('input', () => {
    updateGrid(Number(slider.value));
    updateTooltip();
});

window.addEventListener('resize', () => {
    updateTooltip();
    updateOverlaySize();
})

addEventListener("resize", (event) => {updateLocations();});
document.querySelector('#overlay').addEventListener("click", (event) => {
    if (event.target.classList.contains("clickToClose")) {closeOverlay()};
});