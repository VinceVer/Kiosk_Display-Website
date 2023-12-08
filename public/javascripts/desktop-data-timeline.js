const config_data = JSON.parse(document.getElementById("data_storage").dataset.config_data);
let status_database = JSON.parse(document.getElementById("data_storage").dataset.status_database);
let misc_data = JSON.parse(document.getElementById("data_storage").dataset.misc_data);
//const dataBar = document.getElementById("dataBar");
let timeline_data, grouped_data = {};
const maxRange = 86400;

const loadGrid = async () => {
    const currentTime = new Date();
    const endTime = Math.floor(currentTime.getTime() / 1000);
    currentTime.setHours(0, 0, 0, 0);
    const startTime = Math.floor(currentTime.getTime() / 1000);

    timeline_data = (await (await fetch(`http://85.148.75.164:9000/database?query=SELECT time, kiosk_name, from_urgency_level, to_urgency_level FROM kiosktimeline WHERE time BETWEEN ${startTime} AND ${endTime} ORDER BY kiosk_name, time DESC`)).json()).data;
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
                history.pushState(null, null, `/desktop/g/${group.name}`);
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
                history.pushState(null, null, `/desktop/k/${kioskIndex}`);
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
    document.body.style.backgroundImage = `url(/images/${background_file})`;
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

const updateGrid = (time) => {
    const unixTimestamp = time + (new Date().setHours(0, 0, 0, 0) / 1000);
    const currentTime = Math.floor((new Date).getTime() / 1000)

    let currentUrgency, group;
    for (let kioskName in grouped_data) {
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

document.getElementById("time_slider").addEventListener('input', (e) => {
    updateGrid(Number(e.target.value));
});