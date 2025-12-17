/**********************************
 * Variables globales
 * *******************************/
// Charger les données du participant
const userData = JSON.parse(localStorage.getItem("stroopUserData"));

if (!userData) {
    // Si aucune donnée : renvoyer vers le formulaire
    window.location.href = "indexAccueil.html"; // nom à adapter
}

var nbBlocs = 6;
var blocCourant = 1;

var attribution = getRandomMCorMI();
var essais = genererEssai(attribution);
var tentative = 0;

var bonneReponse = null;
var essaiEnCours = false;
var boutonStart = null;
var erreurEl = null;
var essaiCourant = null;
var resultats = [{
    "participant": userData.participant,
    "age": userData.age,
    "genre": userData.gender,
    "lateralite": userData.laterality,
    "daltonisme": userData.colorblind,
    "autreDaltonisme": userData.colorblindOther,
    "modeDeplacement": userData.mouse,
    "test": []
}];
var warningMessage = null;

let isfinished = false;

// Tracking de la souris
let tracking = false;
let mousePath = [];   // tableau contenant {x, y, t}
let startPos = null;

// temps pour calcul IT et MT
let startTime = null;
let firstMoveTime = null;
let endTime = null;
let takeFirstMoveTime = false;

// temps de référence pour chaque ESSAI : clic sur START (t = 0)
let startClickTime = null;

/******************************** */

var couleurNormale = {
    "Rouge": "red",
    "Vert": "green",
    "Bleu": "blue",
    "Jaune": "yellow"
};

var couleurOpposee = {
    "Rouge": "green",
    "Vert": "red",
    "Bleu": "yellow",
    "Jaune": "blue"
};

var motOppose = {
    "Rouge": "Vert",
    "Vert": "Rouge",
    "Bleu": "Jaune",
    "Jaune": "Bleu"
};

/******************************** */

/**********************************
 * Calcul de l'AUC
 * *******************************/
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

/**********************************
 * Début du tracking
 * *******************************/
function startTracking() {
    tracking = true;
    mousePath = [];
    startPos = null;

    // t=0 AU CLIC SUR START
    startClickTime = performance.now();
}

/**********************************
 * Fin du tracking
 * *******************************/
function stopTracking() {
    tracking = false;
    const auc = computeAUC(mousePath);
    return auc;
}

/**********************************
 * Obtenir la couleur d'un essai
 * *******************************/
function getCouleur(essai) {
    if (essai.congruent) {
        return couleurNormale[essai.mot];
    } else {
        return couleurOpposee[essai.mot];
    }
}

/**********************************
 * Génération un essai
 * *******************************/
function genererEssai(attribution) {
    var essais = [];

    attribution.MC.forEach(function(mot) {
        for (var i = 0; i < attribution.nbCongMC; i++) {
            essais.push({ mot: mot, typePaire: "MC", congruent: true });
        }
        for (var i = 0; i < attribution.nbIncongMC; i++) {
            essais.push({ mot: mot, typePaire: "MC", congruent: false });
        }
    });

    attribution.MI.forEach(function(mot) {
        for (var i = 0; i < attribution.nbCongMI; i++) {
            essais.push({ mot: mot, typePaire: "MI", congruent: true });
        }
        for (var i = 0; i < attribution.nbIncongMI; i++) {
            essais.push({ mot: mot, typePaire: "MI", congruent: false });
        }
    });

    melangerEssais(essais);
    return essais;
}

/**********************************
 * Mélanger les essais
 * *******************************/
function melangerEssais(essais) {
    for (var i = essais.length - 1; i > 0; i--) {
        var j = getRandomInt(i + 1);
        var temp = essais[i];
        essais[i] = essais[j];
        essais[j] = temp;
    }
}

/**********************************
 * Attribuer les paires MC et MI aléatoirement
 * *******************************/
