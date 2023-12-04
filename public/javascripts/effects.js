// Glowing Borders:
document.getElementById("tiles").addEventListener("mousemove", event => {
    document.querySelectorAll(".tile").forEach(tile => {
        const rect = tile.getBoundingClientRect(),
        x = event.clientX - rect.left,
        y = event.clientY - rect.top;
  
        tile.style.setProperty("--mouse-x", `${x}px`);
        tile.style.setProperty("--mouse-y", `${y}px`);
    });
});