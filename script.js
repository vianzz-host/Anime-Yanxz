// Konfigurasi
const PANEL_URL = 'https://mypanelkenji.rzhosts.my.id'; // Ganti dengan URL panel kamu
const SERVER_ID = '103'; // Ganti dengan ID server di Pterodactyl
const API_KEY = 'ptlc_PtwKh0uSkAglQz14DBqFsPrtDU3nKPQLgmeSRdXakqw';

let currentView = 'home';
let currentAnime = null;
let currentEpisodeIndex = null;
let animeList = [];

// ============ API CALLS ============

// Fetch data anime dari panel
async function fetchAnimeData() {
    try {
        // Ambil data dari endpoint API yang disediakan server.js
        const response = await fetch(`${PANEL_URL}/api/anime`);
        if (!response.ok) throw new Error('Gagal mengambil data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching anime:', error);
        return [];
    }
}

// Get video URL
function getVideoUrl(animeName, fileName) {
    return `${PANEL_URL}/api/video/${encodeURIComponent(animeName)}/${encodeURIComponent(fileName)}`;
}

// ============ RENDER FUNCTIONS ============

// Render Home
function renderHome() {
    currentView = 'home';
    document.getElementById('backBtn').style.display = 'none';
    
    const main = document.getElementById('mainContent');
    
    if (animeList.length === 0) {
        main.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎬</div>
                <p>Belum ada anime</p>
                <p style="font-size:12px;margin-top:8px;color:rgba(255,255,255,0.3);">
                    Tambahkan via bot Telegram
                </p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="anime-grid">';
    animeList.forEach(anime => {
        const thumbnailUrl = anime.thumbnail ? 
            `${PANEL_URL}${anime.thumbnail}` : 
            `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="169" viewBox="0 0 300 169"><rect width="300" height="169" fill="%231a1a2e"/><text x="150" y="85" font-family="Arial" font-size="20" fill="%23ff6b9d" text-anchor="middle">${anime.title}</text></svg>`;
        
        html += `
            <div class="anime-card" data-anime="${anime.title}">
                <img src="${thumbnailUrl}" alt="${anime.title}" class="anime-thumbnail" 
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22169%22><rect width=%22300%22 height=%22169%22 fill=%22%231a1a2e%22/><text x=%22150%22 y=%2285%22 font-family=%22Arial%22 font-size=%2220%22 fill=%22%23ff6b9d%22 text-anchor=%22middle%22>${anime.title}</text></svg>'">
                <h3>${anime.title}</h3>
                <div class="episode-count">${anime.episodes.length} Episode</div>
            </div>
        `;
    });
    html += '</div>';
    main.innerHTML = html;
    
    // Event listeners
    document.querySelectorAll('.anime-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.dataset.anime;
            const anime = animeList.find(a => a.title === title);
            if (anime) renderAnimeDetail(anime);
        });
    });
}

// Render Anime Detail
function renderAnimeDetail(anime) {
    currentView = 'detail';
    currentAnime = anime;
    document.getElementById('backBtn').style.display = 'flex';
    
    const main = document.getElementById('mainContent');
    const thumbnailUrl = anime.thumbnail ? 
        `${PANEL_URL}${anime.thumbnail}` : 
        `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270"><rect width="480" height="270" fill="%231a1a2e"/><text x="240" y="135" font-family="Arial" font-size="24" fill="%23ff6b9d" text-anchor="middle">${anime.title}</text></svg>`;
    
    let html = `
        <div style="margin-bottom:16px;">
            <img src="${thumbnailUrl}" alt="${anime.title}" 
                 style="width:100%;border-radius:14px;aspect-ratio:16/9;object-fit:cover;"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22480%22 height=%22270%22><rect width=%22480%22 height=%22270%22 fill=%22%231a1a2e%22/><text x=%22240%22 y=%22135%22 font-family=%22Arial%22 font-size=%2224%22 fill=%22%23ff6b9d%22 text-anchor=%22middle%22>${anime.title}</text></svg>'">
            <h2 style="margin-top:12px;font-size:20px;">${anime.title}</h2>
            <p style="color:rgba(255,255,255,0.4);font-size:14px;">${anime.episodes.length} Episode</p>
        </div>
        <div class="episode-list">
    `;
    
    if (anime.episodes.length === 0) {
        html += `
            <div style="text-align:center;padding:30px 0;color:rgba(255,255,255,0.3);">
                <p>Belum ada episode</p>
                <p style="font-size:12px;margin-top:8px;">Tambahkan via bot Telegram</p>
            </div>
        `;
    } else {
        anime.episodes.forEach((ep, index) => {
            html += `
                <div class="episode-item" data-index="${index}">
                    <div class="episode-title">${ep.title}</div>
                    <div class="episode-duration">▶ Klik untuk putar</div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    main.innerHTML = html;
    
    document.querySelectorAll('.episode-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            renderVideoPlayer(anime, index);
        });
    });
}

// Render Video Player
function renderVideoPlayer(anime, episodeIndex) {
    currentView = 'player';
    currentEpisodeIndex = episodeIndex;
    document.getElementById('backBtn').style.display = 'flex';
    
    const episode = anime.episodes[episodeIndex];
    const videoUrl = getVideoUrl(anime.title, episode.fileName);
    
    const main = document.getElementById('mainContent');
    main.innerHTML = `
        <div class="video-container">
            <video id="videoPlayer" controls autoplay playsinline>
                <source src="${videoUrl}" type="video/mp4">
                Browser tidak mendukung video.
            </video>
        </div>
        <div class="video-info">
            <h2>${episode.title}</h2>
            <div class="anime-title">${anime.title}</div>
        </div>
    `;
    
    const video = document.getElementById('videoPlayer');
    if (video) {
        // Load last position
        const lastPosition = localStorage.getItem(`lastWatch_${anime.title}_${episodeIndex}`);
        if (lastPosition) {
            video.currentTime = parseFloat(lastPosition);
        }
        
        // Save position
        video.addEventListener('timeupdate', () => {
            if (!video.paused && video.currentTime > 0) {
                localStorage.setItem(`lastWatch_${anime.title}_${episodeIndex}`, video.currentTime.toString());
            }
        });
        
        // Clear position when ended
        video.addEventListener('ended', () => {
            localStorage.removeItem(`lastWatch_${anime.title}_${episodeIndex}`);
        });
    }
}

// ============ NAVIGATION ============

document.getElementById('backBtn').addEventListener('click', () => {
    if (currentView === 'player') {
        if (currentAnime) {
            renderAnimeDetail(currentAnime);
        } else {
            renderHome();
        }
    } else if (currentView === 'detail') {
        renderHome();
    } else {
        renderHome();
    }
});

// ============ INITIALIZE ============

async function init() {
    try {
        const data = await fetchAnimeData();
        animeList = data;
        renderHome();
    } catch (error) {
        console.error('Init error:', error);
        document.getElementById('mainContent').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>Gagal memuat data</p>
                <p style="font-size:12px;margin-top:8px;color:rgba(255,255,255,0.3);">
                    Pastikan panel terhubung
                </p>
                <button onclick="init()" style="margin-top:16px;padding:8px 24px;background:#ff6b9d;border:none;border-radius:8px;color:#fff;font-weight:600;cursor:pointer;">
                    Coba Lagi
                </button>
            </div>
        `;
    }
}

// Auto refresh setiap 30 detik
setInterval(async () => {
    if (currentView === 'home') {
        const data = await fetchAnimeData();
        animeList = data;
        renderHome();
    }
}, 30000);

// Start
init();
