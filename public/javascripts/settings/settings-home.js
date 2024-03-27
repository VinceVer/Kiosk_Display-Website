const layoutCards = {
    background_opacity: {
        display_name: "Background",
        suffix: "%"
    },
    tile_size: {
        display_name: "Tile Size",
        suffix: "px"
    },
    show_labels: {
        display_name: "Show Labels",
    },
    align_labels: {
        display_name: "Align Labels",
    }
}

// Loading Options:
const loadHEAD = async () => {
    loadGROUPING();
    loadAPPS();
    loadS_MESSAGES();
}

const loadGROUPING = () => {
    let group, selectorCount;

    for (let groupIndex in data.groups) {
        group = data.groups[groupIndex]
        selectorCount = 0;

        for (let locationIndex in group.locations) {
            selectorCount += group.locations[locationIndex].selectors.length;
        }

        const problem = findProblem({type: "group", id: groupIndex})
        const chip = problem ? {text: problem.label} : null;

        document.getElementById("groupGrid").appendChild(createTile({title: group.name, href: `${groupingURL}/${groupIndex}`, description: `Includes ${group.locations.length} locations\nIncludes ${selectorCount} selectors`}, chip))
    }

    const bar = createTile({title: "Complete Overview", href: groupingURL});
    bar.querySelector('div').style.display = "block";
    bar.querySelector('div').style.marginBottom = "-5px";

    let barWidth = -10;
    document.querySelectorAll('#groupGrid button').forEach(element => {
        barWidth += element.offsetWidth + 10;
    });
    with (bar.style) {
        display = "block";
        padding = "0 20px 0 20px";
        textAlign = "center";
        width = barWidth+"px";
    }
    document.getElementById("groupGrid").appendChild(bar)
}

const loadAPPS = () => {
    const href =  writeAccess ? appURL : null;

    for (let app in data.applications) {
        document.getElementById("appGrid").appendChild(createTile({title: app.split("-")[0], href: href ? `${href}/${app}` : null, description: `Full name: ${app}\n`+ (data.applications[app] !== "undefined" ? `Display name: ${data.applications[app]}` : "‎")}));
    }
}

const loadS_MESSAGES = () => {
    const href =  statusURL;
    let codeCount, statusGroup, messageCount = 0;

    for (let statusType in data.status_messages) {
        statusGroup = data.status_messages[statusType];
        messageCount = 0;

        for (let statusCode in statusGroup.codes) {messageCount += statusGroup.codes[statusCode].messages.length}
        codeCount = statusGroup.codes ? Object.keys(statusGroup.codes).length : 0;

        document.getElementById("statusGrid").appendChild(createTile({title: statusGroup.name, href: `${statusURL}/${statusType}`, description: `Includes ${codeCount} status codes\nIncludes ${messageCount} random messages`}));
    }

    const bar = createTile({title: "Complete Overview", href: statusURL});
    bar.querySelector('div').style.display = "block";
    bar.querySelector('div').style.marginBottom = "-5px";

    let barWidth = -10;
    document.querySelectorAll('#statusGrid button').forEach(element => {
        barWidth += element.offsetWidth + 10;
    });
    with (bar.style) {
        display = "block";
        padding = "0 20px 0 20px";
        textAlign = "center";
        width = barWidth+"px";
    }
    document.getElementById("statusGrid").appendChild(bar)
}

// Functions:
const findProblem = (info) => {
    const {type, id} = info;
    let selectorArray1 = [], selectorArray2 = [], group;

    // Populate selectorArray1:
    if (type === "group") {
        group = data.groups[id];
        for (let locationIndex in group.locations) {
            selectorArray1.push(...group.locations[locationIndex].selectors.map(item => group.locations[locationIndex].name + ":|:" + item))
        }
    }
    if (type === "location") { selectorArray1.push(...data.groups[id[0]].locations[id[1]].selectors.map(item => data.groups[id[0]].locations[id[1]].name + ":|:" + item)) }
    if (type === "selector") { selectorArray1.push(id[0] + ":|:" + id[1]) }

    // Populate selectorArray2:
    for (let groupIndex in data.groups) {
        group = data.groups[groupIndex];

        for (let locationIndex in group.locations) {
            selectorArray2.push(...group.locations[locationIndex].selectors.map(item => group.locations[locationIndex].name + ":|:" + item))
        }
    }

    selectorArray1 = selectorArray1.map(item => item.replaceAll("_",""))
    selectorArray2 = selectorArray2.map(item => item.replaceAll("_",""))

    const selectorArray1Split = selectorArray1.map(item => item.split(":|:")[1])
    const selectorArray2Split = selectorArray2.map(item => item.split(":|:")[1])

    // Compare selectorArray1 and selectorArray2:
    for (let i in selectorArray1) {
        for (let j in selectorArray2) {
            if (
                (selectorArray1Split[i].includes(selectorArray2Split[j]) || selectorArray2Split[j].includes(selectorArray1Split[i]))
                && selectorArray1[i] !== selectorArray2[j]
            ) {
                console.warn(selectorArray1[i] +" overlaps with "+ selectorArray2[j])
                return {label: "Overlap"}
            }
        }
    }

    return null;
}

const valueToChip = (property, value) => {
    if (value === true) {return "Enabled";}
    if (value === false) {return "Disabled";}
    if (typeof value === "number") {return String(value)+ layoutCards[property].suffix;}
}