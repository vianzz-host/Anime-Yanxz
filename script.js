// Konfigurasi
const PANEL_URL = 'https://mypanelkenji.rzhosts.my.id';
const API_KEY = 'ptlc_PtwKh0uSkAglQz14DBqFsPrtDU3nKPQLgmeSRdXakqw';

let currentView = 'home';
let currentAnime = null;
let currentEpisodeIndex = null;
let animeList = [];

// ============ API CALLS ============

async function fetchAnimeData() {
    try {
        const response = await fetch(`${PANEL_URL}/api/anime`);
        if (!response.ok) throw new Error('Gagal mengambil data');
        return await response.json();
    } catch (error) {
        console.error('Error fetching anime:', error);
        return [];
    }
}

async function addAnime(animeName) {
    try {
        const response = await fetch(`${PANEL_URL}/api/anime`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: animeName })
        });
        if (!response.ok) throw new Error('Gagal menambah anime');
        return await response.json();
    } catch (error) {
        console.error('Error adding anime:', error);
        throw error;
    }
}

async function deleteAnime(animeName) {
    try {
        const response = await fetch(`${PANEL_URL}/api/anime/${encodeURIComponent(animeName)}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Gagal menghapus anime');
        return await response.json();
    } catch (error) {
        console.error('Error deleting anime:', error);
        throw error;
    }
}

async function deleteEpisode(animeName, episodeIndex) {
    try {
        const response = await fetch(`${PANEL_URL}/api/anime/${encodeURIComponent(animeName)}/episode/${episodeIndex}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Gagal menghapus episode');
        return await response.json();
    } catch (error) {
        console.error('Error deleting episode:', error);
        throw error;
    }
}

function getVideoUrl(animeName, fileName) {
    return `${PANEL_URL}/api/video/${encodeURIComponent(animeName)}/${encodeURIComponent(fileName)}`;
}

// ============ TOAST ============

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ MODAL ============

function showModal(title, message, inputPlaceholder = '', confirmText = 'Konfirmasi', confirmCallback) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    overlay.innerHTML = `
        <div class="modal">
            <h2>${title}</h2>
            <p>${message}</p>
            ${inputPlaceholder ? `<input type="text" id="modalInput" placeholder="${inputPlaceholder}">` : ''}
            <div class="modal-buttons">
                <button class="cancel" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                <button class="confirm" id="confirmBtn">${confirmText}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const confirmBtn = overlay.querySelector('#confirmBtn');
    const input = overlay.querySelector('#modalInput');
    
    if (input) {
        input.focus();
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') confirmBtn.click();
        });
    }
    
    confirmBtn.addEventListener('click', () => {
        const value = input ? input.value.trim() : true;
        if (input && !value) {
            showToast('Harap isi data terlebih dahulu!', 'error');
            return;
        }
        overlay.remove();
        if (confirmCallback) confirmCallback(value);
    });
}

function showAnimeListModal(title, message, animeList, onSelect) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    let itemsHtml = '';
    animeList.forEach(anime => {
        itemsHtml += `
            <div class="anime-select-item" data-anime="${anime.title}">
                <span>${anime.title}</span>
                <span style="color:rgba(255,255,255,0.3);font-size:12px;">${anime.episodes.length} episode</span>
            </div>
        `;
    });
    
    overlay.innerHTML = `
        <div class="modal">
            <h2>${title}</h2>
            <p>${message}</p>
            <div style="max-height:300px;overflow-y:auto;margin-bottom:16px;">
                ${itemsHtml}
            </div>
            <div class="modal-buttons">
                <button class="cancel" onclick="this.closest('.modal-overlay').remove()">Batal</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.querySelectorAll('.anime-select-item').forEach(item => {
        item.addEventListener('click', () => {
            const animeTitle = item.dataset.anime;
            overlay.remove();
            if (onSelect) onSelect(animeTitle);
        });
    });
}

// ============ RENDER FUNCTIONS ============

