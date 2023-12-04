const tableOptions = ["AND", "INCLUDES", "UNLESS", "NOT", "OR", "<", ">", "!=", "="];
let inputField, hrefType, hrefIndex;
const conditionsField = document.getElementById("conditions");

const loadHEAD = async () => {
    try {
        document.getElementById("conditionInputCode").style.top = document.getElementById("conditionInputCode").offsetTop-10+"px";
        document.getElementById("conditionInputCode").style.width = document.querySelector('form').offsetWidth-20+"px";
    } catch (err) {}

    if (location.href.split("/").slice(-1)[0] !== "conditions") {
        if (!writeAccess) {location.href = "/settings/database/conditions"}
        loadInputForm();
        return;
    }

    const urgency_conditions = data.urgency_conditions;
    let condition, grid, header, rules, title;

    const keys = Object.keys(urgency_conditions);
    keys.reverse();

    for (let urgency of keys) {
        /* Add Header. */
        header = document.createElement('h2');
        header.classList.add("header");
        header.innerText = urgency_conditions[urgency].text + " conditions:";
        conditionsField.appendChild(header);
        /* ----------- */

        /* Add Grid. */
        grid = document.createElement('div');
        grid.id = "Grid"+urgency;
        grid.classList.add("cardView");

        for (let conditionIndex in urgency_conditions[urgency].inputs) {
            condition = urgency_conditions[urgency].inputs[conditionIndex];

            rules = convertJsToCard(condition.condition);

            const tile = createTile({title: condition.name, description: ``, href: null, toDelete: writeAccess}, {text: condition.applies_to.join(", ").replace("*", "ALL"), type: "data"});
            tile.querySelector('p').innerHTML = `Rules:<br><br>${rules}`;
            tile.querySelector('p').style.fontSize = "1rem";

            if (writeAccess) {
                tile.addEventListener("click", (e) => {
                    if (tile.classList.contains("delete")) {
                        alert({title: `Remove <span class="t-stress">${condition.name}</span>?`, description: "Are you sure you want to remove this condition?<br><span style='color: #A64141'>This action cannot be undone.</span>",
                            buttons: [{text: "Cancel", invert: 0.85, action: () => {window.location.reload()}}, {text: "Confirm", action: (event) => {submitDelete(`/config.json/urgency_conditions/${urgency}/inputs/${conditionIndex}`)}}]
                        });
                    } else {
                        window.location.href = `/settings/database/conditions?type=${urgency}&index=${conditionIndex}`;
                    }
                });
            }

            grid.appendChild(tile);
        }

        conditionsField.appendChild(grid);
        /* --------- */

        /* Add Condition: */
        if (writeAccess) {
            const addButton = createTile({title: null, href: databaseURL+"/conditions/add?type="+urgency});
            addButton.classList.add("addButton");
            addButton.style.height = grid.querySelectorAll('.gridTile').length > 0 ? grid.querySelectorAll('.gridTile')[grid.querySelectorAll('.gridTile').length - 1].offsetHeight+"px" : "3rem";
            grid.appendChild(addButton);
        }
        /* -------------- */
    }

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

const updateCodeBar = () => {
    const inputValue = inputField.value;

    const colors = ['#f0c707', '#c56dcd', '#1899fe']; // Define the colors to cycle through
    let outputString = ''; // Initialize the output string
    let colorIndex = 0; // Initialize the color index

    // for (let i = 0; i < inputValue.length; i++) {
    //     switch (inputValue[i]) {
    //         case '(':
    //             outputString += `<span style="color: ${colors[colorIndex]}">(</span>`;
    //             colorIndex = (colorIndex + 1) % colors.length; // Cycle through colors
    //             break;
    //         case ')':
    //             colorIndex = (colorIndex + 2) % colors.length; // Cycle through colors
    //             outputString += `<span style="color: ${colors[colorIndex]}">)</span>`;
    //             break;
    //         default:
    //             outputString += inputValue[i];
    //             break;
    //     }
    // }

    outputString = convertInputToCard(inputValue);

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