// ==========================================
// 1. BEVEILIGING & GLOBALE VARIABELEN
// ==========================================
const huidigeSpeler = localStorage.getItem('hj_current_user');
if (!huidigeSpeler) {
    window.location.href = "login.html";
}

let huidigeScore = 0;
let huidigeStreak = 0;
let gameSongs = [];       
let actieveLijst = [];    
let huidigNummer = null;

const audioPlayer = document.getElementById('partyAudioEngine');
const audioBtn = document.getElementById('audioBtn');

// ==========================================
// 2. APPLICATIE START & ALBUM LOGICA
// ==========================================
function startApp() {
    document.getElementById('playerDisplay').innerText = huidigeSpeler;
    
    fetch('songs.json')
        .then(response => response.json())
        .then(data => {
            gameSongs = data;
            wisselVanAlbum(); 
        })
        .catch(err => {
            document.getElementById('status').innerText = "Fout bij laden van de database.";
        });
}

function wisselVanAlbum() {
    const gekozenPack = document.getElementById('packSelect').value;
    
    if (gekozenPack === "alle") {
        actieveLijst = [...gameSongs];
    } else {
        actieveLijst = gameSongs.filter(song => song.pack === gekozenPack);
    }
    laadNieuwNummer();
}

function laadNieuwNummer() {
    if (typeof toggleWinampVisualizer === 'function') {
        toggleWinampVisualizer(false);
    }
    if (audioPlayer) {
        audioPlayer.pause();
    }

    if (actieveLijst.length === 0) {
        document.getElementById('status').innerText = "Dit album is nog leeg!";
        return;
    }

    document.getElementById('status').innerText = "Liedje zoeken...";
    document.getElementById('songCard').style.display = "none";
    document.getElementById('nextBtn').style.display = "none";
    audioBtn.disabled = true;
    audioBtn.innerText = "▶";
    audioBtn.classList.remove('playing');
    document.getElementById('quizContainer').style.display = "none";

    huidigNummer = actieveLijst[Math.floor(Math.random() * actieveLijst.length)];
    zoekIniTunes(huidigNummer);
}

// ==========================================
// 3. ITUNES API INTEGRATIE (JSONP)
// ==========================================
function zoekIniTunes(song) {
    const schoneArtiest = song.artist.replace('&', ' ');
    const zoekterm = encodeURIComponent(schoneArtiest + " " + song.title);
    const callbackName = 'itunesCallback_' + Math.floor(Math.random() * 100000);
    
    window[callbackName] = function(data) {
        if (data.results && data.results.length > 0 && data.results.previewUrl) {
            audioPlayer.crossOrigin = "anonymous"; 
            audioPlayer.src = data.results.previewUrl; 
            
            document.getElementById('status').innerText = ""; 
            audioBtn.disabled = false;
            document.getElementById('revealBtn').style.display = "none";
            genereerQuizKnoppen(song.year);
        } else {
            document.getElementById('status').innerText = "Fout: Geen audio gevonden voor dit nummer.";
            document.getElementById('nextBtn').style.display = "block";
        }
        const scriptElement = document.getElementById(callbackName);
        if (scriptElement) scriptElement.remove();
        delete window[callbackName];
    };

    const script = document.createElement('script');
    script.id = callbackName;
    script.src = "https://itunes.apple.com/search" + zoekterm + "&limit=1&entity=song&callback=" + callbackName;
    document.body.appendChild(script);
}

// ==========================================
// 4. AUDIO CONTROLS
// ==========================================
function toggleAudio() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        audioBtn.innerText = "⏸";
        audioBtn.classList.add('playing');
        
        if (typeof toggleWinampVisualizer === 'function') {
            toggleWinampVisualizer(true);
        }
    } else {
        audioPlayer.pause();
        audioGestaakt();
    }
}

function audioGestaakt() {
    audioBtn.innerText = "▶";
    audioBtn.classList.remove('playing');
    
    if (typeof toggleWinampVisualizer === 'function') {
        toggleWinampVisualizer(false);
    }
}

