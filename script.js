// ==========================================
// PANDUAN OWNER: DATA ANIME
// ==========================================
const animeData = [
    {
        id: 1, // ID Harus Unik tiap anime untuk sistem history
        judul: "One Piece Eisode 517-573",
        thumbnail: "https://placehold.co/400x600/1f2833/66fcf1?text=One Piece",
        episodes: [
            { idEps: 1, eps: "Episode 01", url: "https://files.catbox.moe/wf7jvb.mp4" },
            { idEps: 2, eps: "Episode 02", url: "https://files.catbox.moe/wf7jvb.mp4" },
            { idEps: 3, eps: "Episode 03", url: "https://pixeldrain.com/api/file/cfYG3Woz?download" }
        ]
    },
    {
        id: 2,
        judul: "Naruto SD",
        thumbnail: "https://placehold.co/400x600/1f2833/66fcf1?text=Naruto SD",
        episodes: [
            { idEps: 11, eps: "Episode 11", url: "https://storage.to/sZKNre3AM" },
            { idEps: 12, eps: "Episode 12", url: "https://files.catbox.moe/wrp3gp.mp4" },
            { idEps: 13, eps: "Episode 13", url: "https://files.catbox.moe/ekdqkk.mp4" },
            { idEps: 14, eps: "Episode 14", url: "https://files.catbox.moe/448n1v.mp4" },
            { idEps: 15, eps: "Episode 15", url: "https://files.catbox.moe/koi9yg.mp4" }
        ]
    },
    {
        id: 3,
        judul: "JJK",
        thumbnail: "https://placehold.co/400x600/1f2833/66fcf1?text=JJK",
        episodes: [
            { idEps: 1, eps: "Episode 01", url: "https://files.fm/f/azmr68zvxv" }
        ]
    }
];

// ==========================================
// SISTEM ENGINE CORE (AUTO HISTORY & AUTO PLAY)
// ==========================================

const katalogPage = document.getElementById('katalog-page');
const detailPage = document.getElementById('detail-page');
const animeContainer = document.getElementById('anime-container');
const episodeContainer = document.getElementById('episode-container');
const videoPlayer = document.getElementById('video-player');
const currentTitle = document.getElementById('current-title');

let activeAnimeId = null;
let activeEpsId = null;

// Mengonversi detik ke format Menit:Detik yang rapi
function formatWaktu(detik) {
    const m = Math.floor(detik / 60).toString().padStart(2, '0');
    const s = Math.floor(detik % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Render katalog utama dan membaca data history dari browser
function renderKatalog() {
    animeContainer.innerHTML = "";
    
    // Ambil data history tersimpan
    const historyData = JSON.parse(localStorage.getItem('anime_history')) || {};

    animeData.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        
        // Cek apakah ada history tontonan aktif khusus untuk anime ini
        let historyHTML = '';
        if (historyData[anime.id]) {
            const h = historyData[anime.id];
            historyHTML = `<div class="history-badge">Terakhir ditonton:<br><b>${h.epsName} (${formatWaktu(h.time)})</b></div>`;
        }

        card.innerHTML = `
            <img src="${anime.thumbnail}" alt="${anime.judul}">
            <div class="anime-info">
                <h4>${anime.judul}</h4>
                ${historyHTML}
            </div>
        `;
        card.onclick = () => openAnimeDetail(anime.id);
        animeContainer.appendChild(card);
    });
}

// Membuka Detail Anime
function openAnimeDetail(animeId) {
    const anime = animeData.find(a => a.id === animeId);
    if (!anime) return;

    activeAnimeId = animeId;
    katalogPage.classList.remove('active');
    detailPage.classList.add('active');
    
    episodeContainer.innerHTML = "";
    
    // Memuat daftar tombol episode
    anime.episodes.forEach(episode => {
        const btn = document.createElement('button');
        btn.className = 'btn-episode';
        btn.id = `btn-eps-${episode.idEps}`;
        btn.innerText = episode.eps;
        btn.onclick = () => playVideo(episode.url, `${anime.judul} - ${episode.eps}`, episode.idEps, 0);
        episodeContainer.appendChild(btn);
    });

    // SISTEM AUTO-RESUME JIKA ADA HISTORY
    const historyData = JSON.parse(localStorage.getItem('anime_history')) || {};
    if (historyData[animeId]) {
        const saved = historyData[animeId];
        // Cari apakah episode di history masih ada disediakan oleh owner
        const targetEps = anime.episodes.find(e => e.idEps === saved.epsId);
        
        if (targetEps) {
            playVideo(targetEps.url, `${anime.judul} - ${targetEps.eps}`, targetEps.idEps, saved.time);
            return;
        }
    }

    // Jika tidak ada history, putar episode pertama secara default dari awal (detik 0)
    if(anime.episodes.length > 0) {
        playVideo(anime.episodes[0].url, `${anime.judul} - ${anime.episodes[0].eps}`, anime.episodes[0].idEps, 0);
    }
}

// Memutar Video secara otomatis & Melompat ke menit/detik history
function playVideo(url, title, epsId, startTime) {
    activeEpsId = epsId;
    
    document.querySelectorAll('.btn-episode').forEach(b => b.classList.remove('active'));
    const currentBtn = document.getElementById(`btn-eps-${epsId}`);
    if(currentBtn) currentBtn.classList.add('active');

    currentTitle.innerText = title;
    videoPlayer.src = url;
    videoPlayer.load();
    
    // Set penanda waktu awal (history) jika ada
    videoPlayer.currentTime = startTime;
    
    videoPlayer.play().catch(error => {
        console.log("Autoplay memerlukan interaksi awal pada beberapa jenis device.");
    });
}

// EVENT LISTENER: Menyimpan data waktu menonton secara real-time ke LocalStorage browser
videoPlayer.addEventListener('timeupdate', () => {
    if (!activeAnimeId || !activeEpsId || videoPlayer.currentTime === 0) return;
    
    const anime = animeData.find(a => a.id === activeAnimeId);
    const episode = anime.episodes.find(e => e.idEps === activeEpsId);
    
    if (anime && episode) {
        const historyData = JSON.parse(localStorage.getItem('anime_history')) || {};
        
        // Simpan data koordinat nonton berdasarkan ID Anime
        historyData[activeAnimeId] = {
            animeId: activeAnimeId,
            epsId: activeEpsId,
            epsName: episode.eps,
            time: videoPlayer.currentTime // Menyimpan detik berjalan
        };
        
        localStorage.setItem('anime_history', JSON.stringify(historyData));
    }
});

// Tombol Kembali & refresh ulang halaman katalog biar badge history terupdate
function backToKatalog() {
    videoPlayer.pause();
    detailPage.classList.remove('active');
    katalogPage.classList.add('active');
    renderKatalog(); // Reset katalog agar memuat tulisan "Terakhir ditonton" terbaru
}

// Load aplikasi pertama kali
window.onload = renderKatalog;
