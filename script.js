/**********************************
 * Variables globales
 * *******************************/
var nbEssais = 20;

var attribution = getRandomMCorMI();
var essais = genererEssai(attribution);
var tentative = 0;

var bonneReponse = null;
var essaiEnCours = false;
var boutonStart = null;
var erreurEl = null;
var essaiCourant = null;
var resultats = [];

// Tracking de la souris
let tracking = false;
let mousePath = [];   // tableau contenant {x, y, t}
let startPos = null;

// temps pour calcul IT et MT
let startTime = null;
let firstMoveTime = null;
let endTime = null;
let takeFirstMoveTime = false;

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

/**********************************
 * Début du tracking
 * *******************************/
function startTracking() {
    tracking = true;
    mousePath = [];
    startPos = null;
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

    // Pour chaque mot de la paire MC
    attribution.MC.forEach(function(mot) {
        // Essais congruents pour ce mot
        for (var i = 0; i < attribution.nbCongMC; i++) {
            essais.push({
                mot: mot,
                typePaire: "MC",
                congruent: true
            });
        }

        // Essais incongruents pour ce mot
        for (var i = 0; i < attribution.nbIncongMC; i++) {
            essais.push({
                mot: mot,
                typePaire: "MC",
                congruent: false
            });
        }
    });

    // Pour chaque mot de la paire MI
    attribution.MI.forEach(function(mot) {
        // Essais congruents pour ce mot
        for (var i = 0; i < attribution.nbCongMI; i++) {
            essais.push({
                mot: mot,
                typePaire: "MI",
                congruent: true
            });
        }

        // Essais incongruents pour ce mot
        for (var i = 0; i < attribution.nbIncongMI; i++) {
            essais.push({
                mot: mot,
                typePaire: "MI",
                congruent: false
            });
        }
    });

    // Mélanger les essais
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

            nbCongMC: 4,   // pour chaque mot MC
            nbIncongMC: 1,
            nbCongMI: 1,   // pour chaque mot MI
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


/**********************************
 * Lancer un essai (START)
 * *******************************/
function afficherTexte() {

    // éviter les doubles clics pendant un essai
    if (essaiEnCours) {
        return;
    }

    // Fin du bloc
    if (tentative >= essais.length) {
        finBloc();
        return;
    }

    essaiEnCours = true;
    bonneReponse = null;

    // cacher le bouton START pendant l'essai
    if (boutonStart) {
        boutonStart.style.display = "none";
    }

    essaiCourant = essais[tentative];
    tentative++;

    var h1 = document.getElementById('couleur');
    h1.innerText = "";
    h1.style.color = "black";

    // délai de 300 ms comme dans l'expérience
    setTimeout(function() {
        var texte = essaiCourant.mot;
        var couleur = getCouleur(essaiCourant);

        // Déterminer la bonne réponse (mot correspondant à la couleur d’encre)
        if (essaiCourant.congruent) {
            bonneReponse = essaiCourant.mot; // même mot
        } else {
            bonneReponse = motOppose[essaiCourant.mot]; // mot opposé dans la paire
        }

        h1.innerText = texte;
        h1.style.color = couleur;

        // Prise du temps de début et permission de prendre le premier mouvement
        startTime = performance.now();
        takeFirstMoveTime = true;
    }, 300);
}


function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

/**********************************
 * Clic sur une réponse
 * *******************************/
function choisirReponse(motChoisi) {
    // temps de fin
    endTime = performance.now();

    // calculer IT et MT
    let IT = firstMoveTime - startTime;
    let MT = endTime - firstMoveTime;

    // soit pas d'essai, soit le stimulus n'est pas encore apparu
    if (!essaiEnCours || bonneReponse === null) {
        return;
    }

    essaiEnCours = false; // l'essai est terminé à partir du clic
    var h1 = document.getElementById('couleur');
    var correct = (motChoisi === bonneReponse);
    var auc = stopTracking();

    // Enregistrer le résultat de cet essai
    resultats.push({
        index: tentative - 1,         
        mot: essaiCourant.mot,
        typePaire: essaiCourant.typePaire,
        congruent: essaiCourant.congruent,
        bonneReponse: bonneReponse,
        reponse: motChoisi,
        correct: correct,
        auc: auc,
        IT: IT,
        MT: MT
    });

    if (correct) {

        // on efface le stimulus
        h1.innerText = "";

        // 500ms avant de pouvoir relancer un essai (Start réapparaît)
        setTimeout(function() {
            if (boutonStart) {
                boutonStart.style.display = "block";
            }
        }, 500);

    } else {

        // afficher X rouge pendant 2s
        if (erreurEl) {
            erreurEl.style.display = "block";
        }

        // on efface le stimulus
        h1.innerText = "";

        setTimeout(function() {
            // retirer le X
            if (erreurEl) {
                erreurEl.style.display = "none";
            }

            // attendre encore 500ms avant de réafficher START
            setTimeout(function() {
                if (boutonStart) {
                    boutonStart.style.display = "block";
                }
            }, 500);

        }, 2000);
    }

    // reset
    bonneReponse = null;
    essaiCourant = null;
}

/**********************************
 * Fin du bloc
 * *******************************/
function finBloc() {
    essaiEnCours = false;

    if (boutonStart) {
        boutonStart.style.display = "none";
    }
    if (erreurEl) {
        erreurEl.style.display = "none";
    }

    var h1 = document.getElementById('couleur');

    var total = resultats.length;
    var nbCorrects = resultats.filter(function(r) { return r.correct; }).length;

    h1.style.color = "white";
    h1.innerText = "Fin du bloc\n" + nbCorrects + " / " + total + " réponses correctes";

    // Pour analyse : tout le tableau dans la console
    console.log("==== RÉSULTATS ====");
    console.log(resultats);
}

/**********************************
 * Suivi de la souris
 * *******************************/
document.addEventListener("mousemove", (event) => {
    // uniquement si le tracking est activé
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

    // Prendre le temps du premier mouvement
    if (takeFirstMoveTime) {
        firstMoveTime = performance.now();
        takeFirstMoveTime = false;
    }
});

/**********************************
 * Initialisation des boutons
 * *******************************/
window.onload = function() {
    // Récupérer les éléments
    boutonStart = document.getElementById('start');
    erreurEl = document.getElementById('erreur');

    boutonStart.onclick = function() {
        afficherTexte();
        
        // Activer le tracking que si il reste des essais
        if (!(tentative >= essais.length + 1)) {
            startTracking();
        }
    };

    document.getElementById('blue').onclick = function() {
        choisirReponse('Bleu');
    };
    document.getElementById('yellow').onclick = function() {
        choisirReponse('Jaune');
    };
    document.getElementById('red').onclick = function() {
        choisirReponse('Rouge');
    };
    document.getElementById('green').onclick = function() {
        choisirReponse('Vert');

    };
};  
