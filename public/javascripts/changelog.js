const port = document.getElementById("data_storage").dataset.port;
const base = location.href.split("/")[0]+"/"+port;

const hexToRgba = (hex, a, dark) => {
    // Remove the hash at the start if it's there
    hex = hex.replace(/^#/, '');

    // Parse the hex color
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    if (dark) {
      r -= 100;
      g -= 100;
      b -= 100;

      r = r < 0 ? 0 : r;
      g = g < 0 ? 0 : g;
      b = b < 0 ? 0 : b;
    }

    return `rgba(${r},${g},${b},${a})`;
}

const loadSidebar = async () => {
    const sidebar = document.getElementById("sidebar");
    const data = await fetchRepo();

    fetch(data.url+"/releases")
    .then(response => response.json())
    .then(releases => {
      for (let release of releases) {
        const newTab = document.createElement('div');
        newTab.id = release.name.replace("v","").replaceAll(".","_");
        newTab.classList.add('tab');
        newTab.innerHTML = `
          <div class='content'>
            <h1>Website Version ${release.name.replace("v","")}</h1>
            <div>${release.body}</div>
          </div>`;
        document.getElementById("container").insertBefore(newTab, document.getElementById("bug_tracker"));

        sidebar.innerHTML += `<a id='${newTab.id+"_nav"}' onclick='switchTab("${newTab.id}")'>Web ${release.name}</a>`;

        if (release.name.replace("v","") === document.getElementById("data_storage").dataset.version) {
          newTab.style.display = "flex";
          document.getElementById(newTab.id+"_nav").classList.add("selected");
        }
      }
      sidebar.innerHTML += `<a id=bug_a onclick='switchTab("bug_tracker")'>Issue Tracker</a>`;
    });
}

const switchTab = (id) => {
    document.querySelectorAll(`.tab`).forEach(element => element.style.display = "none");
    document.querySelectorAll(`nav a`).forEach(element => element.classList.remove("selected"));
    document.getElementById(id).style.display = "flex";
    document.getElementById(id+"_nav").classList.add("selected");
}

const fetchIssues = async () => {
    const data = await fetchRepo();

    fetch(data.url+"/issues?state=all")
    .then(response => response.json())
    .then(issues => {
      for (let issue of issues) {
        document.querySelector('#bug_tracker .content .table .body').innerHTML += `
          <div id=${issue.number}>
            ${issue.state === "open"
              ? '<svg class="status_icon open" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>'
              : issue.state === "closed"
                ? '<svg class="status_icon closed" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"></path><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"></path></svg>'
                : '<svg class="status_icon unknown" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>'
            }
            <div style='display: flex; flex-direction: column; min-width: 11rem;'>
              <div style='display: flex; align-items: center; gap: 7px'>
                <span style="color: white">${issue.title}</span>
                ${issue.labels && issue.labels.length > 0
                  ? `<div class=label style="background-color: ${hexToRgba(issue.labels[0].color, 0.2, true)}; border-color: ${hexToRgba(issue.labels[0].color, 0.7)}; color: #${issue.labels[0].color}"><div style="scale: 0.9; font-weight: 600; translate: 0 1px">${issue.labels[0].name}</div></div>`
                  : ""
                }
              </div>
              <span style="color: gray; font-size: 0.8rem">#${issue.number} was ${issue.state === "open" ? "updated "+getTimeSince(new Date() - new Date(issue.updated_at)) : "solved "+getTimeSince(new Date() - new Date(issue.closed_at))}</span>
            </div>
            <span style="width: 30rem; padding-left: 15px; white-space: wrap; font-size: 0.9rem">${issue.body}</span>
          </div>
        `
      }
    })
    .catch(error => console.log(error));
}

const fetchRepo = async () => {
    const response = await fetch('repo');
    return response.json();
}

const getTimeSince = (millisecondsDiff) => {
    let secondsDiff = millisecondsDiff / 1000;
    // Return correct time interval:
    let interval = secondsDiff / 31536000;
    if (interval > 2) {
      return Math.floor(interval) + " years ago.";
    }
    interval = secondsDiff / 2592000;
    if (interval > 2) {
      return Math.floor(interval) + " months ago.";
    }
    interval = secondsDiff / 86400;
    if (interval > 2) {
      return Math.floor(interval) + " days ago.";
    }
    interval = secondsDiff / 3600;
    if (interval > 2) {
      return Math.floor(interval) + " hours ago.";
    }
    interval = secondsDiff / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes ago.";
    }
    if (secondsDiff > 10) {
      return Math.floor(secondsDiff) + " seconds ago.";
    }
    return "Now.";
}

  loadSidebar();
  fetchIssues();

const submitReport = (text) => {
    if (text.replaceAll(" ","")) {
        document.getElementById("report_text").value = "";
        fetch("/issue/submit", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Set the content type to form data
            },
            body: JSON.stringify({text: text})
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    resultNotification("Incompatible server version. Please update the server or contact 'service.vanced08@gmail.com' directly.", true);
                } else {
                    resultNotification("An unexpected error occurred. Please try again later or contact 'service.vanced08@gmail.com' directly.", true);
                }
            } else {
              resultNotification("Your report has been sent successfully.");
            }
            return response.json()
        })
        .then(data => {
            if (data.success) {
              resultNotification("Your report has been sent successfully.");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            resultNotification("An unexpected error occurred.");
        });
    } else {
        resultNotification("You cannot submit an empty report.");
    }
}

function resultNotification(text, delay) {
    const resultLine = document.getElementById("result");

    const previousText = resultLine.innerText;
    resultLine.innerText = text;
    resultLine.style.color = "white";
    resultLine.style.fontWeight = "bold";
    if (!delay) {
        setTimeout(function() {
            resultLine.innerText = previousText;
            resultLine.style.removeProperty("color");
            resultLine.style.fontWeight = "normal";
        }, 5000)
    }
}