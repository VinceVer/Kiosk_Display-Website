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