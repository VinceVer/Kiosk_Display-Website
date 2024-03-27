let indices;

// Loading Options:
const loadHEAD = () => {
    indices = (window.location.pathname.replace(`${statusURL}/`,"").split("/"));
    if (document.head.dataset.page === undefined) {loadHOME()}
    if (document.head.dataset.page === "type") {loadTYPE()}
    if (document.head.dataset.page === "code") {loadCODE()}
    if (document.head.dataset.page === "message") {loadMESSAGE()}
}

const loadHOME = () => {
    let codeCount, statusGroup, messageCount = 0;

    for (let statusType in data.status_messages) {
        statusGroup = data.status_messages[statusType];
        messageCount = 0;

        for (let statusCode in statusGroup.codes) {
            const chip = statusGroup.codes[statusCode].static ? {text: "Static", type: "data"} : null;

            document.getElementById("codeGrid").appendChild(createTile({title: `${statusGroup.name.replace(" Status","")} ${statusCode}`, href: statusGroup.codes[statusCode].static ? null : `${statusURL}/${statusType}/${statusCode}`,description: `Urgency Level: ${statusGroup.codes[statusCode].icon}\n` + (statusGroup.codes[statusCode].default ? `Includes ${statusGroup.codes[statusCode].messages.length} random messages\n` : "") + `Default message: ` + (statusGroup.codes[statusCode].default ? `"${statusGroup.codes[statusCode].default}"` : `"${statusGroup.codes[statusCode].messages[0]}"\n‎`)}, chip))

            messageCount += statusGroup.codes[statusCode].messages.length;
        }

        codeCount = statusGroup.codes ? Object.keys(statusGroup.codes).length : 0;
        document.getElementById("typeGrid").appendChild(createTile({title: statusGroup.name, href: `${statusURL}/${statusType}`, description: `Includes ${codeCount} status codes\nIncludes ${messageCount} random messages`}));
    }

    /* Add Type: */
    const addButton = createTile({title: null, href: statusURL+"/add"});
    addButton.classList.add("addButton");
    addButton.style.height = document.getElementById("typeGrid").querySelector('.gridTile').offsetHeight+"px";
    document.getElementById("typeGrid").appendChild(addButton);
    /* --------- */
}

const loadTYPE = () => {
    const statusType = window.location.pathname.replace(`${statusURL}/`,"");
    const statusGroup = data.status_messages[statusType];

    document.getElementById("hrefBar").innerHTML = `\> <a href=/settings>Settings</a> / <a href=${statusURL}>Status</a> / <a href=${statusURL}/${statusType}>${statusGroup.name.replace(" Status","")}</a>`

    let codeGroup;

    for (let statusCode in statusGroup.codes) {
        codeGroup = statusGroup.codes[statusCode];

        const chip = statusGroup.codes[statusCode].static ? {text: "Static", type: "data"} : null;
        const tile = createTile({title: `${statusGroup.name.replace(" Status","")} ${statusCode}`, toDelete: !statusGroup.codes[statusCode].static && writeAccess, description: `Urgency Level: ${statusGroup.codes[statusCode].icon}\n` + (statusGroup.codes[statusCode].default ? `Includes ${statusGroup.codes[statusCode].messages.length} random messages\n` : "") + `Default message: ` + (statusGroup.codes[statusCode].default ? `"${statusGroup.codes[statusCode].default}"` : `"${statusGroup.codes[statusCode].messages[0]}"\n‎`)}, chip)

        if (!statusGroup.codes[statusCode].static) {
            tile.addEventListener("click", (e) => {
                location.href = `${statusURL}/${statusType}/${statusCode}`;
            });

            if (writeAccess) {
                tile.addEventListener("contextmenu", (e) => {
                    loadContextMenu_TILE(e, tile,
                        () => {alert({title: `Remove <span class="t-stress">${statusGroup.name.replace(" Status","")} ${statusCode}</span>?`, description: "Are you sure you want to remove this status?<br><span style='color: #A64141'>This action cannot be undone.</span>",
                            buttons: [{text: "Cancel", invert: 0.85, action: () => {location.reload()}}, {text: "Confirm", action: (event) => {submitDelete(`/config.json/status_messages/${indices[0]}/codes/${statusCode}`)}}]
                        })}
                    )
                });
            }
        } else {
            tile.addEventListener("contextmenu", (e) => {e.preventDefault()});
        }

        document.getElementById("codeGrid").appendChild(tile);
    }

    document.getElementById("codes").style.display = "block";
    document.querySelector('#codes h2 .t-stress').innerText = statusGroup.name;

    document.querySelectorAll('.iconButtons input').forEach(input => {
        input.addEventListener("click", () => {
            input.parentNode.querySelectorAll('input').forEach(input2 => {input2.classList.remove("selected")});
            input.classList.add("selected");
            input.parentNode.parentNode.parentNode.querySelector('input[name=icon]').value = input.value;
            input.parentNode.parentNode.parentNode.querySelector('input[name=urgency_level]').value = input.dataset.urgency;
        });
    });

    loadDeleteHover();
}

