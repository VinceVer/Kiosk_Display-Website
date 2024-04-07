const port = document.getElementById("data_storage").dataset.port;
const base = location.href.split("/")[0]+":"+port;

const groupingURL = base+"/settings/grouping",
    layoutURL = base+"/settings/layout",
    appURL = base+"/settings/apps",
    statusURL = base+"/settings/status",
    schedulesURL = base+"/settings/schedules"
    databaseURL = base+"/settings/database";
let response, writeAccess;
const tile_contextMenu = document.getElementById("tile_CM");

const clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window
});

const alert = (info) => {
    console.log(info)
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

const createTile = (info, chip) => {
    const {title = null, href = null, description = null, toDelete = null} = info;
    
    const tile = document.getElementById("gridTile").cloneNode(true);

    tile.querySelector('h3').innerText = title;
    tile.querySelector('p').innerText = description ? description : null;
    if (href) {tile.addEventListener("click", () => {location.href = href})}
    //tile.style.display = "inline-block"

    if (chip) {
        tile.querySelector('.chip').innerText = chip.text;
        tile.querySelector('.chip').style.display = "block";
        tile.querySelector('.chip').classList.add(chip.type ? "chip-"+chip.type : "chip-error")
    } else {
        tile.querySelector('.chip').style.display = "none";
    }

    if (toDelete) {tile.classList.add("toDelete")}

    tile.removeAttribute("id");

    return tile;
}

const load = async () => {
    try{data = JSON.parse(document.getElementById("data_storage").dataset.config_data);} catch (error) {console.warn(error)}
    writeAccess = document.getElementById("data_storage").dataset.write === "true" ? true : false;
    console.log(writeAccess)

    try {loadHEAD();} catch (error) {console.warn(error)}

    document.querySelectorAll('.hideOnLoad').forEach(element => {element.style.visibility = "visible"});

    document.querySelector('#syncType.chip-data').innerText = writeAccess ? "Read and Write" : "Read Only";

    //try {loadHEAD2();} catch (error) {console.warn(error)}

    if (document.getElementById("login")) {
        if (writeAccess) { // Show: Log out
            document.getElementById("logout").style.display = "flex";
        } else { // Show: Log in
            document.getElementById("login").style.display = "flex";
            document.querySelectorAll(".navLink.block").forEach(link => link.removeAttribute("href"));
        }
    }

    //console.info("Found data:", data);
}

const loadContextMenu_TILE = (event, tile, deleteFunction) => {
    event.preventDefault();
    tile_contextMenu.querySelector('button[name=open]').onclick = () => {
        tile.dispatchEvent(clickEvent);
        document.dispatchEvent(clickEvent);
    }

    tile_contextMenu.querySelector('button[name=remove]').onclick = () => {
        document.dispatchEvent(clickEvent);
        deleteFunction();
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

/*
const loadDeleteHover = () => {
    document.addEventListener("keydown", function (e) {
        if (e.key === "Control" || e.key === "ControlLeft" || e.key === "ControlRight") {
            document.querySelectorAll('.toDelete').forEach(element => {
                element.classList.add("delete")
            });
        }
    });

    document.addEventListener("keyup", function (e) {
        document.querySelectorAll('.toDelete').forEach(element => {
            element.classList.remove("delete")
        });
    });
}
*/

const setupAutoComplete = (field) => {
    const inputField = field;
    const inputFieldName = field.id;
    let currentFocus = -1;

    /* Move Selection. */
    inputField.addEventListener("keydown", (e) => {
        var x = document.getElementById(inputFieldName+"ACList");
        if (x) x = x.querySelectorAll(".autocomplete-option");

        switch (e.key) {
            case "Down":
            case "ArrowDown":
                currentFocus++;
                addActive(x);
                break;
            case "Up":
            case "ArrowUp":
                currentFocus--;
                addActive(x);
                break;
            case "Enter":
            case "Tab":
                e.preventDefault();
                if (currentFocus > -1) {
                    if (x) x[currentFocus].click();
                }
                break;
            case "Left":
            case "ArrowLeft":
            case "Right":
            case "ArrowRight":
                break;
            default:
                currentFocus = -1;
                break;
        }
    });
    /* --------------- */

    /* Functions. */
    const addActive = (x) => {
        if (!x) return false;

        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);

        x[currentFocus].classList.add("autocomplete-active");
    }

    const removeActive = (x) => {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    const closeAllLists = () => {
        currentFocus = -1;
        document.getElementById(inputFieldName+"ACList").innerHTML = "";
    }
    /* ---------- */

    /* Close. */
    document.addEventListener("click", (e) => {
        try {updateCodeBar();} catch {}
        try {
            if (document.getElementById("applyInput").value) {
                document.getElementById("applyInput").value += ",";
                checkAppliesTo();
            }
        } catch {}

        closeAllLists();
    });
    /* ------ */
}

const submitDelete = (url, alertInfo) => {
    fetch(base+url, {method: 'DELETE'})
    .then(response => response.json())
    .then(data => {
        alertInfo ? alert(alertInfo) : location.reload();
        
    })
    .catch(error => {
        console.error('Error:', error);
    });
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
                    putData[key] = isNaN(Number(value)) ? value : Number(value);
            }
        };
    });

    console.log(putData)

    fetch(base+url, {
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

const testPassword = async (value, event) => {
    if (event) {event.preventDefault()};

    if (value === "") {
        document.querySelector('#login input').placeholder = " You must enter a key first"
        return;
    }

    if (value === "LOGOUT") {
        response = await fetch(base+`/logout/settings`);
    } else {
        response = await (await fetch(base+`/login/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Set the content type to form data
            },
            body: JSON.stringify({key: value})
        })).json()
    }

    console.log(response)

    const alertTitle = response.access
        ? "You are logged in successfully"
        : value === "LOGOUT"
            ? "You are logged out successfully"
            : "Access denied: incorrect key";

    alert({
        title: alertTitle,
        buttons: [{text: "OK", action: () => {location.reload()}}]
    });
}

const uploadFile = (file, name, progressBar) => {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', "/imageUpload");

        xhr.upload.addEventListener("progress", ({loaded, total}) => {
            if (document.querySelector(progressBar)) {
                let fileLoaded = Math.floor((loaded / total) * 100) / 100;
                document.querySelector(progressBar).style.width = (Math.round(document.querySelector(progressBar).parentNode.offsetWidth * fileLoaded)) + "px";
            }
        });

        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.responseText);
            } else {
                reject(new Error("Upload failed. Status code: " + xhr.status));
            }
        };
      
        xhr.onerror = () => {
            reject(new Error("Network error occurred during the upload"));
        };

        const formData = new FormData()
        formData.append('file', file, name);

        xhr.send(formData);
    });
}

window.onload = load;

document.addEventListener('click', () => {
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

/**
 * Script Cards:
 */

const convertJsToInput = (input) => {
    return input
        .replace(/^\s+/, "")
        .replaceAll("||","OR")
        .replaceAll("&&","AND")
        .replace(/===\s(\d+)/g,"= $1")
        .replace(/!==\s(\d+)/g,"!= $1")
        .replace(/\.includes\("(.*?)"\)/g," INCLUDES \"$1\"")
        .replace(/\b(AND|OR) !(?!=)/g,"$1 NOT ")
        .replace(/\s!(?!=)/g, " UNLESS ")
        .replace(/\b!(?!=)|^!/g, "UNLESS ")
        .replace(/data\[indices\.(\w+)]/g, function(match, capture) {
            const words = capture.split('_');
            const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
            return capitalizedWords.join('_');
        })
        .replace(/(!?)(=?)==/g, "$1=");
}

const convertJsToCard = (input) => {
    input = fixBraces(input);

    return input
        .replace(/([<>])(=?)\s?(\d+)/g, "<span class=g-l-than>$1$2 $3</span>")
        .replaceAll("||","<br><span class=t-stress>OR</span>")
        .replaceAll("&&","<br><span class=t-stress>AND</span>")
        .replace(/===\s(\d+)/g,"<span class=equals>= $1</span>")
        .replace(/!==\s(\d+)/g,"<span class=inequal>≠ $1</span>")
        .replace(/\.includes\((.*?)\)/g,"<span class=t-stress> INCLUDES </span><span style='color: #ce9178'>$1</span>")
        .replace(/\b(AND<\/span>|OR<\/span>) !(?!=)/g,"$1 <span class=t-stress>NOT</span> ")
        .replace(/\s!(?!=)/g, "<span class=t-stress> UNLESS </span>")
        .replace(/\b!(?!=)|^!/g,"<span class=t-stress>UNLESS </span>")
        .replace(/data\[indices\.(\w+)]/g, function(match, capture) {
            const words = capture.split('_');
            const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
            return capitalizedWords.join(' ');
        })
        .replace(/===/g,"<span class=equals>=</span>")
        .replace(/!==/g,"<span class=inequal>≠</span>")
        .replace(/(?<![es])(=| )(['"`])(.*?)\2/g, "<span style='color: var(--text-color2)'>$1</span><span style='color: #ce9178'>$2$3$2</span>");
}

const convertInputToCard = (input) => {
    input = fixBraces(input);

    return input
        .replace(/(?<![<>!])=\s*(\d+)/g, "<span class='equals'>= $1</span>")
        .replace(/(?<![<>])!=\s*(\d+)/g, "<span class='inequal'>≠ $1</span>")
        .replace(/(?<!')([<>])(=?)\s*(\d+)/g, "<span class='g-l-than'>$1$2 $3</span>")
        .replace(/\bAND\b/gi, "<br><span style='color: var(--text-color2)'>AND</span>")
        .replace(/\bOR\b/gi, "<br><span style='color: var(--text-color2)'>OR</span>")
        .replace(/\b(INCLUDES|UNLESS|NOT)\b/gi, "<span style='color: var(--text-color2)'>$1</span>")
        .replace(/\s!=\s/g," <span class=inequal>≠</span> ")
        .replace(/\s=\s/g," <span class=equals>=</span> ")
        .replace(/(?<![es])(=| )(['"`])(.*?)\2/g, "<span style='color: var(--text-color2)'>$1</span><span style='color: #ce9178'>$2$3$2</span>");
}

const valueToCondition = (value) => {
    value = value
        .replace(/AND/gi, "&&")
        .replace(/OR/gi, "||")
        .replace(/\sINCLUDES\s?(['"`])(.*?)\1/gi, ".includes($1$2$1)")
        .replace(/\bUNLESS\s/gi, " !")
        .replace(/\bNOT\s/gi, " !")
        .replace(/(?<=[^<>=!])=/g, "===")
        .replace(/!=/g, "!==");
    
    for (let key in data.table_naming) {
        value = value.replaceAll(key.split('_').map(segment => segment.charAt(0).toUpperCase() + segment.slice(1)).join('_'), "data[indices."+key+"]");
    }

    return value;
}

const fixBraces = (input) => {
    const colors = ['#f0c707', '#c56dcd', '#1899fe']; // Define the colors to cycle through
    let colorIndex = 0; // Initialize the color index
    let output = "", skip = false;

    for (let i = 0; i < input.length; i++) {
        switch (input[i]) {
            case '(':
                if (input[i+1] === "\"") {output += input[i]; skip = true; break};
                output += `<span style="color: ${colors[colorIndex]}">(</span>`;
                colorIndex = (colorIndex + 1) % colors.length; // Cycle through colors
                skip = false;
                break;
            case ')':
                if (skip) {output += input[i]; skip = false; break};
                colorIndex = (colorIndex + 2) % colors.length; // Cycle through colors
                output += `<span style="color: ${colors[colorIndex]}">)</span>`;
                break;
            default:
                output += input[i];
                break;
        }
    }

    return output;
}