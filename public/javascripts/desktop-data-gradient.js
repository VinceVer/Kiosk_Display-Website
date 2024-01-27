const config_data = JSON.parse(document.getElementById("data_storage").dataset.config_data);
let status_database = JSON.parse(document.getElementById("data_storage").dataset.status_database);
let data, kioskData, misc_data;
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
            querySelector('h1').addEventListener("click", () => {appendData_GROUP(group.name)})

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

            with (div) {
                id = status_database[kioskIndex].id;
                dataset.oldest_report = status_database[kioskIndex].oldest_report;
                //style.opacity = localStorage.getItem(`${div.id}.IGNORE`) === "true" ? 0.2 : 1;
                style.opacity = 0; //--------------------//
                appendChild(document.createElement('p'))
                querySelector('p').innerText = status_database[kioskIndex].id.slice(-3);
                classList.add("kiosk");
                addEventListener("click", () => {appendData(kioskIndex);});
                addEventListener("contextmenu", (event) => {
                    loadContextMenu_TILE(event, div);
                });
                addEventListener("mouseover", () => {showTooltip(div);});
            }

            document.getElementById(status_database[kioskIndex].location).appendChild(div);
        }
    }

    document.querySelectorAll('.location').forEach(location => sortTiles(location));

    updateLocations();
    loadOverlay(getCookie("overlay"));
    visualizeData();

    document.getElementById("display").style.visibility = "visible";

    loadApps();

    let background_file = getCookie("background_file");
    console.log(background_file, "&", getCookie(`background_extension[${config_data.location}]`));
    if (!background_file.includes(".")) background_file = `${background_file}.${getCookie(`background_extension[${config_data.location}]`)}`;
    document.body.style.backgroundImage = `url(/images/${background_file})`;
}

