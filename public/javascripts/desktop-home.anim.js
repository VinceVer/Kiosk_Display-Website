let skipUpdate = false;

/* Handler. */
const animateTile = (tile, newUrgency, lastUpdate) => {
    if (getCookie("tile_animations") === "true" && !skipUpdate) {
        console.log(tile.parentNode.querySelectorAll('.kiosk').length, tile.dataset.tile_index, tile.parentNode.dataset.tiles_per_row)
        let animationClass;

        if (newUrgency === -1 && new Date(lastUpdate) - new Date(tile.dataset.oldest_report) > 86400000) {animatePlay_Grow(tile, newUrgency); return;}
        if (newUrgency === -1 && animateTest_Fall(tile)) {animatePlay_Fall(tile, newUrgency); return;}
        // if (newUrgency === -1 && animateTest_Walk(tile)) {animatePlay_Walk(tile, newUrgency); return}

        const stompElementB = animateTest_Stomp(tile);
        if (newUrgency === -1 && stompElementB) {animatePlay_Stomp(tile, newUrgency, stompElementB); return;}

        const pushElementB = animateTest_Push(tile);
        if (newUrgency === -1 && pushElementB) {animatePlay_Push(tile, newUrgency, pushElementB); return;}

        if (Math.random() < 0.6 || !animateTest_DontFall(tile)) {
            animationClass = "shake";
        } else if (Math.random() < 0.9) {
            animationClass = "nod";
        } else {
            animationClass = "spin";
        }

        tile.classList.add(animationClass)

        setTimeout(() => {
            updateUrgency(tile, newUrgency);
        }, 500);

        setTimeout(() => {
            tile.classList.remove(animationClass);
        }, 1000);
    } else {
        updateUrgency(tile, newUrgency);
    }
}
/* -------- */



/* Play. */
const animatePlay_Green = () => {
    skipUpdate = true;
    const animationList = ["nod", "shake", "spin"];
    let counter = 0;

    document.body.style.filter = "brightness(100)";

    for (let element of document.querySelectorAll('.kiosk')) {
        counter += Math.ceil(Math.random() * 3);

        if (Math.random() > 0.5) {
            setTimeout(function() {
                element.classList.add("fall");
            }, Math.random() * 8000);

        } else {
            element.classList.add("skip");
            element.dataset.animation_class = animationList[counter%animationList.length];
            setTimeout(function() {
                element.classList.add(element.dataset.animation_class);

                setTimeout(function() {
                    element.classList.remove(element.dataset.animation_class);
                    element.classList.add("fall");
                }, Math.random() * 5000);
            }, Math.random() * 8000);
        }
    }

    setTimeout(function() {
        document.body.querySelectorAll('&> *:not(#brightnessFilter):not(#anim_100_counter)').forEach(element => element.style.opacity = 0);
        document.getElementById("brightnessFilter").style.backgroundColor = "rgb(0, 0, 0)";
        document.body.style.transition = "none";
        document.body.style.filter = "brightness(1)";
    }, 16000)

    setTimeout(function() {
        document.getElementById("anim_100_counter").style.display = "flex";
        document.querySelectorAll('#anim_100_counter div.number').forEach((element) => {
            const iterations = element.dataset.iterations;
            console.log(iterations)
            for (let i = 0; i < iterations; i++) {
                element.innerText += "1234567890";
            }
            element.style.transform = `translateY(-${(element.offsetHeight / (iterations*10+1)) * element.dataset.end}px)`;
        });

        setTimeout(function() {
            document.getElementById("anim_100_counter").style.color = "hsl(100, 100%, 65%)";
            document.getElementById("anim_100_counter").style.opacity = 1;
        }, 0)
    }, 17000)

    setTimeout(function() {
        const expirationDate = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);

        if (getCookie("unlocked_green") !== "true") {
            document.cookie = `theme=green; expires=${expirationDate.toUTCString()}; path=/`;
            document.cookie = `unlocked_green=true; expires=${expirationDate.toUTCString()}; path=/`;
        }

        document.getElementById("themeLink").href = `/stylesheets/theme-green.css`
        document.body.querySelectorAll('&> *:not(#brightnessFilter):not(#anim_100_counter)').forEach(element => element.style.transition = "opacity 5s ease-in");
        document.body.querySelectorAll('&> *:not(#brightnessFilter):not(#anim_100_counter)').forEach(element => element.style.opacity = 1);
        document.getElementById("brightnessFilter").style.transition = "background-color 5s ease-in";
        document.getElementById("brightnessFilter").style.backgroundColor = `rgba(10, 10, 10, ${1 - getCookie("background_opacity") / 100})`;
        document.getElementById("anim_100_counter").style.transition = "opacity 5s ease-in";
        document.getElementById("anim_100_counter").style.opacity = 0;

        for (let element of document.querySelectorAll('.kiosk')) {
            setTimeout(function() {
                element.classList.remove("fall");
                element.classList.add("return");
            }, Math.random() * 8000);
        }

        setTimeout(function() {
            document.getElementById("anim_100_counter").style.display = "none";
        }, 5000)

        setTimeout(function() {
            location.reload();
        }, 10000);
    }, 22000)
}

