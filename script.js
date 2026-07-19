// ==========================================
// KONFIGURASI BINDING SERVER PTERODACTYL
// ==========================================
const BASE_URL = "https://lynzzofficial:2073"; // <-- GANTI DENGAN IP & PORT PANEL KAMU!

const katalogPage = document.getElementById('katalog-page');
const detailPage = document.getElementById('detail-page');
const animeContainer = document.getElementById('anime-container');
const episodeContainer = document.getElementById('episode-container');
const videoPlayer = document.getElementById('video-player');
const currentTitle = document.getElementById('current-title');

let animeData = [];
let activeAnimeId = null;
let activeEpsId = null;

async function fetchAnimeData() {
    try {
        const response = await fetch(`${BASE_URL}/api/anime?v=${new Date().getTime()}`);
        animeData = await response.json();
        renderKatalog();
    } catch (error) {
        console.error("Gagal memuat data:", error);
        animeContainer.innerHTML = "<p style='color:red; text-align:center;'>Gagal terhubung ke server penyimpanan Pterodactyl.</p>";
    }
}

function formatWaktu(detik) {
    const m = Math.floor(detik / 60).toString().padStart(2, '0');
    const s = Math.floor(detik % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function renderKatalog() {
    animeContainer.innerHTML = "";
    const historyData = JSON.parse(localStorage.getItem('anime_history')) || {};

    animeData.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        
        let historyHTML = '';
        if (historyData[anime.id]) {
            const h = historyData[anime.id];
            historyHTML = `<div class="history-badge">Terakhir ditonton:<br><b>${h.epsName} (${formatWaktu(h.time)})</b></div>`;
        }

        // Link thumbnail digabung secara absolut dengan BASE_URL server Pterodactyl
        const fullThumbnailUrl = anime.thumbnail.startsWith('http') ? anime.thumbnail : `${BASE_URL}${anime.thumbnail}`;

        card.innerHTML = `
            <img src="${fullThumbnailUrl}" alt="${anime.judul}">
            <div class="anime-info">
                <h4>${anime.judul}</h4>
                ${historyHTML}
            </div>
        `;
        card.onclick = () => openAnimeDetail(anime.id);
        animeContainer.appendChild(card);
    });
}

function openAnimeDetail(animeId) {
    const anime = animeData.find(a => a.id === animeId);
    if (!anime) return;

    activeAnimeId = animeId;
    katalogPage.classList.remove('active');
    detailPage.classList.add('active');
    
    episodeContainer.innerHTML = "";
    
    anime.episodes.forEach(episode => {
        const btn = document.createElement('button');
        btn.className = 'btn-episode';
        btn.id = `btn-eps-${episode.idEps}`;
        btn.innerText = episode.eps;
        
        // Link video digabung secara absolut dengan BASE_URL server Pterodactyl
        const fullVideoUrl = episode.url.startsWith('http') ? episode.url : `${BASE_URL}${episode.url}`;
        
        btn.onclick = () => playVideo(fullVideoUrl, `${anime.judul} - ${episode.eps}`, episode.idEps, 0);
        episodeContainer.appendChild(btn);
    });

    const historyData = JSON.parse(localStorage.getItem('anime_history')) || {};
    if (historyData[animeId]) {
        const saved = historyData[animeId];
        const targetEps = anime.episodes.find(e => e.idEps === saved.epsId);
        
        if (targetEps) {
            const fullVideoUrl = targetEps.url.startsWith('http') ? targetEps.url : `${BASE_URL}${targetEps.url}`;
            playVideo(fullVideoUrl, `${anime.judul} - ${targetEps.eps}`, targetEps.idEps, saved.time);
            return;
        }
    }

    if(anime.episodes.length > 0) {
        const fullVideoUrl = anime.episodes[0].url.startsWith('http') ? anime.episodes[0].url : `${BASE_URL}${anime.episodes[0].url}`;
        playVideo(fullVideoUrl, `${anime.judul} - ${anime.episodes[0].eps}`, anime.episodes[0].idEps, 0);
    }
}

function playVideo(url, title, epsId, startTime) {
    activeEpsId = epsId;
    
    document.querySelectorAll('.btn-episode').forEach(b => b.classList.remove('active'));
    const currentBtn = document.getElementById(`btn-eps-${epsId}`);
    if(currentBtn) currentBtn.classList.add('active');

    currentTitle.innerText = title;
    videoPlayer.src = url;
    videoPlayer.load();
    videoPlayer.currentTime = startTime;
    
    videoPlayer.play().catch(error => {
        console.log("Autoplay diblokir oleh browser sebelum ada interaksi.");
    });
}

videoPlayer.addEventListener('timeupdate', () => {
    if (!activeAnimeId || !activeEpsId || videoPlayer.currentTime === 0) return;
    
    const anime = animeData.find(a => a.id === activeAnimeId);
    const episode = anime.episodes.find(e => e.idEps === activeEpsId);
    
    if (anime && episode) {
        const historyData = JSON.parse(localStorage.getItem('anime_history')) || {};
        historyData[activeAnimeId] = {
            animeId: activeAnimeId,
            epsId: activeEpsId,
            epsName: episode.eps,
            time: videoPlayer.currentTime
        };
        localStorage.setItem('anime_history', JSON.stringify(historyData));
    }
});

function backToKatalog() {
    videoPlayer.pause();
    detailPage.classList.remove('active');
    katalogPage.classList.add('active');
    renderKatalog();
}

window.onload = fetchAnimeData;