const loadCODE = () => {
    const type = data.status_messages[indices[0]];
    const code = type.codes[indices[1]];

    if (code.static) {location.href = `${statusURL}/${indices[0]}`}

    document.getElementById("hrefBar").innerHTML = `\> <a href=/settings>Settings</a> / <a href=${statusURL}>Status</a> / <a href=${statusURL}/${indices[0]}>${type.name.replace(" Status","")}</a> / <a href=${statusURL}/${indices[0]}/${indices[1]}>${indices[1]}</a>`;

    for (let messageIndex in code.messages) {
        const chip = code.static ? {text: "Static", type: "data"} : null;
        const tile = createTile({title: code.messages[messageIndex], toDelete: !code.static && writeAccess}, chip);

        if (!code.static && writeAccess) {
            tile.addEventListener("click", (e) => {
                location.href = `${statusURL}/${indices[0]}/${indices[1]}/${messageIndex}`;
            });

            tile.addEventListener("contextmenu", (e) => {
                loadContextMenu_TILE(e, tile,
                    () => {alert({title: `Remove <span class="t-stress">${code.messages[messageIndex]}</span>?`, description: "Are you sure you want to remove this message?<br><span style='color: #A64141'>This action cannot be undone.</span>",
                        buttons: [{text: "Cancel", invert: 0.85, action: () => {location.reload()}}, {text: "Confirm", action: (event) => {submitDelete(`/config.json/status_messages/${indices[0]}/codes/${indices[1]}/messages/${messageIndex}`)}}]
                    })}
                );
            });
        }
        
        document.getElementById("messageGrid").appendChild(tile);
    }

    document.getElementById("messages").style.display = "block";
    document.querySelector('#messages h2 .t-stress').innerText = `${code.icon} ${type.name} ${indices[1]}`;

    document.querySelectorAll('.iconButtons input').forEach(input => {
        input.addEventListener("click", () => {
            input.parentNode.querySelectorAll('input').forEach(input2 => {input2.classList.remove("selected")});
            input.classList.add("selected");
            input.parentNode.parentNode.parentNode.querySelector('input[name=icon]').value = input.value;
            input.parentNode.parentNode.parentNode.querySelector('input[name=urgency_level]').value = input.dataset.urgency;
        });
    });

    loadDeleteHover();
}

const loadMESSAGE = () => {
    const type = data.status_messages[indices[0]];
    const code = type.codes[indices[1]];
    const message = code.messages[indices[2]];

    document.getElementById("hrefBar").innerHTML = `\> <a href=/settings>Settings</a> / <a href=${statusURL}>Status</a> / <a href=${statusURL}/${indices[0]}>${type.name.replace(" Status","")}</a> / <a href=${statusURL}/${indices[0]}/${indices[1]}>${indices[1]}</a> / <a href=${statusURL}/${indices[0]}/${indices[1]}/${indices[2]}>${message}</a>`;
}