const app_iHandler = (bar) => {
    const type = bar.querySelector('.i_type').value,
          time = bar.querySelector('.i_time').value.replaceAll("_","");

    if (type !== "" && time !== "") {
        const condition = type.split(" + ").map(segment => segment + "%20IS%20NOT%20NULL").join("%20AND%20");

        document.querySelectorAll('.kiosk').forEach(tile => {
            tile.style.transition = "opacity 1.5s ease"
            setTimeout(function() {
                tile.style.opacity = 0
            }, Math.random() * 500);
        });

        setTimeout(function() {
            history.pushState(null, null, `/desktop/data/gradient?query=SELECT%20kiosk_name,%20device_name,%20start_value,%20end_value%20FROM%20(SELECT%20kiosk_name,%20device_name,%20FIRST_VALUE(${type})%20OVER%20(PARTITION%20BY%20device_name%20ORDER%20BY%20time%20ASC)%20AS%20start_value,%20FIRST_VALUE(${type})%20OVER%20(PARTITION%20BY%20device_name%20ORDER%20BY%20time%20DESC)%20AS%20end_value%20FROM%20devicetimeline%20WHERE%20time%20BETWEEN%20${getUnixTimestamp(time)}%20AND%20${getUnixTimestamp()}%20AND%20${condition})%20AS%20subquery%20GROUP%20BY%20device_name%20ORDER%20BY%20kiosk_name`);
            visualizeData();
            document.getElementById("alert").innerHTML = `<span style="color: var(--text-color1)">Currently displaying:</span> <span class=t-stress>${type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")} over ${bar.querySelector('.i_time').value.replaceAll("_"," ")}</span>`;
        }, 2000);
    }
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
                ? "Last Updated: " + getTimeSince(new Date() - new Date(device.last_update))
                : "Last Seen: " + getTimeSince(new Date() - new Date(device.last_seen));

            for (let property in device) {
                if (!property.includes("status_")) {
                    const text = document.createElement('h5');
                    text.id = property;
                    text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(device[property]) ? device[property] : `<span style='color: var(--link-color)'>${device[property]}</span>`}`;
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
            querySelector('h5').innerText += getTimeSince(new Date() - new Date(application.last_seen));

            for (let property in application) {
                if (!property.includes("status_")) {
                    const text = document.createElement('h5');
                    text.id = property;
                    text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(application[property]) ? application[property] : `<span style='color: var(--link-color)'>${application[property]}</span>`}`;
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
        
        sortItems(segment.querySelector('.content div'), 'h5')
        document.getElementById("applications").appendChild(segment);
    }
    /* ------------- */

    sortItems(document.getElementById("devices"), '.segment');
    sortItems(document.getElementById("applications"), '.segment');
    openOverlay();

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
                                text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(device[property]) ? device[property] : `<span style='color: var(--link-color)'>${device[property]}</span>`}`;
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
                                text.innerHTML = `<span class=t-stress>${property}</span>: ${isNaN(application[property]) ? application[property] : `<span style='color: var(--link-color)'>${application[property]}</span>`}`;
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
    // fetch(`/images/${kiosk.location}.BANNER.jpg`)
    //     .then(async response => {
    //         if (response.ok) {
    //             const bannerURL = URL.createObjectURL(await response.blob());
    //             document.querySelector('.banner').style.backgroundImage = `url(${bannerURL})`;
    //         } else {
    //             document.querySelector('.banner').style.backgroundImage = `url('')`;
    //         }
    //     })
    
    // fetch(`/images/${kiosk.location}.MAP.jpg`)
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

const hexToRgb = (hex) => {
    // Remove the '#' if present
    hex = hex.replace('#', '');

    // Convert shorthand hex (#RGB) to full hex (#RRGGBB)
    if (hex.length === 3) {
        hex = hex
            .split('')
            .map(s => s + s)
            .join('');
    }

    // Parse the hex values for red, green, blue, and alpha (if present)
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return {r: r, g: g, b: b};
}

const hideTooltip = () => {
    const tooltip = document.querySelector('.tooltip[for=tile]');
    tooltip.style.display = "none";
    tooltip.dataset.for = null;
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
        });

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

const loadContextMenu_TILE = (event, tile) => {
    event.preventDefault();
    tile_contextMenu.querySelector('button[name=ignore]').onclick = () => {
        document.dispatchEvent(clickEvent);
        localStorage.setItem(`${tile.id}.IGNORE`, localStorage.getItem(`${tile.id}.IGNORE`) === "true" ? "false" : "true");
        tile.style.opacity = localStorage.getItem(`${tile.id}.IGNORE`) === "true" ? 0.2 : 1;
    }

    with (tile_contextMenu) {
        querySelector('button.title').innerText = tile.id;
        style.display = 'flex';
        style.left = event.pageX + 'px';
        style.top = event.pageY + 'px';
    }

    setTimeout(() => {
        tile_contextMenu.style.height = tile_contextMenu.scrollHeight + "px";
        tile_contextMenu.style.opacity = 1;
    }, 1);
}

const loadOverlay = (type) => {
    function loadOverlay_Printed() {
        document.querySelectorAll('.kiosk').forEach(tile => {
            
        });
    }
}

const mapNumberToHex = (number) => {
    // Define your number range
    let minValue = 0;
    let maxValue = 100;

    // Define gradient start and end colors
    let gradientStartColor = getCookie("gradient_start") ? Array.from(getCookie("gradient_start").split(",").map(item => Number(item))) : [255, 0, 0]; // Blue color
    let gradientEndColor = getCookie("gradient_end") ? Array.from(getCookie("gradient_end").split(",").map(item => Number(item))) : [0, 255, 0];    // Red color

    // Map the random number to the gradient
    let normalizedValue = (number - minValue) / (maxValue - minValue);
    //let position = normalizedValue * 100; // Gradient length is 100 (arbitrary value)

    // Interpolate between start and end colors based on the position
    let interpolatedColor = [];
    for (let i = 0; i < 3; i++) {
        interpolatedColor[i] = Math.round(gradientStartColor[i] + (gradientEndColor[i] - gradientStartColor[i]) * normalizedValue);
    }

    // Convert RGB values to hex format
    let colorHex = '#' + interpolatedColor.map(c => c.toString(16).padStart(2, '0')).join('');

    // Apply the color to the background of the element
    return colorHex;
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

const refreshGradient = () => {
    console.log(`linear-gradient(to right, rgb(${getCookie("gradient_start") || "255, 0, 0"}), rgb(${getCookie("gradient_end") || "0, 255, 0"}))`);

    let netValue, maxValue = 0, minValue = 1000000;
    for (let kioskName in kioskData) {
        netValue = kioskData[kioskName].end_value - kioskData[kioskName].start_value;
        kioskData[kioskName].net_value = netValue;

        if (netValue > maxValue) maxValue = netValue;
        if (netValue < minValue) minValue = netValue;
    }

    document.querySelectorAll('.kiosk').forEach(tile => {
        //console.log(kioskData[tile.id], maxNetCoupons, 100);
        if (kioskData[tile.id]) tile.style.backgroundColor = mapNumberToHex((kioskData[tile.id].net_value - minValue) / maxValue * 100);
        setTimeout(function() {
            tile.style.opacity = 1;
        }, Math.random() * 1000);
        tile.querySelector('tooltip tooltip-content').textContent = kioskData[tile.id].net_value;
    });
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

const showTooltip = (tile) => {
    const tooltip = document.querySelector('.tooltip[for=tile]');
    tooltip.querySelector('.tooltip-content').textContent = tile.dataset.netValue;
    tooltip.dataset.for = tile.id;
    tooltip.style.display = "block";
    tooltip.style.bottom = window.innerHeight - tile.offsetTop - 35 + "px";
    tooltip.style.left = tile.offsetLeft + tile.offsetWidth / 2 + "px";
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

const updateGradient = (input) => {
    const expirationDate = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);
    const rgb = hexToRgb(input.value);

    document.cookie = `${input.name}=${rgb.r},${rgb.g},${rgb.b}; expires=${expirationDate.toUTCString()}; path=/`;
    document.getElementById("hookT2S").style.background = `linear-gradient(to right, rgb(${getCookie("gradient_start") || "255, 0, 0"}), rgb(${getCookie("gradient_end") || "0, 255, 0"}))`;
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

const visualizeData = async () => {
    const response = await (await fetch('/database?query='+location.href.split("query=")[1])).json();
    data = response.data
    kioskData = {};

    for (let row of data) {
        if (kioskData[row.kiosk_name] === undefined) kioskData[row.kiosk_name] = {};
        kioskData[row.kiosk_name].start_value = row.start_value;
        kioskData[row.kiosk_name].end_value = row.end_value;
    }

    let netValue, maxValue = 0, minValue = 1000000;
    for (let kioskName in kioskData) {
        netValue = kioskData[kioskName].end_value - kioskData[kioskName].start_value;
        kioskData[kioskName].net_value = netValue > 0 ? netValue : kioskData[row.kiosk_name].end_value;

        if (netValue > maxValue) maxValue = netValue;
        if (netValue < minValue) minValue = netValue;
    }

    document.getElementById("min_data").innerText = minValue;
    document.getElementById("max_data").innerText = maxValue;

    document.querySelectorAll('.kiosk').forEach(tile => {
        //console.log(kioskData[tile.id], maxNetCoupons, 100);
        if (kioskData[tile.id]) {
            tile.dataset.netValue = kioskData[tile.id].net_value;
            tile.style.removeProperty("background");
            tile.style.backgroundColor = mapNumberToHex((kioskData[tile.id].net_value - minValue) / maxValue * 100);
            setTimeout(function() {
                tile.style.opacity = 1;
            }, Math.random() * 1000);
        } else {
            tile.style.background = "url(images/urgency_0.png)"
        }
    });
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

document.querySelectorAll('.container, .group, .location, .tooltip-content').forEach(element => element.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains("kiosk") || e.target.parentNode.classList.contains("kiosk")) return;
    hideTooltip()
}))

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