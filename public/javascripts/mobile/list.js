import * as displayElements from "../modules/defaultDisplayElements.js";
import * as defaultFunctions from "../modules/defaultFunctions.js";
import * as overlay from "../modules/defaultOverlays.js";
import { status_database, config_data, default_href } from "../modules/dataStorage.js";
import { iconMap, refreshIcons } from "../modules/iconHandler.js";
import { loadKioskMobile, setupSwipeActions } from "../modules/contextMenus.js";

const sortInput = document.querySelector('select[name=sort]');
const filterInput = document.querySelector('select[name=filter]');
const searchInput = document.querySelector('input[name=search]');
const tbodyElement = document.querySelector('#kiosk_table tbody');
const segmentTemplate = document.querySelector('template#segment');
const enableContextMenu = document.querySelector('.templates[for=contextmenus]') ? true : false;

const setOnlineText = "Change to Online";
const onlineIcon = `<i class=ico ${iconMap['check-circle']}</i>`;



/** Loads a list with each row representing a kiosk. */
const loadList = () => {
    const filterPerLocation = config_data.groups.length === 1;
    
    if (document.querySelector('tbody tr')) unloadList();

    for (let kioskName in status_database) {
        const kiosk = status_database[kioskName];

        const row = displayElements.createRow(kiosk.id, kiosk.urgency_icon, kiosk.note,  tbodyElement);
        row.dataset.group = filterPerLocation
            ? kiosk.location
            : kiosk.group;

        row.dataset.urgency = defaultFunctions.getMobileUrgencyLevel(kiosk.urgency_level);
        row.dataset.real_urgency = String(kiosk.urgency_level);

        row.addEventListener('click', () => {
            const querySuffix = location.href.includes("?") ? "?"+location.href.split("?")[1] : "";
            history.pushState(null, "", `${default_href}/k/${kiosk.id}${querySuffix}`);
            overlay.loadKioskData(kiosk.id, segmentTemplate, enableContextMenu);
        });

        if (!enableContextMenu) continue;
        row.addEventListener('contextmenu', (event) => {
            loadKioskMobile(event, row)
        });
        setupSwipeActions(row);
    }

    refreshList();
    refreshIcons();
};

/** Unloads the list */
const unloadList = () => {
    document.querySelectorAll('tbody tr').forEach(element => element.remove());
};



/** Filters the list. */
const filterList = () => {
    const filterBy = filterInput.value;
    const searchBy = searchInput.value;

    document.querySelectorAll('table tbody tr').forEach(row => {
        row.style.display = row.id.toUpperCase().includes(searchBy) && row.dataset.group.toUpperCase().includes(filterBy)
            ? "table-row"
            : "none";
    });

    refreshRowColors();
}

/** Sorts the list. */
const sortList = () => {
    const sortBy = sortInput.value.split(",")[0];
    const descending = sortInput.value.split(",")[1] === "desc";

    defaultFunctions.sortElements(document.querySelector('#kiosk_table table tbody'), 'tr', sortBy, descending);

    refreshRowColors();
}

/** Refreshes the row colors of the list. */
const refreshRowColors = () => {
    let index = 0;
    document.querySelectorAll('tbody tr').forEach(item => {
        if (item.style.display === "none") return;
        item.style.backgroundColor = index % 2 === 0 ? "var(--table-row-color-2)" : "var(--table-row-color-1)";
        index++;
    });
}

/** Allows for external calls to refresh te list. */
export const refreshList = () => {
    filterList();
    sortList();
};

loadList();



/** Adds event listeners for opening and closing search options. */
document.querySelectorAll('#search> div> div').forEach(element => {
    element.addEventListener('touchend', function() {
        document.querySelectorAll('#search .selected').forEach(item => item.classList.remove('selected'));
        this.classList.add('selected');
    });
});



/** Adds an event listener to the search field for updating the search icon. */
document.querySelector('#search input').addEventListener('input', function() {
    this.value = this.value.toUpperCase();
    this.parentElement.parentElement.querySelector('.ico').style.color = this.value ? "var(--text-color2)" : "var(--text-color1)";

    filterList();
    refreshRowColors();
});



/** Adds an event listener to the sort input. */
sortInput.addEventListener('change', sortList);

/** Adds an event listener to the filter input. */
filterInput.addEventListener('change', filterList);