const animatePlay_Fall = (tile, newUrgency) => {
    tile.classList.add("fall");

    setTimeout(function() {
        tile.classList.add("return");
        tile.classList.remove("fall");
        updateUrgency(tile, newUrgency)
    }, 4000);
    setTimeout(function() {
        tile.classList.remove("return");
    }, 5000);
}

const animatePlay_Grow = (tile, newUrgency) => {
    skipUpdate = true;
    tile.style.setProperty("--margin-left", (document.body.offsetWidth / 2) - tile.offsetLeft + (tile.offsetWidth / 2) + "px");
    tile.style.setProperty("--margin-top", (document.body.offsetHeight / 2) - tile.offsetTop - (tile.offsetHeight / 2) + "px");

    const initialTimeout = document.querySelectorAll(`.kiosk, .location h2`).length*20 + 3000
    document.querySelectorAll(`.kiosk, .location h2`).forEach((element, index) => {
        setTimeout(function() {
            element.style.boxShadow = "none";
            element.style.opacity = 0;
        }, index*20);
    });

    setTimeout(function() {
        document.getElementById(tile.id).classList.add("grow");
    }, initialTimeout);

    setTimeout(function() {
        updateUrgency(tile, newUrgency)
    }, initialTimeout + 12750);

    setTimeout(function() {
        document.querySelectorAll(`.kiosk, .location h2`).forEach((element, index) => {
            setTimeout(() => {
                element.style.removeProperty("boxShadow");
                element.style.removeProperty("opacity");
            }, index*5);
        });
    }, initialTimeout + 13050);

    setTimeout(function() {
        tile.classList.add("return");
        document.getElementById(tile.id).classList.remove("grow");
    }, initialTimeout + 15000);

    setTimeout(function() {
        tile.classList.remove("return");
        skipUpdate = false;
    }, initialTimeout + 16000);
}

const animatePlay_Push = (tile, newUrgency, elementB) => {
    tile.classList.add("push_A");
    elementB.classList.add("push_B");

    setTimeout(function() {
        tile.classList.add("return");
        tile.classList.remove("push_A");
        elementB.classList.remove("push_B");
        updateUrgency(tile, newUrgency)
    }, 5000);
    setTimeout(function() {
        tile.classList.remove("return");
    }, 6000);
}

const animatePlay_Stomp = (tile, newUrgency, elementB) => {
    tile.classList.add("stomp_A");
    elementB.classList.add("stomp_B");

    setTimeout(function() {
        updateUrgency(tile, newUrgency);
    }, 1700);
    setTimeout(function() {
        tile.classList.remove("stomp_A");
        elementB.classList.remove("stomp_B");
    }, 2000);
}

const animatePlay_Walk = (tile, newUrgency) => {
    tile.classList.add("walk_wiggle");

    setTimeout(function() {
        tile.classList.add("return");
        tile.classList.remove("walk_wiggle");
        updateUrgency(tile, newUrgency)
    }, 5000);
    setTimeout(function() {
        tile.classList.remove("return");
    }, 6000);
}
/* ----- */



