const tableOptions = ["AND", "INCLUDES", "UNLESS", "NOT", "OR", "<", ">", "!=", "="];
let inputField, hrefType, hrefIndex;
const conditionsField = document.getElementById("conditions");
const selectField = document.getElementById("add_toIgnore");
const statusDatabase = JSON.parse(document.getElementById("data_storage").dataset.status_database);

const loadHEAD = async () => {
    try {
        document.getElementById("conditionInputCode").style.top = document.getElementById("conditionInputCode").offsetTop-10+"px";
        document.getElementById("conditionInputCode").style.width = document.querySelector('form').offsetWidth-20+"px";
    } catch (err) {}

    if (location.href.split("/").slice(-1)[0] !== "filters") {
        if (!writeAccess) {location.href = "/settings/database/conditions"}
        loadInputForm();
        return;
    }

    const urgency_conditions = data.urgency_conditions;
    let condition, grid, header, rules, title;

    /* Database Filter. */
    for (let conditionIndex in data.misc_conditions) {
        rules = convertJsToCard(data.misc_conditions[conditionIndex]);
        
        title = conditionIndex.split("$")[0].split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

        const tile = createTile({title: title, description: ``, href: writeAccess ? `/settings/database/conditions?type=misc&index=${conditionIndex}` : null}, {text: conditionIndex.split("$")[1], type: "data"});
        tile.querySelector('p').innerHTML = `Rules:<br><br>${rules}`;
        tile.querySelector('p').style.fontSize = "1rem";

        document.getElementById("GridEmail").appendChild(tile);
    }
    /* ---------------- */

    /* Ignored Apps. */
    for (let itemIndex in data.ignored_apps) {
        const tile = createTile({title: data.ignored_apps[itemIndex], description: ``, href: null}, {text: data.ignored_apps[itemIndex].length === 3 ? "Device" : "Application", type: "data"});
        if (writeAccess) {
            tile.addEventListener('contextmenu', function(e) {
                loadContextMenu_TILE(e, tile,
                    () => {alert({title: `Remove <span class="t-stress">${data.ignored_apps[itemIndex]}</span>?`, description: `Are you sure you want to remove this ${data.ignored_apps[itemIndex].length === 3 ? "Device" : "Application"} from the ignored list?`,
                        buttons: [{text: "Cancel", invert: 0.85, action: () => {window.location.reload()}}, {text: "Confirm", action: (event) => {submitDelete(`/config.json/ignored_apps/${itemIndex}`)}}]
                    })}
                );
            });
        }
        document.getElementById("GridIgnored").appendChild(tile);
    }

    let foundItems = {
        device_types: [],
        applications: []
    };
    let kiosk;

    for (let kioskName in statusDatabase) {
        kiosk = statusDatabase[kioskName];
        
        for (let deviceName in kiosk.devices) {
            if (!foundItems.device_types.includes(deviceName.split(/[0-9.]/)[0])) foundItems.device_types.push(deviceName.split(/[0-9.]/)[0]);
        }
        for (let appName in kiosk.applications) {
            if (!foundItems.applications.includes(appName)) foundItems.applications.push(appName);
        }
    }

    foundItems.device_types = foundItems.device_types.sort((a, b) => b - a);
    foundItems.applications = foundItems.applications.sort((a, b) => b - a);

    for (let item of foundItems.device_types) {
        const option = document.createElement('option');
        option.value = item;
        option.innerText = item;
        selectField.querySelector('optgroup[name=devices]').appendChild(option);
    }
    for (let item of foundItems.applications) {
        const option = document.createElement('option');
        option.value = item;
        option.innerText = item;
        selectField.querySelector('optgroup[name=apps]').appendChild(option);
    }

    /* ---------------- */

    loadDeleteHover();
}

const checkAppliesTo = () => {
    const input = document.getElementById("applyInput");
    const list = document.getElementById("applies_toList");
    let chipText = "";

    input.value = input.value.replace(/[<>]/,"").toUpperCase();

    if (input.value.includes(" ") || input.value.includes(",")) {
        if (list.innerHTML.includes(">ALL<")) {
            list.innerHTML = `<button class="gridTile small" onclick="removeAppliesTo(this)" type="button">${input.value.replace(/[ ,]/,"")}</button>`
        } else {
            list.innerHTML += `<button class="gridTile small" onclick="removeAppliesTo(this)" type="button">${input.value.replace(/[ ,]/,"")}</button>`
        }
        input.value = "";
        
        list.querySelectorAll('button').forEach(item => {chipText += item.innerText + ", "})
        document.querySelector('#result .chip-data').innerText = chipText.slice(0, -2);
    }
}