function renderHome() {
    currentView = 'home';
    document.getElementById('backBtn').style.display = 'none';
    
    const main = document.getElementById('mainContent');
    
    let html = `
        <div style="display:flex;gap:10px;margin-bottom:16px;">
            <button class="action-btn primary" onclick="handleAddAnime()">➕ Tambah Anime</button>
            <button class="action-btn danger" onclick="handleDeleteAnime()">➖ Hapus Anime</button>
        </div>
    `;
    
    if (animeList.length === 0) {
        html += `
            <div class="empty-state">
                <div class="empty-icon">🎬</div>
                <p>Belum ada anime</p>
                <p style="font-size:12px;margin-top:8px;color:rgba(255,255,255,0.3);">
                    Klik "Tambah Anime" untuk memulai
                </p>
            </div>
        `;
        main.innerHTML = html;
        return;
    }
    
    html += '<div class="anime-grid">';
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
    
    document.querySelectorAll('.anime-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.dataset.anime;
            const anime = animeList.find(a => a.title === title);
            if (anime) renderAnimeDetail(anime);
        });
    });
}

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
            
            <div class="action-buttons">
                <button class="action-btn primary" onclick="showToast('Gunakan bot Telegram untuk upload video', 'success')">
                    📤 Upload Video
                </button>
                <button class="action-btn secondary" onclick="showToast('Gunakan bot Telegram untuk upload thumbnail', 'success')">
                    🖼️ Upload Thumbnail
                </button>
            </div>
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
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="flex:1;">
                            <div class="episode-title">${ep.title}</div>
                            <div class="episode-duration">▶ Klik untuk putar</div>
                        </div>
                        <button class="action-btn danger" style="padding:4px 12px;font-size:12px;min-width:auto;" 
                                onclick="event.stopPropagation();handleDeleteEpisode('${anime.title}', ${index})">
                            🗑️
                        </button>
                    </div>
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
        const lastPosition = localStorage.getItem(`lastWatch_${anime.title}_${episodeIndex}`);
        if (lastPosition) {
            video.currentTime = parseFloat(lastPosition);
        }
        
        video.addEventListener('timeupdate', () => {
            if (!video.paused && video.currentTime > 0) {
                localStorage.setItem(`lastWatch_${anime.title}_${episodeIndex}`, video.currentTime.toString());
            }
        });
        
        video.addEventListener('ended', () => {
            localStorage.removeItem(`lastWatch_${anime.title}_${episodeIndex}`);
        });
    }
}

// ============ HANDLE ACTIONS ============

function handleAddAnime() {
    showModal(
        '➕ Tambah Anime Baru',
        'Masukkan nama anime yang ingin ditambahkan:',
        'Nama anime...',
        'Tambah',
        async (animeName) => {
            try {
                if (animeList.find(a => a.title.toLowerCase() === animeName.toLowerCase())) {
                    showToast(`Anime "${animeName}" sudah ada!`, 'error');
                    return;
                }
                
                const result = await addAnime(animeName);
                if (result.success) {
                    showToast(`✅ Anime "${animeName}" berhasil ditambahkan!`, 'success');
                    await refreshData();
                }
            } catch (error) {
                showToast(`❌ Gagal menambah anime: ${error.message}`, 'error');
            }
        }
    );
}

function handleDeleteAnime() {
    if (animeList.length === 0) {
        showToast('Belum ada anime untuk dihapus', 'error');
        return;
    }
    
    showAnimeListModal(
        '➖ Hapus Anime',
        'Pilih anime yang ingin dihapus:',
        animeList,
        async (animeTitle) => {
            showModal(
                '⚠️ Konfirmasi Hapus',
                `Yakin ingin menghapus anime "${animeTitle}"?\nSemua episode akan terhapus!`,
                '',
                'Ya, Hapus',
                async () => {
                    try {
                        const result = await deleteAnime(animeTitle);
                        if (result.success) {
                            showToast(`✅ Anime "${animeTitle}" berhasil dihapus!`, 'success');
                            await refreshData();
                        }
                    } catch (error) {
                        showToast(`❌ Gagal menghapus anime: ${error.message}`, 'error');
                    }
                }
            );
        }
    );
}

function handleDeleteEpisode(animeName, episodeIndex) {
    const anime = animeList.find(a => a.title === animeName);
    if (!anime) return;
    
    const episode = anime.episodes[episodeIndex];
    
    showModal(
        '🗑️ Hapus Episode',
        `Hapus episode "${episode.title}" dari "${animeName}"?`,
        '',
        'Ya, Hapus',
        async () => {
            try {
                const result = await deleteEpisode(animeName, episodeIndex);
                if (result.success) {
                    showToast(`✅ Episode berhasil dihapus!`, 'success');
                    await refreshData();
                    const updatedAnime = animeList.find(a => a.title === animeName);
                    if (updatedAnime) renderAnimeDetail(updatedAnime);
                }
            } catch (error) {
                showToast(`❌ Gagal menghapus episode: ${error.message}`, 'error');
            }
        }
    );
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

// ============ REFRESH DATA ============

async function refreshData() {
    const data = await fetchAnimeData();
    animeList = data;
    if (currentView === 'home') {
        renderHome();
    } else if (currentView === 'detail' && currentAnime) {
        const updatedAnime = animeList.find(a => a.title === currentAnime.title);
        if (updatedAnime) {
            renderAnimeDetail(updatedAnime);
        } else {
            renderHome();
        }
    }
}

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

setInterval(async () => {
    if (currentView === 'home') {
        const data = await fetchAnimeData();
        animeList = data;
        renderHome();
    }
}, 30000);

init();
