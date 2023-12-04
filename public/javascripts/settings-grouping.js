let indices;

// Loading Options:
const loadHEAD = () => {
    indices = (window.location.pathname.replace(`${groupingURL}/`,"").split("/")).map(value => Number(value));

    if (document.head.dataset.page === undefined) {loadHOME()}
    if (document.head.dataset.page === "group") {loadGROUP()}
    if (document.head.dataset.page === "location") {loadLOCATION()}
    if (document.head.dataset.page === "selector") {loadSELECTOR()}
}

const loadHOME = () => {
    let selectorCount;

    for (let groupIndex in data.groups) {
        const group = data.groups[groupIndex]
        selectorCount = 0;

        for (let locationIndex in group.locations) {
            const problem = findProblem({type: "location", id: [groupIndex, locationIndex]})
            const chip = problem ? {text: problem.label} : null;

            const tile = createTile({title: group.locations[locationIndex].name, href: writeAccess ? null : `${groupingURL}/${groupIndex}/${locationIndex}`, description: `Included in ${group.name}\nIncludes ${group.locations[locationIndex].selectors.length} selectors`, toDelete: writeAccess}, chip);

            tile.addEventListener("click", (e) => {
                window.location.href = `${groupingURL}/${groupIndex}/${locationIndex}`;
            });

            if (writeAccess) {
                tile.addEventListener("contextmenu", (e) => {
                    loadContextMenu_TILE(e, tile,
                        () => {alert({title: `Remove <span class="t-stress">${group.locations[locationIndex].name}</span>?`, description: "Are you sure you want to remove this location?<br><span style='color: #A64141'>This action cannot be undone.</span>",
                            buttons: [{text: "Cancel", invert: 0.85, action: () => {window.location.reload()}}, {text: "Confirm", action: (event) => {submitDelete(`/config.json/groups/${indices[0]}/locations/${locationIndex}`)}}]
                        })}
                    );
                });
            }
            
            document.getElementById("locationGrid").appendChild(tile);
            selectorCount += group.locations[locationIndex].selectors.length;
        }

        const problem = findProblem({type: "group", id: groupIndex});
        const chip = problem ? {text: problem.label} : null;

        const groupTile = createTile({title: group.name, href: `${groupingURL}/${groupIndex}`, description: `Includes ${group.locations.length} locations\nIncludes ${selectorCount} selectors`}, chip);
        groupTile.addEventListener("contextmenu", (e) => {
            loadContextMenu_TILE(e, groupTile,
                () => {alert({title: `Remove <span class="t-stress">${group.name}</span>?`, description: "Are you sure you want to remove this group?<br><span style='color: #A64141'>This action cannot be undone.</span>",
                    buttons: [{text: "Cancel", invert: 0.85, action: () => {window.location.reload()}}, {text: "Confirm", action: (event) => {submitDelete(`/config.json/groups/${groupIndex}`)}}]
                })}
            );
        });
        document.getElementById("groupGrid").appendChild(groupTile);
    }

    /* Add Group: */
    if (false) {
        const addButton = createTile({title: null, href: null});
        addButton.classList.add("addButton");
        addButton.style.height = document.getElementById("groupGrid").querySelector('.gridTile').offsetHeight+"px";
        document.getElementById("groupGrid").appendChild(addButton);
    }
    /* ---------- */

    loadDeleteHover();
}

const loadGROUP = () => {
    const groupIndex = indices[0];
    const group = data.groups[groupIndex];

    document.getElementById("hrefBar").innerHTML = `\> <a href=/settings>Settings</a> / <a href=${groupingURL}>Grouping</a> / <a href=${groupingURL}/${groupIndex}>${group.name}</a>`;

    document.querySelectorAll('.locationImage').forEach(element => {
        element.style.display = "block";
        element.addEventListener("click", () => {element.querySelector('input').click()});
        element.querySelector('input').addEventListener("change", (event) => {uploadImageHandler(event, {location: location});});
        if (writeAccess) {element.querySelector('input').removeAttribute("disabled")};
    });

    let location;

    for (let locationIndex in group.locations) {
        location = group.locations[locationIndex];

        const problem = findProblem({type: "location", id: [groupIndex, locationIndex]});
        const chip = problem ? {text: problem.label} : null;
        const tile = createTile({title: location.name, href: writeAccess ? null : `${groupingURL}/${groupIndex}/${locationIndex}`, description: `Includes ${location.selectors.length} selectors`, toDelete: writeAccess}, chip);

        tile.addEventListener("click", (e) => {
            window.location.href = `${groupingURL}/${indices[0]}/${locationIndex}`;
        });

        if (writeAccess) {
            tile.addEventListener("contextmenu", (e) => {
                loadContextMenu_TILE(e, tile,
                    () => {alert({title: `Remove <span class="t-stress">${group.locations[locationIndex].name}</span>?`, description: "Are you sure you want to remove this location?<br><span style='color: #A64141'>This action cannot be undone.</span>",
                        buttons: [{text: "Cancel", invert: 0.85, action: () => {window.location.reload()}}, {text: "Confirm", action: (event) => {submitDelete(`/config.json/groups/${indices[0]}/locations/${locationIndex}`)}}]
                    })}
                )
            });
        }

        document.getElementById("locationGrid").appendChild(tile);
    }

    document.getElementById("locations").style.display = "block";

    loadDeleteHover();
}

