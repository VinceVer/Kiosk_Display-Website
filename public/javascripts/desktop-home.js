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

const loadGrid = () => {
    for (let group of config_data.groups) {
        const groupElement = document.createElement('div');

        with (groupElement) {
            id = group.name;
            classList.add("group");
            appendChild(document.createElement('h1'));
            querySelector('h1').innerText = group.name;
            querySelector('h1').addEventListener("click", () => {
                history.pushState(null, null, `desktop/g/${group.name}`);
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
            div.style.opacity = localStorage.getItem(`${div.id}.IGNORE`) === "true" ? 0.2 : 1;
            div.appendChild(document.createElement('p'))
            div.querySelector('p').innerText = status_database[kioskIndex].id.slice(-3);
            div.classList.add("kiosk", "urgency_"+status_database[kioskIndex].urgency_level);
            div.addEventListener("click", () => {
                history.pushState(null, null, `desktop/k/${kioskIndex}`);
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

    if (location.href.includes("/k/")) appendData(location.href.split("/k/")[1]);
    if (location.href.includes("/g/")) appendData_GROUP(location.href.split("/g/")[1]);

    let background_file = getCookie("background_file");
    console.log(background_file, "&", getCookie(`background_extension[${config_data.location}]`));
    if (!background_file.includes(".")) background_file = `${background_file}.${getCookie(`background_extension[${config_data.location}]`)}`;
    document.body.style.backgroundImage = `url(images/${background_file})`;
}

const app_iHandler = (bar) => {
    const type = bar.querySelector('.i_type').value,
          time = bar.querySelector('.i_time').value;

    if (type !== "" && time !== "") {
        const condition = type.split(" + ").map(segment => segment + "%20IS%20NOT%20NULL").join("%20OR%20");
        location.href = base+`/desktop/info?query=SELECT%20kiosk_name,%20device_name,%20start_value,%20end_value%20FROM%20(SELECT%20kiosk_name,%20device_name,%20FIRST_VALUE(${type})%20OVER%20(PARTITION%20BY%20device_name%20ORDER%20BY%20time%20ASC)%20AS%20start_value,%20FIRST_VALUE(${type})%20OVER%20(PARTITION%20BY%20device_name%20ORDER%20BY%20time%20DESC)%20AS%20end_value%20FROM%20devicetimeline%20WHERE%20time%20BETWEEN%20${getUnixTimestamp(time)}%20AND%20${getUnixTimestamp()}%20AND%20(${condition}))%20AS%20subquery%20GROUP%20BY%20device_name%20ORDER%20BY%20kiosk_name`;
    }
}

const appendData = async (kioskIndex) => {
    const kiosk = status_database[kioskIndex];

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
                ? "Last Updated: " + getTimeSince(new Date() - new Date(device.last_update || devices.last_seen))
                : "Last Seen: " + getTimeSince(new Date() - new Date(device.last_seen));

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
    for (let appName in kiosk.applications) {
        const segment = document.querySelector('#templates #segment').cloneNode(true);
        const application = kiosk.applications[appName];

        with (segment) {
            id = appName+"."+kiosk.id;
            dataset.urgency_level = application.urgency_level;
            querySelector('h3').innerText = `${application.status_indicator} ${application.display_name || appName}`;
            querySelector('h4').innerText = application.status_message;
            //querySelector('h5').innerText += getTimeSince(new Date() - new Date(application.last_seen));
            querySelector('h5').innerText = application.urgency_level > -1
                ? "Last Updated: " + getTimeSince(new Date() - new Date(application.last_update || application.last_seen))
                : "Last Seen: " + getTimeSince(new Date() - new Date(application.last_seen));

            for (let property in application) {
                if (!property.includes("status_")) {
                    const text = document.createElement('h5');
                    text.id = property;
                    text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(application[property]) ? application[property].replaceAll("undefined","<span style='color: var(--alert-color)'>undefined</span>") : `<span style='color: var(--link-color)'>${application[property]}</span>`}`;
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
        
        sortItems(segment.querySelector('.content div'), 'h5')
        document.getElementById("applications").appendChild(segment);
    }
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

const appendData_GROUP = async (groupName) => {
    document.getElementById("devices").innerHTML = "<h2>Devices</h2>";
    document.getElementById("applications").innerHTML = "<h2>Applications</h2>";
    document.querySelector('.banner h1').innerText = groupName;

    let kiosk;
    for (let kioskName in status_database) {
        kiosk = status_database[kioskName]
        if (kiosk.group === groupName) {
            /* Devices. */
            for (let deviceName in kiosk.devices) {
                if (kiosk.devices[deviceName].urgency_level > -1) {
                    const segment = document.querySelector('#templates #segment').cloneNode(true);
                    const device = kiosk.devices[deviceName];

                    with (segment) {
                        id = device.device_name;
                        dataset.urgency_level = device.urgency_level;
                        querySelector('h3').innerText = `${device.status_indicator} ${deviceName}`;
                        querySelector('h4').innerText = device.status_message;
                        querySelector('h5').innerHTML = device.urgency_level > 0
                        ? "Last Updated: " + getTimeSince(new Date() - new Date(device.last_update)) + ` (${kiosk.location}: <span style="font-weight: bold;">${kiosk.id.slice(-3)}</span>)`
                        : "Last Seen: " + getTimeSince(new Date() - new Date(device.last_seen)) + ` (${kiosk.location}: <span style="font-weight: bold;">${kiosk.id.slice(-3)}</span>)`;

                        for (let property in device) {
                            if (!property.includes("status_") && !property.includes("urgency_")) {
                                const text = document.createElement('h5');
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
                    }

                    document.getElementById("devices").appendChild(segment);
                }
            }
            /* -------- */

            /* Applications. */
            for (let appName in kiosk.applications) {
                if (kiosk.applications[appName].urgency_level > -1) {
                    const segment = document.querySelector('#templates #segment').cloneNode(true);
                    const application = kiosk.applications[appName];
            
                    with (segment) {
                        id = appName+"."+kiosk.id;
                        dataset.urgency_level = application.urgency_level;
                        querySelector('h3').innerText = `${application.status_indicator} ${application.display_name || appName}`;
                        querySelector('h4').innerText = application.status_message;
                        querySelector('h5').innerHTML = `(${kiosk.location}: <span style="font-weight: bold;">${kiosk.id.slice(-3)}</span>)`;
            
                        for (let property in application) {
                            if (!property.includes("status_") && !property.includes("urgency_")) {
                                const text = document.createElement('h5');
                                text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(application[property]) ? application[property].replaceAll("undefined","<span style='color: var(--alert-color)'>undefined</span>") : `<span style='color: var(--link-color)'>${application[property]}</span>`}`;
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
                    }
                    
                    document.getElementById("applications").appendChild(segment);
                }
            }
            /* ------------- */
        }
    }

    openOverlay();

    /* Images. */
    // fetch(`images/${kiosk.location}.BANNER.jpg`)
    //     .then(async response => {
    //         if (response.ok) {
    //             const bannerURL = URL.createObjectURL(await response.blob());
    //             document.querySelector('.banner').style.backgroundImage = `url(${bannerURL})`;
    //         } else {
    //             document.querySelector('.banner').style.backgroundImage = `url('')`;
    //         }
    //     })
    
    // fetch(`images/${kiosk.location}.MAP.jpg`)
    //     .then(async response => {
    //         if (response.ok) {
    //             const mapURL = URL.createObjectURL(await response.blob());
    //             document.querySelector('.map').style.backgroundImage = `url(${mapURL})`;
    //             document.querySelector('.map').style.visibility = "visible";
    //         } else {
    //             document.querySelector('.map').style.visibility = "hidden";
    //         }
    //     });
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
    history.pushState(null, null, `desktop`);

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

const getElementBarWidth = (element) => {
    const tempElement = element.cloneNode(true);
    tempElement.style.visibility = "hidden";
    tempElement.style.width = "fit-content";
    tempElement.querySelectorAll('.flexBar').forEach(element => {
        element.style.removeProperty("margin")
        element.style.display = "inline-flex";
    });
    tempElement.querySelectorAll('table').forEach(element => element.style.removeProperty("font-size"));
    tempElement.querySelectorAll('p').forEach(element => {
        element.style.fontSize = "1.7rem";
        element.style.margin = 0;
    });
    document.body.appendChild(tempElement)
    const width = tempElement.offsetWidth;
    tempElement.remove();
    return width;
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
        if (appID) {
            minifyApp(document.getElementById(appID), hook);
            document.getElementById(appID+"Button").classList.add("selected");
        }
    });

    document.querySelectorAll('.app').forEach(app => {
        updateFontSize(app)

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
                
                updateFontSize(app);
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

const loadContextMenu_SEGMENT = (event, segment) => {
    const statusButton = segment_contextMenu.querySelector('button[name=status]'),
          onlineButton = segment_contextMenu.querySelector('button[name=online]');

    event.preventDefault();

    onlineButton.onclick = () => {
        document.dispatchEvent(clickEvent);
        alert({title: `Change <span style='color: var(--text-color1)'>${segment.id}</span> to "Online"?`, description: `Are you sure you want to update the status of <span style='color: var(--text-color1)'>${segment.id}</span>?`,
            buttons: [{text: "Cancel", invert: 0.85, action: () => {location.reload()}}, {text: "Confirm", action: (event) => {
                sendRequest(`/update/queue.json/${segment.id}`,{value: "ONLINE"});
            }}]
        });
    }

    /* Modify status messages. */
    const kioskName = segment.id.split(".")[segment.id.split(".").length-1];
    const kioskObject = status_database[kioskName];
    const segmentName = segment.id.replace(`.${kioskName}`, "");
    const segmentObject = kioskObject.devices[segmentName] || kioskObject.applications[segmentName];

    let codeObject, statusObject;
    for (let statusType in config_data.status_messages) {
        statusObject = config_data.status_messages[statusType];

        for (let statusCode in statusObject.codes) {
            if (Number[statusCode] === segmentObject[statusType+"_status"] || Number[statusCode] === segmentObject[statusType+"_connection"]) {
                codeObject = statusObject.codes[statusCode];
                if (codeObject.messages.includes(segmentObject.status_message)) {
                    statusButton.dataset.href = codeObject.static ? "null" : base+`/settings/status/${statusType}/${statusCode}`;
                };
            }
        }
    }

    statusButton.onclick = () => {
        document.dispatchEvent(clickEvent);

        location.href = statusButton.dataset.href;
    }

    if (statusButton.dataset.href === "null") {
        statusButton.onclick = ()=>{}
        statusButton.style.filter = "saturate(0.4) brightness(0.4)";
    } else {
        statusButton.style.removeProperty("filter");
    }
    /* ----------------------- */

    /* Remove from database. */
    segment_contextMenu.querySelector('button[name=remove]').onclick = () => {
        document.dispatchEvent(clickEvent);
        alert({title: `Remove <span style='color: var(--text-color1)'>${segment.id}</span>?`, description: `Are you sure you want to remove <span style='color: var(--text-color1)'>${segment.id}</span>?<br><span style='color: #A64141'>This action cannot be undone.</span>`,
            buttons: [{text: "Cancel", invert: 0.85, action: () => {location.reload()}}, {text: "Confirm", action: (event) => {
                sendRequest(`/update/queue.json/${segment.id}`,{value: "DELETE"});
            }}]
        });
    }

    if (segment.dataset.urgency_level === "-1") {
        onlineButton.onclick = ()=>{};
        onlineButton.style.filter = "saturate(0.4) brightness(0.4)"
    } else {
        onlineButton.style.removeProperty("filter");
    }
    /* --------------------- */

    with (segment_contextMenu) {
        querySelector('button.title').innerText = segment.id;
        style.display = "flex";
        style.left = event.pageX + "px";
        style.top = event.pageY + "px";
    }

    setTimeout(() => {
        segment_contextMenu.style.height = segment_contextMenu.scrollHeight + "px";
        segment_contextMenu.style.opacity = 1;
    }, 1);
}

const loadContextMenu_TILE = (event, tile) => {
    event.preventDefault();
    tile_contextMenu.querySelector('button[name=ignore]').onclick = () => {
        document.dispatchEvent(clickEvent);
        localStorage.setItem(`${tile.id}.IGNORE`, localStorage.getItem(`${tile.id}.IGNORE`) === "true" ? "false" : "true");
        tile.style.opacity = localStorage.getItem(`${tile.id}.IGNORE`) === "true" ? 0.2 : 1;
    }

    tile_contextMenu.querySelector('button[name=online]').onclick = () => {
        document.dispatchEvent(clickEvent);
        alert({title: `Change <span style='color: var(--text-color1)'>${tile.id}</span> to "Online"?`, description: `Are you sure you want to update the status of <span style='color: var(--text-color1)'>${tile.id}</span>?`,
            buttons: [{text: "Cancel", invert: 0.85, action: () => {location.reload()}}, {text: "Confirm", action: (event) => {
                sendRequest(`/update/queue.json/${tile.id}`,{value: "ONLINE"});
            }}]
        });
    }

    tile_contextMenu.querySelector('button[name=remove]').onclick = () => {
        document.dispatchEvent(clickEvent);
        alert({title: `Remove <span style='color: var(--text-color1)'>${tile.id}</span>?`, description: `Are you sure you want to remove <span style='color: var(--text-color1)'>${tile.id}</span>?<br><span style='color: #A64141'>This action cannot be undone.</span>`,
            buttons: [{text: "Cancel", invert: 0.85, action: () => {location.reload()}}, {text: "Confirm", action: (event) => {
                sendRequest(`/update/queue.json/${tile.id}`,{value: "DELETE"});
            }}]
        });
    }

    with (tile_contextMenu) {
        querySelector('button.title').innerText = tile.id;
        querySelector('button[name=ignore]').innerText = localStorage.getItem(`${tile.id}.IGNORE`) === "true" ? "Show status" : "Ignore status";
        style.display = 'flex';
        style.left = event.pageX + 'px';
        style.top = event.pageY + 'px';
    }

    if (tile.classList.contains("urgency_-1")) {
        tile_contextMenu.querySelector('button[name=online]').onclick = () => {};
        tile_contextMenu.querySelector('button[name=online]').style.filter = "saturate(0.4) brightness(0.4)"
    } else {
        tile_contextMenu.querySelector('button[name=online]').style.removeProperty("filter");
    }

    setTimeout(() => {
        tile_contextMenu.style.height = tile_contextMenu.scrollHeight + "px";
        tile_contextMenu.style.opacity = 1;
    }, 1);
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
        updateFontSize(app);

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

const sendRequest = (url, value, alertInfo) => {
    fetch(base+url, {
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

const updateApp5 = () => {
    let app5_list = [];
    const includedUrgencies = [1, 4, 5];
    const tableRow = document.getElementById("app_5Row");
    const hook = document.querySelector('.hook[data-hooked_app=app_5] table tbody');

    let devices;
    for (let kioskName in status_database) {
        devices = status_database[kioskName].devices
        for (let deviceType in devices) {
            if (includedUrgencies.includes(devices[deviceType].urgency_level)) {
                app5_list.push({icon: devices[deviceType].status_indicator, name: devices[deviceType].device_name, time: new Date() - new Date(devices[deviceType].last_update)})
            }
        }
    }

    app5_list = app5_list.sort((a, b) => b.time - a.time)

    document.querySelector('#app_5.app table tbody').innerHTML = "";
    if (hook) {hook.innerHTML = "";}

    for (let report of app5_list) {
        const newRow = tableRow.cloneNode(true);
        newRow.querySelector('.name').innerText = `${report.icon} ${report.name}`;
        newRow.querySelector('.time').innerText = getTimeSince(report.time);
        document.querySelector('#app_5.app table tbody').appendChild(newRow);
        if (hook) {hook.appendChild(newRow.cloneNode(true))}
    }
}

const updateAppP = () => {
    document.querySelectorAll('.health_score').forEach(element => {
        element.style.color = `hsl(${(misc_data.score-50)*2}, 100%, 65%)`;
        element.innerText = `Health Score: ${misc_data.score}%`;
    });
}

const updateAppT = () => {
    if (misc_data.last_check === "Fetching...") {
        document.querySelectorAll('.last_check').forEach(element => element.innerText = "Fetching...");
    } else {
        const millisecondsDiff = new Date() - new Date(misc_data.last_check);
        document.querySelectorAll('.last_check').forEach(element => element.innerText = (millisecondsDiff > 600000 ? "⚠️ " : "") + "Last check: " + getTimeSince(millisecondsDiff));
    }
}

const updateAppS = () => {
    // document.querySelectorAll('.standby_updated').forEach(element => {
    //     element.innerText = "Stanby - " + misc_data
    // });

    if (!document.querySelector('.flexBar[for=standby]') || (document.querySelector('.flexBar[for=standby]').dataset.last_name === misc_data.standby.name && document.querySelector('.flexBar[for=standby]').dataset.last_phone === misc_data.standby.phone)) return;
    document.querySelectorAll('.flexBar[for=standby]').forEach(element => {
        element.dataset.last_name = misc_data.standby.name
        element.dataset.last_phone = misc_data.standby.phone
    });
    document.querySelectorAll('.flexBar[for=standby] input[name=name]').forEach(element => element.value = misc_data.standby.name);
    document.querySelectorAll('.flexBar[for=standby] input[name=phone]').forEach(element => element.value = misc_data.standby.phone);
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

const updateLocations = () => {
    document.querySelectorAll('.group').forEach(element => {
        calculateSpan(element);
    });
}

const updateUrgency = (tile, newUrgency) => {
    tile.classList.forEach(className => {
        if (className.includes("urgency_")) {
            tile.classList.remove(className)
        }
    });
    tile.classList.add("urgency_"+newUrgency);
    tile.dataset.oldest_report = status_database[tile.id].oldest_report;
}

loadGrid();

addEventListener("resize", (event) => {updateLocations();});
document.querySelector('#overlay').addEventListener("click", (event) => {
    if (event.target.classList.contains("clickToClose")) {closeOverlay()};
});

document.addEventListener('click', () => {
    document.querySelectorAll('.app').forEach(item => item.style.zIndex = 0);
    document.querySelectorAll('.contextMenu').forEach(element => {
        element.style.height = 0;
        element.style.opacity = 0;
        setTimeout(function() {
            element.style.display = 'none';
        }, 300);
    });
});

document.querySelectorAll('.contextMenu').forEach(element => {
    element.addEventListener('click', (event) => {
        event.stopPropagation();
    });
});

window.addEventListener('popstate', () => {
    if (location.href.includes("/k/")) {appendData(location.href.split("/k/")[1]); return;}
    if (location.href.includes("/g/")) {appendData_GROUP(location.href.split("/g/")[1]); return;}
    if (document.getElementById("overlay").offsetHeight > 0) {closeOverlay(); return;}
});

if (!location.href.includes("desktop/layout")) {
    misc_data = JSON.parse(document.getElementById("data_storage").dataset.misc_data);

    updateAppT();
    updateApp5();
    updateAppP();
    updateAppS();
    loadApps();

    setInterval(async function() {
        if (!skipUpdate) {
            status_database = await (await fetch('status-database')).json();

            updateApp5();
            misc_data = await (await fetch('storage/misc.json')).json();
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

            if (true || misc_data.score < 100 || document.querySelector('.kiosk:not(.urgency_-1)')) {
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