// ==========================================
// 5. QUIZ GAMEPLAY LOGICA
// ==========================================
function genereerQuizKnoppen(correctJaar) {
    const quizButtonsContainer = document.getElementById('quizButtons');
    const feedbackContainer = document.getElementById('quizFeedback');
    
    quizButtonsContainer.innerHTML = ""; 
    feedbackContainer.innerText = "";    

    let alleJaren = [...new Set(actieveLijst.map(s => s.year))];
    alleJaren = alleJaren.filter(y => y !== correctJaar);

    alleJaren.sort(() => 0.5 - Math.random());
    let gekozenOpties = alleJaren.slice(0, 3);
    gekozenOpties.push(correctJaar);
    gekozenOpties.sort(() => 0.5 - Math.random());

    gekozenOpties.forEach(jaar => {
        const knop = document.createElement('button');
        knop.className = 'btn-quiz';
        knop.innerText = jaar;
        knop.onclick = () => controleerAntwoord(knop, jaar, correctJaar);
        quizButtonsContainer.appendChild(knop);
    });

    document.getElementById('quizContainer').style.display = "block";
}

function controleerAntwoord(gekozenKnop, gekozenJaar, correctJaar) {
    const alleKnoppen = document.querySelectorAll('.btn-quiz');
    const feedbackContainer = document.getElementById('quizFeedback');

    alleKnoppen.forEach(btn => btn.disabled = true);

    if (gekozenJaar === correctJaar) {
        gekozenKnop.classList.add('correct');
        feedbackContainer.style.color = "#00ffcc";
        feedbackContainer.innerText = "🎉 Helemaal goed!";
        huidigeStreak++;
        huidigeScore += 10 + huidigeStreak;
    } else {
        gekozenKnop.classList.add('incorrect');
        feedbackContainer.style.color = "#ff2d55";
        feedbackContainer.innerText = `😢 Helaas! Het was ${correctJaar}.`;
        huidigeStreak = 0;

        alleKnoppen.forEach(btn => {
            if (parseInt(btn.innerText) === correctJaar) {
                btn.classList.add('correct');
            }
        });
    }

    document.getElementById('scoreDisplay').innerText = huidigeScore;
    document.getElementById('streakDisplay').innerText = huidigeStreak;

    const oudeHighScore = localStorage.getItem(`hj_highscore_${huidigeSpeler}`) || 0;
    if (huidigeScore > oudeHighScore) {
        localStorage.setItem(`hj_highscore_${huidigeSpeler}`, huidigeScore);
    }

    onthulLiedje();
}

function onthulLiedje() {
    document.getElementById('songYear').innerText = huidigNummer.year;
    document.getElementById('songTitle').innerText = huidigNummer.title;
    document.getElementById('songArtist').innerText = huidigNummer.artist;
    
    document.getElementById('songCard').style.display = "block";
    document.getElementById('revealBtn').style.display = "none";
    document.getElementById('nextBtn').style.display = "block";
}

// ==========================================
// 6. INITIALISATIE & QR-CODE
// ==========================================
window.onload = function() {
    startApp();

    if (typeof QRCode !== 'undefined') {
        new QRCode(document.getElementById("qrcode"), {
            text: "https://js.org",
            width: 140,
            height: 140,
            colorDark : "#0b0c10", 
            colorLight : "#ffffff", 
            correctLevel : QRCode.CorrectLevel.H
        });
    }
};

function toggleQRCode() {
    const qrWrapper = document.getElementById('qrWrapper');
    const qrArrow = document.getElementById('qrArrow');

    if (qrWrapper.style.display === "none") {
        qrWrapper.style.display = "block";
        qrArrow.innerText = "🔽"; 
    } else {
        qrWrapper.style.display = "none";
        qrArrow.innerText = "▶️"; 
    }
}

// Service worker registratie
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
    });
}