const loadInputForm = () => {
    inputField = document.getElementById("conditionInput");
    hrefType = location.href.split("?")[1].split("&")[0].split("=")[1];

    if (!location.href.includes("/conditions/add?") && hrefType !== "misc") {
        hrefIndex = location.href.split("?")[1].split("&")[1].split("=")[1];
        const conditionObject = data.urgency_conditions[hrefType].inputs[hrefIndex];

        document.getElementById("nameInput").value = conditionObject.name;
        for (let type of conditionObject.applies_to) {
            document.getElementById("applyInput").value = (type === "*" ? "ALL" : type) + ",";
            checkAppliesTo();
        }
        document.getElementById("conditionInput").value = convertJsToInput(conditionObject.condition)

        updateCodeBar();
    } else if (hrefType === "misc") {
        hrefIndex = location.href.split("?")[1].split("&")[1].split("=")[1];
        const condition = data.misc_conditions[location.href.split("?")[1].split("&")[1].split("=")[1]];
        document.getElementById("nameInput").value = location.href.split("?")[1].split("&")[1].split("=")[1].split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        document.getElementById("applyInput").value = "ALL,";
        document.getElementById("conditionInput").value = convertJsToInput(condition);

        checkAppliesTo();
        updateCodeBar();
    }

    for (let key in data.table_naming) {
        tableOptions.push(key.split('_').map(segment => segment.charAt(0).toUpperCase() + segment.slice(1)).join('_'))
    }

    const autocompleteList = document.getElementById("conditionInputACList");

    /* Autocomplete. */
    inputField.addEventListener("input", (e) => {
        // Clear the previous autocomplete list
        autocompleteList.innerHTML = "";

        // Split the input value into words
        const words = inputField.value.split(" ");
        const word = words[words.length-1];

        if (!word) {return}

        // Filter the autocomplete options based on the current word
        const wordOptions = tableOptions.filter(option => option.toLowerCase().includes(word.replace(/[()]/, "").toLowerCase()));

        // Add the filtered options to the list
        wordOptions.forEach(option => {
            const optionItem = document.createElement("div");
            
            const startIndex = option.toLowerCase().indexOf(word.replace(/[()]/, "").toLowerCase());
            const endIndex = startIndex + word.replace(/[()]/, "").length;

            // Split the option into three parts: before, matched, and after
            const before = option.substring(0, startIndex);
            const matched = option.substring(startIndex, endIndex);
            const after = option.substring(endIndex);

            optionItem.innerHTML = `${before}<span class="highlighted">${matched}</span>${after}`;
            optionItem.classList.add("autocomplete-option");

            optionItem.addEventListener("click", (e) => {
                const val = inputField.value.split(" ");
                if (val[val.length-1].startsWith("(") || val[val.length-1].startsWith(")")) {e.target.innerText = val[val.length-1][0] + e.target.innerText};
                val.pop()
                inputField.value = val.join(" ") + (val.length > 0 ? " " : "") + e.target.innerText + " ";
                //closeAllLists();
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
            });

            autocompleteList.appendChild(optionItem);
        });

        updateCodeBar();
    });
    /* ------------- */
    
    setupAutoComplete(inputField);

    /* Applies_to Handler. */
    document.getElementById("applyInput").addEventListener("keydown", async (e) => {
        if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault()
            e.target.value += ",";
            checkAppliesTo();
        }
    });
    /* ------------------- */
}

const removeAppliesTo = (element) => {
    const list = document.getElementById("applies_toList");
    let chipText = "";
    element.remove();

    if (list.children.length === 0) {
        list.innerHTML = '<button class="gridTile small" type="button">ALL</button>'
    }

    list.querySelectorAll('button').forEach(item => {chipText += item.innerText + ", "})
    document.querySelector('#result .chip-data').innerText = chipText.slice(0, -2);
}

