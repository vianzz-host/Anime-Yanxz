// ==========================================
// KONFIGURASI API (DIPERBAIKI)
// ==========================================
// PENTING: Wajib tambahkan port server kamu (misal :2073) di ujung domain!
// Jika menggunakan IP, contoh: 'http://123.456.78.9:2073'
const API_URL = 'https://mypanelkenji.rzhosts.my.id:11272'; 

const API_KEY = 'ptlc_PtwKh0uSkAglQz14DBqFsPrtDU3nKPQLgmeSRdXakqw';

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
    
    const url = `${API_URL}${endpoint}`;
    console.log(`🌐 Fetching: ${url}`);
    
    try {
        const response = await fetch(url, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('❌ Fetch error:', error);
        throw error;
    }
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
        } else {
            statusBadge.innerHTML = `<span class="dot offline"></span> Offline (${response.status})`;
            return false;
        }
    } catch (error) {
        statusBadge.innerHTML = `<span class="dot offline"></span> Offline (Failed to connect)`;
        return false;
    }
}

// ==========================================
// RENDER KATALOG
// ==========================================
async function renderKatalog() {
    animeContainer.innerHTML = '<div class="loading">📡 Menghubungkan ke panel...</div>';
    
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
            
            // Format URL thumbnail agar mengarah ke endpoint backend jika berupa path local storage panel
            const thumbUrl = anime.thumbnail.startsWith('/anime') 
                ? `${API_URL}${anime.thumbnail}` 
                : anime.thumbnail;
            
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
                <img src="${thumbUrl}" alt="${anime.judul}" loading="lazy" onerror="this.src='https://placehold.co/400x600/1f2833/66fcf1?text=${encodeURIComponent(anime.judul)}'">
                <div class="anime-info">
                    <h4>${anime.judul}</h4>
                    <span style="font-size:11px;color:#66fcf1;">${anime.episodes?.length || 0} episode</span>
                    ${historyHTML}
                </div>
            `;
            card.onclick = () => openAnimeDetail(anime.id);
            animeContainer.appendChild(card);
        });
        
    } catch (error) {
        animeContainer.innerHTML = `
            <div class="error">
                ❌ Gagal memuat data dari panel.<br>
                Periksa apakah URL API atau port server di script.js sudah benar.<br><br>
                <button onclick="renderKatalog()" style="padding:10px 20px;background:#66fcf1;color:#0b0c10;border:none;border-radius:5px;cursor:pointer;">
                    🔄 Coba Lagi
                </button>
            </div>
        `;
    }
}

// ==========================================
// OPEN ANIME DETAIL
// ==========================================
function openAnimeDetail(animeId) {
    const anime = animeData.find(a => a.id === animeId);
    if (!anime) return alert('Anime tidak ditemukan!');

    activeAnimeId = animeId;
    katalogPage.classList.remove('active');
    detailPage.classList.add('active');
    episodeContainer.innerHTML = '';
    
    if (anime.episodes && anime.episodes.length > 0) {
        anime.episodes.forEach(episode => {
            const btn = document.createElement('button');
            btn.className = 'btn-episode';
            btn.id = `btn-eps-${episode.idEps}`;
            btn.innerText = episode.eps;
            
            // Format full video URL mengarah langsung ke server panel Pterodactyl
            const fullVideoUrl = `${API_URL}${episode.url}`;
            btn.onclick = () => playVideo(fullVideoUrl, `${anime.judul} - ${episode.eps}`, episode.idEps, 0);
            episodeContainer.appendChild(btn);
        });
        
        // Auto-resume jika ada history streaming sebelumnya
        const historyData = JSON.parse(localStorage.getItem('anime_history')) || {};
        if (historyData[animeId]) {
            const saved = historyData[animeId];
            const targetEps = anime.episodes.find(e => e.idEps === saved.epsId);
            if (targetEps) {
                playVideo(`${API_URL}${targetEps.url}`, `${anime.judul} - ${targetEps.eps}`, targetEps.idEps, saved.time);
                return;
            }
        }
        
        // Default putar episode 1
        playVideo(`${API_URL}${anime.episodes[0].url}`, `${anime.judul} - ${anime.episodes[0].eps}`, anime.episodes[0].idEps, 0);
    } else {
        episodeContainer.innerHTML = '<div style="color:#666;text-align:center;padding:20px;">Belum ada episode</div>';
        videoPlayer.src = '';
        currentTitle.innerText = anime.judul;
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
    videoPlayer.currentTime = startTime || 0;
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
    const episode = anime?.episodes?.find(e => e.idEps === activeEpsId);
    
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

function formatWaktu(detik) {
    if (!detik || isNaN(detik)) return '0:00';
    const m = Math.floor(detik / 60).toString().padStart(2, '0');
    const s = Math.floor(detik % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

window.onload = async () => {
    await checkPanelStatus();
    renderKatalog();
    setInterval(checkPanelStatus, 30000);
};
