// --- 1. DỮ LIỆU & LƯU TRỮ ---

// BẠN SỬA DANH SÁCH BÀI HÁT TẠI ĐÂY
const defaultSongs = [
    {
        id: 1,
        title: "Christmas",
        artist: "DoThy",
        cover: "[https://i.imgur.com/tWzvF8A.jpeg](https://i.imgur.com/tWzvF8A.jpeg)",
        url: "[https://github.com/iamsonnk4/upanhvn/releases/download/1/Louisvuiton.Christmas.mp3](https://github.com/iamsonnk4/upanhvn/releases/download/1/Louisvuiton.Christmas.mp3)",
        duration: "175:13",
        isHidden: false
    },
    {
        id: 2,
        title: "Nhạc Demo 2",
        artist: "SoundHelix",
        cover: "[https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop](https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop)",
        url: "[https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3](https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3)",
        duration: "7:05",
        isHidden: false
    }
];

const STORAGE_KEY = 'zingify_songs_github_v1'; 
let allSongs = [];

function loadData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            allSongs = JSON.parse(data);
        } else {
            allSongs = [...defaultSongs];
        }
    } catch (error) {
        console.error("Lỗi đọc dữ liệu:", error);
        allSongs = [...defaultSongs];
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allSongs));
    } catch (error) {
        console.error("Lỗi lưu dữ liệu:", error);
    }
}

// --- 2. BIẾN TOÀN CỤC ---
let playlist = []; 
let currentIndex = 0;
let isPlaying = false;

// DOM Elements
const audio = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const heroPlayBtn = document.getElementById('hero-play-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');

// Helper function to safely play audio on iOS
function safePlay() {
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // Playback started successfully
            isPlaying = true;
            updatePlayIcons('pause');
        }).catch(error => {
            // Auto-play was prevented or playback failed
            console.error("Phát nhạc thất bại (có thể do chặn autoplay trên iOS):", error);
            isPlaying = false;
            updatePlayIcons('play');
        });
    }
}

// --- 3. LOGIC KHỞI TẠO (INIT) ---
function init() {
    loadData();
    if (!Array.isArray(allSongs)) allSongs = [];
    allSongs = allSongs.map(s => ({...s, isHidden: s.isHidden || false}));
    
    updatePlaylist();
    if (playlist.length > 0) {
        // Không gọi loadSong(0) ngay lập tức để tránh tranh chấp tài nguyên khi chưa tương tác
        // Chỉ hiển thị thông tin bài hát đầu tiên
        const firstSong = playlist[0];
        updateUI(firstSong);
        // Load nhẹ để chuẩn bị (tùy browser)
        if(audio.src !== firstSong.url) audio.src = firstSong.url;
    } else {
        showEmptyState();
    }
    
    if(window.lucide) lucide.createIcons();
}

function updateUI(song) {
    document.getElementById('hero-img').src = song.cover;
    document.getElementById('mini-cover').src = song.cover;
    document.getElementById('hero-title').innerText = song.title;
    document.getElementById('mini-title').innerText = song.title;
    document.getElementById('hero-artist').innerText = song.artist;
    document.getElementById('mini-artist').innerText = song.artist;
    document.getElementById('hero-duration').innerText = song.duration;
}

function updatePlaylist() {
    playlist = allSongs.filter(song => !song.isHidden);
    if (currentIndex >= playlist.length) currentIndex = 0;
    renderSongList();
}

// --- 4. CÁC HÀM QUẢN LÝ (ADMIN) ---
function openAdminModal() {
    document.getElementById('admin-modal').classList.remove('hidden');
    renderAdminSongList();
}

function closeAdminModal() {
    document.getElementById('admin-modal').classList.add('hidden');
}

