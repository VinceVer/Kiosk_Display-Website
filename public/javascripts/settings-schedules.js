const tableOptions = ["AND", "INCLUDES", "UNLESS", "NOT", "OR", "<", ">", "!=", "="];
let inputField, hrefType, hrefIndex;
const conditionsField = document.getElementById("conditions");
const schedule_data = JSON.parse(document.getElementById("data_storage").dataset.schedule_data);
const index_value = Number(document.getElementById("data_storage").dataset.index);

const loadHEAD = async () => {
    for (let itemIndex in schedule_data.reports) {
        const item = schedule_data.reports[itemIndex];
        const chip = item.type;
        const tile = createTile({title: `${item.file_name}`}, chip)
        tile.querySelector('p').innerHTML = `Last executed: ${item.date_start} ${item.time_start}<br>Executes ${item.frequency_readable}<br>Report format: <span style='color: var(--link-color)'>${item.format}</span><br><br><span class='t-stress'>CC:</span> ${item.email_recipients.join(",\n")}`

        if (writeAccess) {
            tile.addEventListener("click", (e) => {
                location.href = `${schedulesURL}/report?index=${itemIndex}`;
            });

            tile.addEventListener("contextmenu", (e) => {
                loadContextMenu_TILE(e, tile,
                    () => {alert({title: `Remove <span class="t-stress">${item.file_name}</span>?`, description: "Are you sure you want to remove this schedule?<br><span style='color: #A64141'>This action cannot be undone.</span>",
                        buttons: [{text: "Cancel", invert: 0.85, action: () => {location.reload()}}, {text: "Confirm", action: () => {submitDelete(`/schedules.json/reports/${itemIndex}`)}}]
                    })}
                )
            });
        } else {
            tile.addEventListener("contextmenu", (e) => {e.preventDefault()});
        }

        document.getElementById("reportsGrid").appendChild(tile);
    }

    /* Add Report: */
    const addButton = createTile({title: null, href: schedulesURL+"/reports?index="+schedule_data.reports.length});
    addButton.classList.add("addButton");
    addButton.style.height = document.getElementById("reportsGrid").querySelectorAll('.gridTile')[document.getElementById("reportsGrid").querySelectorAll('.gridTile').length-1].offsetHeight+"px";
    document.getElementById("reportsGrid").appendChild(addButton);
    /* --------- */
}