const loadLOCATION = () => {
    const group = data.groups[indices[0]];
    const location = group.locations[indices[1]];

    document.getElementById("hrefBar").innerHTML = `\> <a href=/settings>Settings</a> / <a href=${groupingURL}>Grouping</a> / <a href=${groupingURL}/${indices[0]}>${group.name}</a> / <a href=${groupingURL}/${indices[0]}/${indices[1]}>${location.name}</a>`

    document.querySelectorAll('.locationImage').forEach(element => {
        element.style.display = "block";
        element.addEventListener("click", () => {element.querySelector('input').click()});
        element.querySelector('input').addEventListener("change", (event) => {uploadImageHandler(event, {location: location});});
        if (writeAccess) {element.querySelector('input').removeAttribute("disabled")};
    });

    for (let selectorIndex in location.selectors) {
        const problem = findProblem({type: "selector", id: [location.name, location.selectors[selectorIndex]]});
        const chip = problem ? {text: problem.label, toDelete: writeAccess} : null;
        const tile = createTile({title: location.selectors[selectorIndex], toDelete: writeAccess}, chip);

        if (writeAccess) {
            tile.addEventListener("click", (e) => {
                window.location.href = `${groupingURL}/${indices[0]}/${indices[1]}/${selectorIndex}`;
            });

            tile.addEventListener("contextmenu", (e) => {
                loadContextMenu_TILE(e, tile,
                    () => {alert({title: `Remove <span class="t-stress">${location.selectors[selectorIndex]}</span>?`, description: "Are you sure you want to remove this selector?<br><span style='color: #A64141'>This action cannot be undone.</span>",
                        buttons: [{text: "Cancel", invert: 0.85, action: () => {window.location.reload()}}, {text: "Confirm", action: (event) => {submitDelete(`/config.json/groups/${indices[0]}/locations/${indices[1]}/selectors/${selectorIndex}`)}}]
                    })}
                );
            });
        }

        document.getElementById("selectorGrid").appendChild(tile)
    }

    document.getElementById("selectors").style.display = "block";

    loadDeleteHover();
}

const loadSELECTOR = () => {
    const group = data.groups[indices[0]];
    const location = group.locations[indices[1]];
    const selector = location.selectors[indices[2]];

    document.getElementById("hrefBar").innerHTML = `\> <a href=/settings>Settings</a> / <a href=${groupingURL}>Grouping</a> / <a href=${groupingURL}/${indices[0]}>${group.name}</a> / <a href=${groupingURL}/${indices[0]}/${indices[1]}>${location.name}</a> / <a href=${groupingURL}/${indices[0]}/${indices[1]}/${indices[2]}>${selector}</a>`
}



// Functions:
const findProblem = (info) => {
    const {type, id} = info;
    let selectorArray1 = [], selectorArray2 = [], group;

    // Populate selectorArray1:
    if (type === "group") {
        group = data.groups[id];
        for (let locationIndex in group.locations) {
            selectorArray1.push(...group.locations[locationIndex].selectors.map(item => group.locations[locationIndex].name + ":|:" + item));
        }
    }
    if (type === "location") { selectorArray1.push(...data.groups[id[0]].locations[id[1]].selectors.map(item => data.groups[id[0]].locations[id[1]].name + ":|:" + item)) }
    if (type === "selector") { selectorArray1.push(id[0] + ":|:" + id[1]) }

    // Populate selectorArray2:
    for (let groupIndex in data.groups) {
        group = data.groups[groupIndex];

        for (let locationIndex in group.locations) {
            selectorArray2.push(...group.locations[locationIndex].selectors.map(item => group.locations[locationIndex].name + ":|:" + item));
        }
    }

    selectorArray1 = selectorArray1.map(item => item.replaceAll("_",""));
    selectorArray2 = selectorArray2.map(item => item.replaceAll("_",""));

    const selectorArray1Split = selectorArray1.map(item => item.split(":|:")[1]);
    const selectorArray2Split = selectorArray2.map(item => item.split(":|:")[1]);

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

const uploadImageHandler = async (event, data) => {
    const file = event.target.files[0],
        name = data.location.name + event.target.name;

    if (file) {
        const reader = new FileReader();

        reader.onload = (event2) => {
            event.target.parentNode.style.backgroundImage = `url(${event2.target.result})`;
        }
        reader.readAsDataURL(file);

        await uploadFile(file, name, '#'+event.target.parentNode.querySelector('.progressBlock').id);
        event.target.parentNode.querySelector('.progressBlock').style.width = "0px";

        const action = () => {
            document.body.querySelectorAll('nav, #display, #settingsInput').forEach(element => {
                element.style.removeProperty('filter');
            });
            
            document.getElementById("alertBox").style.removeProperty('opacity');
            setTimeout(() => {document.getElementById("alertBox").style.display = "none"}, 500);
        }

        alert({ title: "Success", description: `The banner of ${data.location.name} has been updated successfully.`, buttons: [{text: "OK", action}] })
    }
}