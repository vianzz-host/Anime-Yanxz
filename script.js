// ==========================================
// KONFIGURASI API
// ==========================================
const API_URL = 'https://lynzzofficial.com'; // Ganti dengan URL Panel Anda
const API_KEY = 'ptlc_u2PHehrH1cHXkDkLrRuk8SxhJV0b2Y0aczN0KSu2us9'; // Sama dengan di server

// ==========================================
// STATE
// ==========================================
let animeData = [];
let activeAnimeId = null;
let activeEpsId = null;

// ==========================================
// DOM Elements
// ==========================================
const katalogPage = document.getElementById('katalog-page');
const detailPage = document.getElementById('detail-page');
const animeContainer = document.getElementById('anime-container');
const episodeContainer = document.getElementById('episode-container');
const videoPlayer = document.getElementById('video-player');
const currentTitle = document.getElementById('current-title');
const statusBadge = document.getElementById('panel-status');

// ==========================================
// API HELPER
// ==========================================
async function fetchAPI(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
        }
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        }
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
}

// ==========================================
// CHECK PANEL STATUS
// ==========================================
async function checkPanelStatus() {
    try {
        const response = await fetch(`${API_URL}/api/status`);
        if (response.ok) {
            const data = await response.json();
            statusBadge.innerHTML = `<span class="dot online"></span> Online (${data.animeCount} anime)`;
            return true;
        }
    } catch (error) {
        statusBadge.innerHTML = `<span class="dot offline"></span> Offline`;
        return false;
    }
}

// ==========================================
// RENDER KATALOG
// ==========================================
async function renderKatalog() {
    animeContainer.innerHTML = '<div class="loading">Memuat data...</div>';
    
    try {
        const result = await fetchAPI('/api/anime');
        animeData = result.data || [];
        
        if (animeData.length === 0) {
            animeContainer.innerHTML = `
                <div class="error">
                    ❌ Belum ada anime di database.<br>
                    Tambahkan melalui Telegram Bot!
                </div>
            `;
            return;
        }
        
        const historyData = JSON.parse(localStorage.getItem('anime_history')) || {};
        
        animeContainer.innerHTML = '';
        animeData.forEach(anime => {
            const card = document.createElement('div');
            card.className = 'anime-card';
            
            let historyHTML = '';
            if (historyData[anime.id]) {
                const h = historyData[anime.id];
                historyHTML = `
                    <div class="history-badge">
                        Terakhir ditonton:<br>
                        <b>${h.epsName} (${formatWaktu(h.time)})</b>
                    </div>
                `;
            }
            
            card.innerHTML = `
                <img src="${anime.thumbnail}" alt="${anime.judul}" loading="lazy">
                <div class="anime-info">
                    <h4>${anime.judul}</h4>
                    <span style="font-size:11px;color:#66fcf1;">${anime.episodes.length} episode</span>
                    ${historyHTML}
                </div>
            `;
            card.onclick = () => openAnimeDetail(anime.id);
            animeContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading anime:', error);
        animeContainer.innerHTML = `
            <div class="error">
                ❌ Gagal memuat data dari panel.<br>
                ${error.message}
            </div>
        `;
    }
}

// ==========================================
// OPEN ANIME DETAIL
// ==========================================
function openAnimeDetail(animeId) {
    const anime = animeData.find(a => a.id === animeId);
    if (!anime) return;

    activeAnimeId = animeId;
    katalogPage.classList.remove('active');
    detailPage.classList.add('active');
    
    episodeContainer.innerHTML = '';
    
    // Load episodes
    anime.episodes.forEach(episode => {
        const btn = document.createElement('button');
        btn.className = 'btn-episode';
        btn.id = `btn-eps-${episode.idEps}`;
        btn.innerText = episode.eps;
        btn.onclick = () => playVideo(episode.url, `${anime.judul} - ${episode.eps}`, episode.idEps, 0);
        episodeContainer.appendChild(btn);
    });

    // Auto-resume from history
    const historyData = JSON.parse(localStorage.getItem('anime_history')) || {};
    if (historyData[animeId]) {
        const saved = historyData[animeId];
        const targetEps = anime.episodes.find(e => e.idEps === saved.epsId);
        if (targetEps) {
            playVideo(targetEps.url, `${anime.judul} - ${targetEps.eps}`, targetEps.idEps, saved.time);
            return;
        }
    }

    // Play first episode
    if (anime.episodes.length > 0) {
        playVideo(anime.episodes[0].url, `${anime.judul} - ${anime.episodes[0].eps}`, anime.episodes[0].idEps, 0);
    }
}

// ==========================================
// PLAY VIDEO
// ==========================================
function playVideo(url, title, epsId, startTime) {
    activeEpsId = epsId;
    
    document.querySelectorAll('.btn-episode').forEach(b => b.classList.remove('active'));
    const currentBtn = document.getElementById(`btn-eps-${epsId}`);
    if(currentBtn) currentBtn.classList.add('active');

    currentTitle.innerText = title;
    videoPlayer.src = url;
    videoPlayer.load();
    videoPlayer.currentTime = startTime;
    videoPlayer.play().catch(() => {});
}

// ==========================================
// BACK TO KATALOG
// ==========================================
function backToKatalog() {
    videoPlayer.pause();
    detailPage.classList.remove('active');
    katalogPage.classList.add('active');
    renderKatalog();
}

// ==========================================
// SAVE HISTORY
// ==========================================
videoPlayer.addEventListener('timeupdate', () => {
    if (!activeAnimeId || !activeEpsId || videoPlayer.currentTime === 0) return;
    
    const anime = animeData.find(a => a.id === activeAnimeId);
    const episode = anime?.episodes.find(e => e.idEps === activeEpsId);
    
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

// ==========================================
// HELPERS
// ==========================================
function formatWaktu(detik) {
    const m = Math.floor(detik / 60).toString().padStart(2, '0');
    const s = Math.floor(detik % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// ==========================================
// INIT
// ==========================================
window.onload = async () => {
    await checkPanelStatus();
    renderKatalog();
    
    // Check status every 30 seconds
    setInterval(checkPanelStatus, 30000);
};
