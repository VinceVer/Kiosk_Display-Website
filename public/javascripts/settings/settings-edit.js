const type = document.head.dataset.type;

const getAlertInfo = (type, value) => {
    switch(type) {
        case "app":
            return {title: "Success", description: `${document.head.dataset.name} has successfully been renamed to ${value}.`, buttons: [{text: "OK", action: () => {location.href = "/settings/apps"}}] }
        case "s_type_add":
            return {title: "Success", description: `${document.getElementById("statusType").value} has successfully been added.`, buttons: [{text: "OK", action: () => {location.href = "/settings/status"}}] }
    }
}

const loadHEAD = () => {
    if (!writeAccess) {return location.href = "/settings"}
    switch(type) {
        case "app":
            const appName = location.pathname.split("/").slice(-1)[0]

            document.querySelector('#result h3').innerText = appName.split("-")[0];
            document.querySelector('#result p').innerText = `Full name: ${appName}\nDisplay name: `+(data.applications[appName] === "undefined" ? "" : data.applications[appName]);
            document.querySelector('#renameApp input[type=text]').value = (data.applications[appName] === "undefined" ? "" : data.applications[appName]);
            document.querySelector('#renameApp input[type=text]').addEventListener("input", event => {
                document.querySelector('#result p').innerText = `Full name: ${appName}\nDisplay name: `+event.target.value;
            });
            break;
        case "s_type_add":
            addAutocompleteS_Type();
            document.querySelector('#result p').innerText = "Includes 0 status codes\nIncludes 0 random messages";
            document.getElementById('statusTypeInput').addEventListener("input", event => {
                document.getElementById('statusType').value = event.target.value;
                if (!document.getElementById('typeNameInput').value) {document.querySelector('#result h3').innerText = event.target.value};
            });
            document.getElementById('typeNameInput').addEventListener("input", event => {
                document.querySelector('#result h3').innerText = event.target.value ? event.target.value : document.getElementById('statusTypeInput').value;
            });
            document.getElementById('statusTypeInput').dispatchEvent(new Event('input', { bubbles: true }));
            break;
    }
}

const addAutocompleteS_Type = () => {
    const inputField = document.getElementById("statusTypeInput");
    const autocompleteList = document.getElementById("statusTypeInputACList");

    const tableOptions = [];
    for (let key in data.table_naming) {
        if (key.includes("status") || key.includes("connection")) {
            tableOptions.push(key.split('_').map(segment => segment.charAt(0).toUpperCase() + segment.slice(1)).join(" "));
        }
    }

    inputField.addEventListener("input", (e) => {
        autocompleteList.innerHTML = "";

        const value = inputField.value.toLowerCase();
        const wordOptions = tableOptions.filter(option => option.toLowerCase().includes(value));

        // Add the filtered options to the list
        wordOptions.forEach(option => {
            const optionItem = document.createElement("div");
            
            const startIndex = option.toLowerCase().indexOf(value.toLowerCase());
            const endIndex = startIndex + value.length;

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
                inputField.value = e.target.innerText;
                //closeAllLists();
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
            });

            document.getElementById("statusTypeInputACList").appendChild(optionItem);
        });
    });

    setupAutoComplete(inputField);
}