/* Test. */
const animateTest_DontFall = (tile) => {
    for (let element of tile.parentNode.parentNode.querySelectorAll(`.kiosk:not(#${tile.id})`)) {
        if (element.offsetLeft === tile.offsetLeft && element.offsetTop >= tile.offsetTop && element.offsetTop < tile.offsetTop + 2 * tile.offsetHeight) {
            return true;
        }
    }
    return false;
}

const animateTest_Fall = (tile) => {
    for (let element of tile.parentNode.parentNode.querySelectorAll(`.kiosk:not(#${tile.id})`)) {
        if (element.offsetLeft === tile.offsetLeft && element.offsetTop > tile.offsetTop) { // Check for path to fall
            return false;
        }
    }
    return true;
}

const animateTest_Push = (tile) => {
    let elementB, minLeft = 0, surfaceLeft = 0;

    for (let element of tile.parentNode.parentNode.querySelectorAll(`.kiosk:not(#${tile.id})`)) {
        if (element.offsetTop === tile.offsetTop && element.offsetLeft > tile.offsetLeft) return false; // Check for clear path.
        if (element.offsetLeft > surfaceLeft && element.offsetTop >= tile.offsetTop && element.offsetTop < tile.offsetTop + 2 * tile.offsetHeight) surfaceLeft = element.offsetLeft; // Check for path length.
    }

    for (let element of tile.parentNode.parentNode.querySelectorAll(`.kiosk:not(#${tile.id})`)) {
        if (element.offsetLeft > surfaceLeft && element.offsetTop > tile.offsetTop && element.offsetLeft > minLeft) { // Check for path to fall.
            minLeft = element.offsetLeft;
        }
        if (element.offsetTop === tile.offsetTop && element.offsetLeft < tile.offsetLeft && element.offsetLeft > tile.offsetLeft - 2 * tile.offsetWidth) elementB = element;
    }

    console.log(minLeft, surfaceLeft)

    if (minLeft > surfaceLeft) surfaceLeft = minLeft;

    if (surfaceLeft > 0 && elementB) {
        tile.style.setProperty("--margin-left", (surfaceLeft - tile.offsetLeft + tile.offsetWidth + 15) + "px");
        return elementB;
    } else {
        return false;
    }
}

const animateTest_Stomp = (tile) => {
    let elementB;

    for (let element of tile.parentNode.parentNode.querySelectorAll(`.kiosk:not(#${tile.id})`)) {
        if (element.offsetLeft === tile.offsetLeft && element.offsetTop > tile.offsetTop && element.offsetTop < tile.offsetTop + 2 * tile.offsetHeight) return false;
        if (element.offsetLeft === tile.offsetLeft && element.offsetTop > tile.offsetTop + 2 * tile.offsetHeight && element.offsetTop < tile.offsetTop + 3 * tile.offsetHeight) {
            elementB = element;
        }
    }

    return elementB;
}

const animateTest_Walk = (tile) => {
    let maxLeft = 0, surfaceLeft = 0;

    for (let element of tile.parentNode.parentNode.querySelectorAll(`.kiosk:not(#${tile.id})`)) {
        if (element.offsetTop === tile.offsetTop && element.offsetLeft > tile.offsetLeft) return false; // Check for clear path.
        if (element.offsetLeft > maxLeft) maxLeft = element.offsetLeft; // Check max edge of group.
        if (element.offsetLeft > surfaceLeft && element.offsetTop >= tile.offsetTop && element.offsetTop < tile.offsetTop + 2 * tile.offsetHeight) surfaceLeft = element.offsetLeft; // Check for path length.
    }

    for (let element of tile.parentNode.parentNode.querySelectorAll(`.kiosk:not(#${tile.id})`)) {
        if (element.offsetLeft > surfaceLeft && element.offsetTop > tile.offsetTop) { // Check for path to fall.
            return false;
        }
    }

    if (maxLeft > tile.offsetLeft && surfaceLeft > 0) {
        tile.style.setProperty("--margin-left", (surfaceLeft - tile.offsetLeft + tile.offsetWidth + 15) + "px");
        return true;
    } else {
        return false;
    }
}
/* ----- */