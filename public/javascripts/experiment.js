function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const delayTime = 10;

const config_data = JSON.parse(document.getElementById("data_storage").dataset.config_data);
const status_database = JSON.parse(document.getElementById("data_storage").dataset.status_database);

const loadGrid = async () => {
    document.getElementById("display").style.visibility = "visible"; // TEST
    // TEST <--
    for (let group of config_data.groups) {
        await delay(delayTime) // TEST
        const groupElement = document.createElement('div');
        document.getElementById("container").appendChild(groupElement); // TEST

        with (groupElement) {
            id = group.name;
            classList.add("group");
            appendChild(document.createElement('h1'));
            querySelector('h1').innerText = group.name;

            for (let location of group.locations) {
                await delay(delayTime) // TEST
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
    }

    for (let kioskIndex in status_database) {
        await delay(delayTime) // TEST
        if (status_database[kioskIndex].location !== ".undefined") {
            const div = document.createElement('div');
            div.classList.add("kiosk", "urgency_"+status_database[kioskIndex].urgency_level);
            try {document.getElementById(status_database[kioskIndex].location).appendChild(div);}
            catch (error) {}
        }
    }

    await updateLocations();

    document.getElementById("display").style.visibility = "visible";
}

const calculateSpan = async (element) => {
    const listWidth = element.parentNode.offsetWidth;
    const labelWidth = element.querySelector('h2').offsetWidth;
    const tileWidth = element.querySelector('div').offsetWidth + 4;
    const tiles = element.children.length - 1;

    const fitTiles = Math.round(labelWidth / tileWidth);
    element.querySelector('h2').style.gridColumn = "span "+fitTiles;

    const fitHeight = Math.ceil(tiles / (Math.floor(listWidth / tileWidth) - fitTiles))
    element.querySelector('h2').style.gridRow = "span "+fitHeight;
}

const updateLocations = async () => {
    console.log("heyo")
    document.querySelectorAll('.location').forEach(async element => {
        if (element.children.length === 1) {
            element.style.display = "none";
        } else {
            element.style.display = "grid";
            calculateSpan(element);
        }
    });
}


loadGrid();

addEventListener("resize", (event) => {updateLocations();});