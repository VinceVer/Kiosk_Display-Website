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

const port = document.getElementById("data_storage").dataset.port;
const base = location.href.split("/")[0]+"/"+port;

if (!/Mobi|Android/i.test(navigator.userAgent)) {
    location.href = base+"/desktop"
}

const loadGrid = () => {
    for (let group of config_data.groups) {
        const groupElement = document.createElement('div');

        with (groupElement) {
            id = group.name;
            classList.add("group");
            appendChild(document.createElement('h1'));
            querySelector('h1').innerText = group.name;
            querySelector('h1').addEventListener("click", () => {
                history.pushState(null, null, `/mobile/grid/g/${group.name}`);
                appendData_GROUP(group.name)
            })

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
        sortLocations(groupElement);
    }

    for (let kioskIndex in status_database) {
        if (status_database[kioskIndex].location !== ".undefined" && document.getElementById(status_database[kioskIndex].location)) {
            const div = document.createElement('div');

            div.id = status_database[kioskIndex].id;
            div.dataset.last_update = status_database[kioskIndex].last_update;
            div.style.opacity = localStorage.getItem(`${div.id}.IGNORE`) === "true" ? 0.2 : 1;
            div.appendChild(document.createElement('p'))
            div.querySelector('p').innerText = status_database[kioskIndex].id.slice(-3);
            div.classList.add("kiosk", "urgency_"+status_database[kioskIndex].urgency_level);
            div.addEventListener("click", () => {
                history.pushState(null, null, `/mobile/grid/k/${kioskIndex}`);
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
}

const alert = (info) => {
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

const appendData = async (kioskIndex) => {
    const kiosk = status_database[kioskIndex]

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
                if (!property.includes("status_") && !property.includes("urgency_")) {
                    const text = document.createElement('h5');
                    text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(device[property]) ? device[property].replaceAll("undefined","<span style='color: var(--alert-color)'>undefined</span>") : `<span style='color: var(--link-color)'>${device[property]}</span>`}`;
                    querySelector('.content div').appendChild(text);
                }
            }

            addEventListener("click", (event) => {
                if (window.getSelection().toString() !== '') {return;}
                with (querySelector('.content')) {
                    classList.toggle("active");
                    style.height = classList.contains("active") ? querySelector('div').offsetHeight + "px" : 0;
                }
            });

            addEventListener("contextmenu", (event) => {
                if (event.target.classList.contains("flexBar") || event.target.parentNode.classList.contains("flexBar")) {
                    loadContextMenu_SEGMENT(event, segment);
                }
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
                ? "Last Updated: " + getTimeSince(new Date() - new Date(application.last_update || application.last_seen))
                : "Last Seen: " + getTimeSince(new Date() - new Date(application.last_seen));

            for (let property in application) {
                if (!property.includes("status_") && !property.includes("urgency_")) {
                    const text = document.createElement('h5');
                    text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(application[property]) ? application[property].replaceAll("undefined","<span style='color: var(--alert-color)'>undefined</span>") : `<span style='color: var(--link-color)'>${application[property]}</span>`}`;
                    querySelector('.content div').appendChild(text);
                }
            }

            addEventListener("click", (event) => {
                if (window.getSelection().toString() !== '') {return;}
                with (querySelector('.content')) {
                    classList.toggle("active");
                    style.height = classList.contains("active") ? querySelector('div').offsetHeight + "px" : 0;
                }
            });

            addEventListener("contextmenu", (event) => {
                if (event.target.classList.contains("flexBar") || event.target.parentNode.classList.contains("flexBar")) {
                    loadContextMenu_SEGMENT(event, segment);
                }
            });
        }
        
        document.getElementById("applications").appendChild(segment);
    }
    /* ------------- */

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
                            if (window.getSelection().toString() !== '') {return;}
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
                            if (window.getSelection().toString() !== '') {return;}
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

const closeOverlay = () => {
    history.pushState(null, null, `/mobile/grid`);

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

const getCookie = (cookieName) => {
    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
  
    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return null; // Return null if the cookie is not found
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

const loadContextMenu_SEGMENT = (event, segment) => {
    const onlineButton = segment_contextMenu.querySelector('button[name=online]');

    event.preventDefault();

    onlineButton.onclick = () => {
        document.dispatchEvent(clickEvent);
        alert({title: `Change <span style='color: var(--text-color1)'>${segment.id}</span> to "Online"?`, description: `Are you sure you want to update the status of <span style='color: var(--text-color1)'>${segment.id}</span>?`,
            buttons: [{text: "Cancel", invert: 0.85, action: () => {location.reload()}}, {text: "Confirm", action: (event) => {
                sendRequest(`/update/queue.json/${segment.id}`,{value: "ONLINE"});
            }}]
        });
    }

    with (segment_contextMenu) {
        querySelector('button.title').innerText = segment.id;
        style.display = "flex";
        style.top = event.pageY + "px";
    }

    setTimeout(() => {
        segment_contextMenu.style.left = (event.pageX < window.innerWidth/2 ? event.pageX : event.pageX - segment_contextMenu.offsetWidth) + "px";
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

const sortLocations = (container) => {
    const locations = Array.from(container.querySelectorAll('.location'));
    
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
    container.querySelectorAll('.location').forEach(location => location.remove())

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
}

loadGrid();

addEventListener("resize", (event) => {
    if (window.innerHeight > window.innerWidth) {
        location.href = base+"/mobile"+location.href.split("mobile/grid")[1];
    } else {
        updateLocations();
    }
});

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
    updateAppP();

    setInterval(async function() {
        status_database = await (await fetch('status-database')).json();

        if (document.getElementById("overlay").style.display !== "block") {
            let tile;
            for (let kioskIndex in status_database) {
                tile = document.getElementById(kioskIndex);
                if (tile && !tile.classList.contains("urgency_"+status_database[kioskIndex].urgency_level)) {
                    updateUrgency(tile, status_database[kioskIndex].urgency_level)
                }
            }

            misc_data = await (await fetch('storage/misc.json')).json();
            updateAppP();
            updateAppT();
            document.getElementById("alert").innerText = misc_data.alert;

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
    }, 15000);
}