function renderAdminSongList() {
    const list = document.getElementById('admin-song-list');
    list.innerHTML = '';
    
    if(allSongs.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-zinc-500">Chưa có bài hát nào</td></tr>';
        return;
    }
    
    allSongs.forEach((song, index) => {
        const html = `
            <tr class="hover:bg-zinc-800/50 transition group">
                <td class="px-4 py-3">${index + 1}</td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        <img src="${song.cover}" class="w-8 h-8 rounded object-cover">
                        <div class="min-w-0">
                            <div class="font-medium text-white truncate max-w-[150px]">${song.title}</div>
                            <div class="text-xs text-zinc-500">${song.duration}</div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 text-center">
                    <input type="checkbox" 
                        class="w-5 h-5 accent-emerald-500 cursor-pointer rounded" 
                        ${!song.isHidden ? 'checked' : ''} 
                        onchange="toggleSongVisibility(${index})"
                        title="${song.isHidden ? 'Đang ẩn' : 'Đang hiện'}"
                    >
                </td>
                <td class="px-4 py-3 text-center">
                    <button onclick="deleteSong(${index})" class="text-zinc-500 hover:text-red-500 transition p-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
        list.insertAdjacentHTML('beforeend', html);
    });
    if(window.lucide) lucide.createIcons();
}

window.toggleSongVisibility = function(realIndex) {
    allSongs[realIndex].isHidden = !allSongs[realIndex].isHidden;
    saveData();
    updatePlaylist();
    
    if (allSongs[realIndex].isHidden && isPlaying) {
            if(playlist.length > 0) loadSong(0);
            else {
                audio.pause();
                showEmptyState();
            }
    }
};

window.addNewSong = function() {
    const title = document.getElementById('input-title').value;
    const artist = document.getElementById('input-artist').value;
    const cover = document.getElementById('input-cover').value;
    const url = document.getElementById('input-url').value;

    if(!title || !url) {
        alert("Cần nhập tên và link nhạc!");
        return;
    }

    allSongs.push({
        id: Date.now(),
        title, 
        artist: artist || "Unknown",
        cover: cover || "[https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop](https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop)",
        url,
        duration: "0:00", 
        isHidden: false
    });
    
    saveData();
    updatePlaylist();
    renderAdminSongList();
    
    document.getElementById('input-title').value = "";
    document.getElementById('input-url').value = "";
    
    alert("Đã thêm! (Lưu ý: Chỉ bạn mới thấy bài này, để hiện trên Github hãy sửa code defaultSongs)");
};

window.deleteSong = function(realIndex) {
    if(confirm('Xóa vĩnh viễn bài này?')) {
        allSongs.splice(realIndex, 1);
        saveData();
        updatePlaylist();
        renderAdminSongList();
        
        if(playlist.length > 0) {
            loadSong(0);
        } else {
            audio.pause();
            showEmptyState();
        }
    }
};

window.resetDefaultSongs = function() {
    if(confirm("Khôi phục danh sách gốc (như trong code)?")) {
        allSongs = [...defaultSongs];
        saveData();
        updatePlaylist();
        renderAdminSongList();
        if(playlist.length > 0) loadSong(0);
        else showEmptyState();
        alert("Đã khôi phục danh sách gốc!");
    }
};

// --- 5. PLAYER UI LOGIC ---
function showEmptyState() {
    document.getElementById('hero-title').innerText = "Chưa có bài hát";
    document.getElementById('hero-artist').innerText = "...";
    document.getElementById('hero-duration').innerText = "";
    document.getElementById('hero-img').src = "[https://via.placeholder.com/300/18181b/FFFFFF/?text=Music](https://via.placeholder.com/300/18181b/FFFFFF/?text=Music)"; 
    document.getElementById('song-list').innerHTML = '<p class="text-zinc-500 p-8 col-span-3 text-center border-2 border-dashed border-zinc-800 rounded-xl">Danh sách trống trơn.</p>';
    
    document.getElementById('mini-title').innerText = "...";
    document.getElementById('mini-artist').innerText = "...";
    document.getElementById('mini-cover').src = "[https://via.placeholder.com/100/18181b/FFFFFF/?text=M](https://via.placeholder.com/100/18181b/FFFFFF/?text=M)";
}

function renderSongList() {
    const container = document.getElementById('song-list');
    container.innerHTML = '';
    
    if (playlist.length === 0) {
        showEmptyState();
        return;
    }

    playlist.forEach((song, index) => {
        const isActive = index === currentIndex;
        const html = `
            <div onclick="playSongByIndex(${index})" class="flex items-center gap-4 p-3 rounded-md cursor-pointer transition group ${isActive ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}">
                <div class="relative w-12 h-12 flex-shrink-0">
                    <img src="${song.cover}" class="w-full h-full object-cover rounded">
                    ${isActive && isPlaying ? '<div class="absolute inset-0 bg-black/40 flex items-center justify-center"><div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div></div>' : ''}
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold truncate ${isActive ? 'text-emerald-500' : 'text-white'}">${song.title}</h4>
                    <p class="text-xs text-zinc-400 truncate">${song.artist}</p>
                </div>
                <span class="text-xs text-zinc-500">${song.duration}</span>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

window.playSongByIndex = function(index) {
    currentIndex = index;
    loadSong(currentIndex);
    safePlay(); // Sử dụng hàm safePlay để xử lý lỗi trên iOS
};

function loadSong(index) {
    if (playlist.length === 0) return;
    const song = playlist[index];
    
    if (audio.src !== song.url) {
        audio.src = song.url;
        audio.load(); // BẮT BUỘC VỚI IPHONE: Phải gọi load() sau khi đổi src
    }

    updateUI(song);
    renderSongList();
}

// --- 6. AUDIO EVENTS ---
audio.onloadedmetadata = function() {
    const duration = audio.duration;
    if (duration && duration !== Infinity) {
        const formatted = formatTime(duration);
        totalDurationEl.innerText = formatted;
        
        const currentSongData = playlist[currentIndex];
        if(currentSongData) {
            const realSongIndex = allSongs.findIndex(s => s.id === currentSongData.id);
            if (realSongIndex !== -1) {
                if (allSongs[realSongIndex].duration === "0:00" || allSongs[realSongIndex].duration === "Unknown") {
                    allSongs[realSongIndex].duration = formatted;
                    saveData();
                    renderSongList();
                    renderAdminSongList(); 
                }
            }
        }
    }
};

audio.ontimeupdate = function() {
    if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        progressBar.value = pct;
        currentTimeEl.innerText = formatTime(audio.currentTime);
    }
};

audio.onended = function() {
    nextSong();
};

// --- CONTROLS ---
function togglePlay() {
    if(playlist.length === 0) return;
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        updatePlayIcons('play');
    } else {
        safePlay(); // Sử dụng safePlay
    }
    renderSongList();
}

function updatePlayIcons(state) {
    const icon = state === 'pause' ? 'pause' : 'play';
    const iconHtml = `<i data-lucide="${icon}" class="w-4 h-4 fill-black ml-${state==='play'?0.5:0}"></i>`;
    const bigIconHtml = `<i data-lucide="${icon}" class="fill-black ml-${state==='play'?1:0}"></i>`;
    
    playPauseBtn.innerHTML = iconHtml;
    heroPlayBtn.innerHTML = bigIconHtml;
    
    if(window.lucide) lucide.createIcons();
}

function nextSong() {
    if(playlist.length === 0) return;
    currentIndex = (currentIndex + 1) % playlist.length;
    loadSong(currentIndex);
    safePlay();
}

function prevSong() {
    if(playlist.length === 0) return;
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadSong(currentIndex);
    safePlay();
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

// --- BINDING EVENTS ---
playPauseBtn.onclick = togglePlay;
heroPlayBtn.onclick = togglePlay;
document.getElementById('next-btn').onclick = nextSong;
document.getElementById('prev-btn').onclick = prevSong;

progressBar.oninput = function() {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
};

document.getElementById('volume-bar').oninput = function(e) {
    audio.volume = e.target.value;
};

const sidebar = document.getElementById('sidebar');
document.getElementById('open-sidebar').onclick = () => sidebar.classList.remove('-translate-x-full');
document.getElementById('close-sidebar').onclick = () => sidebar.classList.add('-translate-x-full');

// CHẠY INIT
window.onload = init;