const sendRequest = (url, value, alertInfo, reload) => {
    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json', // Set the content type to form data
        },
        body: JSON.stringify(value)
    })
    .then(response => response.json())
    .then(data => {
        if (alertInfo) {
            alert(alertInfo)
        } else {
            if (reload) location.reload();
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

const submitIgnoredApp = (e) => {
    e.preventDefault();
    const type = selectField.value;

    alert({title: `Ignore <span style='color: var(--text-color2)'>${type}</span>?`, description: `Are you sure you want to ignore <span style='color: var(--text-color2)'>${type}</span>?<br><span style='color: var(--text-color2)'>This will also set ${type} to online for all kiosks.</span>`,
        buttons: [
            {text: "Cancel", invert: 0.85, action: () => {location.reload()}},
            {text: "Confirm", action: (event) => {
                for (let kioskName in statusDatabase) {
                    for (let deviceName in statusDatabase[kioskName].devices) {
                        if (deviceName.split(/[0-9.]/)[0] === type) {
                            sendRequest(`/update/queue.json/${deviceName+"."+kioskName}`, {value: "IGNORE"});
                        }
                    }
                    for (let appType in statusDatabase[kioskName].applications) {
                        if (appType.split(".")[0] === type) {
                            sendRequest(`/update/queue.json/${appType+"."+kioskName}`, {value: "IGNORE"});
                        }
                    }
                }
                sendRequest(`/update/config.json/ignored_apps/${data.ignored_apps.length}`, {value: type}, null, true);
            }}
        ]
    });
  }

const updateCodeBar = () => {
    const inputValue = inputField.value;

    const colors = ['#f0c707', '#c56dcd', '#1899fe']; // Define the colors to cycle through
    let outputString = ''; // Initialize the output string
    let colorIndex = 0; // Initialize the color index

    for (let i = 0; i < inputValue.length; i++) {
        switch (inputValue[i]) {
            case '(':
                outputString += `<span style="color: ${colors[colorIndex]}">(</span>`;
                colorIndex = (colorIndex + 1) % colors.length; // Cycle through colors
                break;
            case ')':
                colorIndex = (colorIndex + 2) % colors.length; // Cycle through colors
                outputString += `<span style="color: ${colors[colorIndex]}">)</span>`;
                break;
            default:
                outputString += inputValue[i];
                break;
        }
    }

    outputString = convertInputToCard(outputString);

    document.querySelector('#result h3').innerText = document.getElementById("nameInput").value.split("$")[0];
    document.querySelector("#result p").innerHTML = outputString;

    const condition = valueToCondition(inputValue);
    console.log(condition)
    try {
        const conditionFunction = new Function('return ' + condition.replace(/data\[[^\]]*\]/g, "String(true)"));
        const result = conditionFunction();
    } catch (error) {
        document.querySelector("#result p").innerHTML += `<br><span style="color: var(--alert-color)">${error}</span>`;
    }
}

const uploadConditionData = (event, form, alertInfo) => {
    event.preventDefault();

    const formData = new FormData(form);

    const conditionType = hrefType;
    if (!conditionType) {return console.error("Undefined Error")}
    const ruleIndex = hrefIndex || data.urgency_conditions[conditionType].inputs.length;

    const applies_to = [];
    const condition = valueToCondition(formData.get("condition"));
    
    let validated = false;

    try {
        const conditionFunction = new Function('return ' + condition.replace(/data\[[^\]]*\]/g, "String(true)"));
        const result = conditionFunction();
        validated = true;
        console.log("No errors found");
    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error('Caught a SyntaxError:', error.message);
        } else if (error instanceof TypeError) {
            console.error('Caught a TypeError:', error.message);
        } else {
            console.error('Caught an error of another type:', error.message);
        }
        validated = false;
    }

    if (!validated) {return;}

    for (let item of document.querySelectorAll("#applies_toList button")) {
        applies_to.push(item.innerText);
    }
    
    let putData, url;
    if (hrefType === "misc") {
        putData = {
            value: condition
        }
        url = `/update/config.json/misc_conditions/${hrefIndex}`;
    } else {
        putData = {
            key: localStorage.getItem("config_key"),
            applies_to: applies_to,
            condition: condition,
            name: formData.get("name")
        }
        url = `/update/config.json/urgency_conditions/${conditionType}/inputs/${ruleIndex}`;
    }

    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json', // Set the content type to form data
        },
        body: JSON.stringify(putData)
    })
    .then(response => response.json())
    .then(data => {
        alert(alertInfo)
        console.log(data);
    })
    .catch(error => {
        // Handle errors here
        console.error('Error:', error);
    });
}