function getRandomMCorMI() {
    var paire1 = ["Rouge", "Vert"];
    var paire2 = ["Bleu", "Jaune"];

    var tirage = getRandomInt(2);

    if (tirage === 0) {
        return {
            MC: paire1,
            MI: paire2,
            nbCongMC: 4,
            nbIncongMC: 1,
            nbCongMI: 1,
            nbIncongMI: 4
        };
    } else {
        return {
            MC: paire2,
            MI: paire1,
            nbCongMC: 4,
            nbIncongMC: 1,
            nbCongMI: 1,
            nbIncongMI: 4
        };
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

/**********************************
 * Lancer un essai (START)
 * *******************************/
function afficherTexte() {
    if (warningMessage) {
        warningMessage.style.display = "none";
    }

    if (essaiEnCours) return;

    if (tentative >= essais.length) {
        finBloc();
        return;
    }

    essaiEnCours = true;
    bonneReponse = null;

    if (boutonStart) {
        boutonStart.style.display = "none";
    }

    essaiCourant = essais[tentative];
    tentative++;

    var h1 = document.getElementById('couleur');
    h1.innerText = "";
    h1.style.color = "black";
    h1.style.fontSize = "100px";

    setTimeout(function() {
        var texte = essaiCourant.mot;
        var couleur = getCouleur(essaiCourant);

        if (essaiCourant.congruent) {
            bonneReponse = essaiCourant.mot;
        } else {
            bonneReponse = motOppose[essaiCourant.mot];
        }

        h1.innerText = texte;
        h1.style.color = couleur;

        startTime = performance.now();
        takeFirstMoveTime = true;

        setTimeout(function() {
            if (essaiCourant && takeFirstMoveTime && !isfinished) {
                if (warningMessage) warningMessage.style.display = 'block';
            }
        }, 500);
    }, 300);
}

/**********************************
 * Clic sur une réponse
 * *******************************/
function choisirReponse(motChoisi) {
    // stop tracking dès la réponse (évite d'enregistrer entre essais)
    tracking = false;

    endTime = performance.now();

    let IT = firstMoveTime - startTime;
    let MT = endTime - firstMoveTime;

    if (!essaiEnCours || bonneReponse === null) return;

    essaiEnCours = false;
    var h1 = document.getElementById('couleur');
    var correct = (motChoisi === bonneReponse);

    resultats[0].test.push({
        bloc: blocCourant,
        index: tentative - 1,
        mot: essaiCourant.mot,
        bonneReponse: bonneReponse,
        reponse: motChoisi,
        correct: correct,
        congruent: essaiCourant.congruent,
        typeEssai: essaiCourant.congruent ? "congruent" : "incongruent",
        prop_congr: getPropCongr(essaiCourant),
        mousePath: mousePath.slice()
    });

    if (correct) {
        h1.innerText = "";
        setTimeout(function() {
            if (boutonStart) boutonStart.style.display = "block";
        }, 500);
    } else {
        if (erreurEl) erreurEl.style.display = "block";
        h1.innerText = "";

        setTimeout(function() {
            if (erreurEl) erreurEl.style.display = "none";
            setTimeout(function() {
                if (boutonStart) boutonStart.style.display = "block";
            }, 500);
        }, 2000);
    }

    bonneReponse = null;
    essaiCourant = null;
}

/**********************************
 * Fin du bloc
 * *******************************/
function finBloc() {
    essaiEnCours = false;

    if (erreurEl) erreurEl.style.display = "none";

    var h1 = document.getElementById('couleur');

    var totalBloc = 0;
    var nbCorrectsBloc = 0;
    for (var i = 0; i < resultats[0].test.length; i++) {
        if (resultats[0].test[i].bloc === blocCourant) {
            totalBloc++;
            if (resultats[0].test[i].correct) nbCorrectsBloc++;
        }
    }

    if (blocCourant < nbBlocs) {
        h1.style.color = "white";
        h1.style.fontSize = "30px";
        h1.innerText =
            "Bloc " + blocCourant + " terminé : " +
            nbCorrectsBloc + " / " + totalBloc + " réponses correctes.\n" +
            "Appuyez sur START pour passer au bloc suivant.";

        console.log(resultats)

        blocCourant++;
        tentative = 0;
        essais = genererEssai(attribution);

        if (boutonStart) boutonStart.style.display = "block";

    } else {
        if (!isfinished) {
            try {
                savedata(resultats);
                console.log("Données envoyées au serveur.");
                console.log(resultats);
            } catch (e) {
                console.error("Erreur lors de l'envoi des données :", e);
            }
        }

        isfinished = true;

        const essaisTous = resultats[0].test;
        var total = essaisTous.length;
        var nbCorrects = essaisTous.filter(function(r) { return r.correct; }).length;

        h1.style.color = "white";
        h1.style.fontSize = "30px";
        h1.innerText =
            "Expérience terminée : " +
            nbCorrects + " / " + total + " réponses correctes";

        console.log("==== RÉSULTATS ====");
        console.log(resultats);
    }
}

/**********************************
 * Suivi de la souris
 * *******************************/
document.addEventListener("mousemove", (event) => {
    if (tracking) {
        if (!startPos) {
            startPos = { x: event.clientX, y: event.clientY };
        }

        const now = performance.now();

        // ✅ t=0 = clic START ; reset à chaque essai via startTracking()
        const tRelatif = (mousePath.length === 0) ? 0 : (now - startClickTime);

        mousePath.push({
            x: event.clientX,
            y: event.clientY,
            t: tRelatif
        });
    }

    if (takeFirstMoveTime) {
        firstMoveTime = performance.now();
        takeFirstMoveTime = false;

        if (warningMessage) {
            warningMessage.style.display = "none";
        }
    }
});

/**********************************
 * Initialisation des boutons
 * *******************************/
window.onload = function() {
    boutonStart = document.getElementById('start');
    erreurEl = document.getElementById('erreur');
    warningMessage = document.getElementById('warning');

    boutonStart.onclick = function() {
        if (isfinished) {
            location.reload();
        }

        startTracking();

        afficherTexte();
    };

    document.getElementById('blue').onclick = function() { choisirReponse('Bleu'); };
    document.getElementById('yellow').onclick = function() { choisirReponse('Jaune'); };
    document.getElementById('red').onclick = function() { choisirReponse('Rouge'); };
    document.getElementById('green').onclick = function() { choisirReponse('Vert'); };
};

function getPropCongr(essai) {
    if (essai.typePaire === "MC") {
        return essai.congruent ? 80 : 20;
    } else { // MI
        return essai.congruent ? 20 : 80;
    }
}
