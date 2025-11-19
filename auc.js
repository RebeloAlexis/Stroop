function computeAUC(path) {
    if (path.length < 2) return 0;

    const x0 = path[0].x;
    const y0 = path[0].y;

    const x1 = path[path.length - 1].x;
    const y1 = path[path.length - 1].y;

    const normPath = path.map(p => ({
        x: (p.x - x0) / (x1 - x0),
        y: (p.y - y0) / (y1 - y0)
    }));

    // Ligne droite idéale (y = 0)
    // On calcule l'écart vertical réel à chaque x
    let auc = 0;
    for (let i = 1; i < normPath.length; i++) {
        const xPrev = normPath[i - 1].x;
        const xCurr = normPath[i].x;

        const yPrev = normPath[i - 1].y;
        const yCurr = normPath[i].y;

        const deltaX = xCurr - xPrev;
        const meanY = (Math.abs(yPrev) + Math.abs(yCurr)) / 2;

        auc += deltaX * meanY;
    }

    return auc;
}

let tracking = false;
let mousePath = [];   // tableau contenant {x, y, t}
let startPos = null;

function startTracking() {
    tracking = true;
    mousePath = [];
    startPos = null;
    console.log("Tracking ON");
}

function stopTracking(color) {
    tracking = false;
    console.log("Tracking OFF");

    const auc = computeAUC(mousePath);
    console.log("AUC =", auc);

    return auc;
}

document.addEventListener("mousemove", (event) => {
    if (tracking) {
        if (!startPos) {
            startPos = { x: event.clientX, y: event.clientY };
        }

        mousePath.push({
            x: event.clientX,
            y: event.clientY,
            t: performance.now()
        });
    }
});

// START
document.getElementById("start").addEventListener("click", () => {
    startTracking();
});

// COLORS → arrêt + calcul AUC
["blue", "yellow", "red", "green"].forEach(id => {
    document.getElementById(id).addEventListener("click", () => {
        const auc = stopTracking(id);
        alert("AUC = " + auc);
    });
});
