/**
 * HitJam Modulair Component: Winamp Pro Multi-Visualizer Engine v6.0
 */

let audioContext = null;
let analyser = null;
let dataArray = null;
let visualizerCanvas = null;
let canvasCtx = null;
let animationFrameId = null;

// Dit onthoudt welke modus er deze beurt actief is (Nu keuze uit 1, 2, 3 of 4!)
let actieveWinampModus = 1; 

(function injecteerWinampProCSS() {
    const style = document.createElement('style');
    style.innerHTML = `
        .winamp-canvas {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 0; pointer-events: none;
            opacity: 0; transition: opacity 0.4s ease;
        }
        .winamp-active .winamp-canvas {
            opacity: 0.35;
        }
    `;
    document.head.appendChild(style);
})();

function initWinampAudioEngine() {
    const audioElement = document.getElementById('partyAudioEngine');
    const app = document.getElementById('hitjamApp');
    if (!audioElement || !app || audioContext) return;

    try {
        visualizerCanvas = document.createElement('canvas');
        visualizerCanvas.id = 'winampCanvas';
        visualizerCanvas.classList.add('winamp-canvas');
        app.insertBefore(visualizerCanvas, app.firstChild);
        canvasCtx = visualizerCanvas.getContext('2d');

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256; 

        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        visualizerCanvas.width = app.clientWidth;
        visualizerCanvas.height = app.clientHeight;
    } catch (e) {
        console.log("Winamp Engine initialisatie mislukt:", e);
    }
}

/**
 * DE CENTRALE DRAW-LOOP (60 frames per seconde)
 */
function renderWinampVisuals() {
    if (!analyser || !canvasCtx || !visualizerCanvas) return;

    animationFrameId = requestAnimationFrame(renderWinampVisuals);
    const width = visualizerCanvas.width;
    const height = visualizerCanvas.height;

    // Maak het canvas leeg voor het nieuwe frame
    canvasCtx.clearRect(0, 0, width, height);

    // =============================================================
    // MODUS 1: RETRO NEON OSCILLOSCOPE (De golflijn)
    // =============================================================
    if (actieveWinampModus === 1) {
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.lineWidth = 3;
        canvasCtx.strokeStyle = '#00ffcc';
        canvasCtx.shadowBlur = 15;
        canvasCtx.shadowColor = '#00ffcc';
        canvasCtx.beginPath();

        const sliceWidth = width * 1.0 / analyser.frequencyBinCount;
        let x = 0;

        for (let i = 0; i < analyser.frequencyBinCount; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * height / 2;
            if (i === 0) canvasCtx.moveTo(x, y); else canvasCtx.lineTo(x, y);
            x += sliceWidth;
        }
        canvasCtx.lineTo(width, height / 2);
        canvasCtx.stroke();
    }
    
    // =============================================================
    // MODUS 2: RETRO SPECTRUM BARS (De Winamp VU-balkjes)
    // =============================================================
    else if (actieveWinampModus === 2) {
        analyser.getByteFrequencyData(dataArray);
        canvasCtx.shadowBlur = 0;

        const barWidth = (width / analyser.frequencyBinCount) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < analyser.frequencyBinCount; i++) {
            barHeight = dataArray[i] * 1.2;

            const gradient = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, '#00f0ff');
            gradient.addColorStop(0.5, '#9d00ff');
            gradient.addColorStop(1, '#ff007f');

            canvasCtx.fillStyle = gradient;
            canvasCtx.fillRect(x, height - barHeight, barWidth - 4, barHeight);
            x += barWidth;
        }
    }
    
    // =============================================================
    // MODUS 3: 🔥 FIX! MUSICAL PLASMA GLOW (De pulserende cirkel)
    // =============================================================
    else if (actieveWinampModus === 3) {
        analyser.getByteFrequencyData(dataArray);

        // FIX: We meten nu het GEMIDDELDE volume van het HELE nummer (alle frequenties), 
        // zodat de Paarse Gloed nu gegarandeerd reageert op zang, beats én gitaren!
        let totaalVolume = 0;
        for (let i = 0; i < dataArray.length; i++) {
            totaalVolume += dataArray[i];
        }
        let gemiddeldVolume = totaalVolume / dataArray.length;

        // Laat de cirkel meebewegen op de muziek
        const basisStraal = 40;
        const actueleStraal = basisStraal + (gemiddeldVolume * 1.1); // Krachtigere uitslag

        canvasCtx.beginPath();
        canvasCtx.arc(width / 2, height / 2, actueleStraal, 0, 2 * Math.PI);
        
        canvasCtx.shadowBlur = 40;
        canvasCtx.shadowColor = '#9d00ff';
        
        const radialGradient = canvasCtx.createRadialGradient(width/2, height/2, 5, width/2, height/2, actueleStraal);
        radialGradient.addColorStop(0, 'rgba(255, 0, 127, 0.5)'); // Neon roze kern
        radialGradient.addColorStop(0.5, 'rgba(157, 0, 255, 0.3)'); // Paarse gloed
        radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        canvasCtx.fillStyle = radialGradient;
        canvasCtx.fill();
    }

    // =============================================================
    // MODUS 4: ✨ NIEUW! RETRO DISCO BEAT STROBE
    // =============================================================
    else if (actieveWinampModus === 4) {
        analyser.getByteFrequencyData(dataArray);

        // Meet de intensiteit van de beat/zang
        let volume = 0;
        for (let i = 0; i < dataArray.length; i++) { volume += dataArray[i]; }
        let volumePercentage = (volume / dataArray.length) / 255;

        // Als er een harde beat of climax is, flitst de achtergrond heel kort op
        if (volumePercentage > 0.4) {
            canvasCtx.fillStyle = `rgba(0, 240, 255, ${volumePercentage * 0.25})`; // Neon cyaan flits
            canvasCtx.fillRect(0, 0, width, height);
            
            // Teken tegelijkertijd twee vette retro laser-lijnen aan de zijkanten
            canvasCtx.lineWidth = 4;
            canvasCtx.strokeStyle = '#ff007f';
            canvasCtx.shadowBlur = 20;
            canvasCtx.shadowColor = '#ff007f';
            
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, 0); canvasCtx.lineTo(0, height);
            canvasCtx.moveTo(width, 0); canvasCtx.lineTo(width, height);
            canvasCtx.stroke();
        }
    }
}

/**
 * HOOFDFUNCTIE
 */
function toggleWinampVisualizer(status = true) {
    const app = document.getElementById('hitjamApp');
    if (!app) return;

    if (status) {
        initWinampAudioEngine();
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Kiest nu willekeurig uit VIER verschillende Winamp-stijlen!
        actieveWinampModus = Math.floor(Math.random() * 4) + 1;
        
        app.classList.add('winamp-active');
        if(!animationFrameId) renderWinampVisuals();
    } else {
        app.classList.remove('winamp-active');
        if(animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if(canvasCtx && visualizerCanvas) {
            canvasCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        }
    }
}