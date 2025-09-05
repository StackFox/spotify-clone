let isPlaying = false;
let isShuffled = false;
let currSong = null; // Change to store song object, not just filename
let songInfo = []; // Change from {} to []
let nextQueue = [];
let shuffledQueue = [];
let currentSongIndex = 0;
let loopMode = 0;
let currentObjectURL = null; // For cleaning up object URLs

// Get references to progress bar elements
const progressBar = document.querySelector('.progress-bar');
const progressFill = document.querySelector('.progress-fill');
const audio = document.getElementById('globalAudio');
let isDragging = false;

// Get references to DOM elements
const trackName = document.querySelector('.track-name');
const artistName = document.querySelector('.artist-name');

function playCurrentSong(fullFileName, songIndex) {
    const activeQueue = getActiveQueue();
    const song = activeQueue[songIndex];
    
    if (!song) {
        console.error('Song not found at index', songIndex);
        return;
    }

    // Clean up previous object URL
    if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
    }

    // Use File object if available
    if (song.file) {
        currentObjectURL = URL.createObjectURL(song.file);
        audio.src = currentObjectURL;
    } else {
        audio.src = `/songs/${encodeURIComponent(fullFileName)}`;
    }

    audio.play();
    isPlaying = true;
    currSong = song;

    // Update play button
    const playBtn = document.querySelector(".play-btn-player");
    if (playBtn) {
        playBtn.textContent = '⏸';
    }

    // Update track and artist names
    trackName.textContent = (fullFileName.split(' - ')[1] || '').replace(/\.mp3$/i, '');
    artistName.textContent = song.artist || fullFileName.split(' - ') || 'Unknown Artist';

    // FIX: Use the song's thumbnail directly instead of relying on DOM order
    updateAlbumCovers(song);

    // Update sidebar text content
    const songTitleRight = document.getElementById('songTitle');
    const artistNameRight = document.getElementById('artistName');
    if (songTitleRight) songTitleRight.innerHTML = trackName.textContent;
    if (artistNameRight) artistNameRight.innerHTML = artistName.textContent;

    // Highlight current card in trending section
    highlightCurrentCard(song);
}

function updateAlbumCovers(song) {
    const albumCover = document.querySelector('.album-cover');
    const sidebarAlbum = document.querySelector('.album-cover-right');

    if (song.thumbnail && albumCover) {
        // Create thumbnail element directly from song data
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.style.backgroundImage = song.thumbnail;
        thumbnailDiv.style.backgroundSize = 'cover';
        thumbnailDiv.style.backgroundPosition = 'center';
        thumbnailDiv.style.width = '100%';
        thumbnailDiv.style.height = '100%';
        thumbnailDiv.classList.add('in-album');

        albumCover.innerHTML = "";
        albumCover.appendChild(thumbnailDiv);
        albumCover.classList.add('has-image');
    }

    if (song.thumbnail && sidebarAlbum) {
        // Create sidebar thumbnail
        const sidebarThumbnail = document.createElement('div');
        sidebarThumbnail.style.backgroundImage = song.thumbnail;
        sidebarThumbnail.style.backgroundSize = 'cover';
        sidebarThumbnail.style.backgroundPosition = 'center';
        sidebarThumbnail.style.width = '100%';
        sidebarThumbnail.style.height = '100%';
        sidebarThumbnail.classList.add('sidebar-thumbnail');

        sidebarAlbum.innerHTML = "";
        sidebarAlbum.appendChild(sidebarThumbnail);
        sidebarAlbum.classList.add('has-image');
    }
}

// NEW: Separate function to highlight current card
function highlightCurrentCard(song) {
    // Find the correct card in trending section by matching song title
    const cards = document.querySelectorAll('.card-row .card');
    cards.forEach((card) => {
        const cardTitle = card.dataset.songTitle;
        if (cardTitle === song.title) {
            card.classList.add('playing');
        } else {
            card.classList.remove('playing');
        }
    });
}

// ADDED: Missing handleSongPlay function
function handleSongPlay(songIndex, song) {
    const activeQueue = isShuffled && shuffledQueue.length ? shuffledQueue : songInfo;
    currentSongIndex = songIndex;
    currSong = song;
    nextQueue = activeQueue.slice(currentSongIndex + 1);
    setQueue(nextQueue);
    playCurrentSong(song.title, songIndex);
}

function playSong() {
    const songItems = document.querySelectorAll('.song-item.playable');

    songItems.forEach((songItem, index) => {
        const fullFileName = songItem.dataset.fullFileName;

        songItem.addEventListener('click', () => {
            // Find the song in songInfo array
            const songObj = songInfo.find(s => s.title === fullFileName);
            currSong = songObj || { title: fullFileName };

            // Get the active queue (shuffled or normal)
            const activeQueue = isShuffled ? shuffledQueue : songInfo;

            // Find the current song's index in the active queue
            currentSongIndex = activeQueue.findIndex(song => song.title === fullFileName);

            // Set nextQueue from the active queue, starting after current song
            if (currentSongIndex !== -1) {
                nextQueue = activeQueue.slice(currentSongIndex + 1);
            } else {
                nextQueue = activeQueue.slice(index + 1);
                currentSongIndex = index;
            }

            setQueue(nextQueue);
            playCurrentSong(fullFileName, currentSongIndex);
        });
    });
}

function setQueue(nextQueue) {
    const queueContainer = document.querySelector('.queue-container');
    queueContainer.innerHTML = '';

    nextQueue.forEach((data) => {
        const queueItem = document.createElement('div');
        queueItem.classList.add('queue-item');

        const queueCover = document.createElement('div');
        queueCover.classList.add('queue-cover');
        queueCover.style.backgroundImage = data.thumbnail || 'url(default-cover.png)';

        const queueInfo = document.createElement('div');
        queueInfo.classList.add('queue-info');

        const queueTitle = document.createElement('div');
        queueTitle.classList.add('queue-title');
        queueTitle.textContent = (data.title.split(' - ')[1] || '').replace(/\.mp3$/i, '') || 'Unknown Title';

        const queueArtist = document.createElement('div');
        queueArtist.classList.add('queue-artist');
        queueArtist.textContent = data.artist || 'Unknown Artist';

        queueInfo.appendChild(queueTitle);
        queueInfo.appendChild(queueArtist);
        queueItem.appendChild(queueCover);
        queueItem.appendChild(queueInfo);
        queueContainer.appendChild(queueItem);
    });
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// FIXED: Shuffle logic to work with array
document.querySelector('#shuffle').addEventListener('click', () => {
    isShuffled = !isShuffled;

    if (isShuffled) {
        shuffledQueue = shuffleArray([...songInfo]);

        if (currSong) {
            const currentIndex = shuffledQueue.findIndex(song => song.title === currSong.title);
            if (currentIndex !== -1) {
                const currentSong = shuffledQueue.splice(currentIndex, 1)[0];
                shuffledQueue.unshift(currentSong);
                currentSongIndex = 0;
            }
        }
        nextQueue = shuffledQueue.slice(currentSongIndex + 1);
        setQueue(nextQueue);
    } else {
        shuffledQueue = [];

        if (currSong) {
            const originalIndex = songInfo.findIndex(song => song.title === currSong.title);
            if (originalIndex !== -1) {
                currentSongIndex = originalIndex;
                nextQueue = songInfo.slice(originalIndex + 1);
            } else {
                currentSongIndex = 0;
                nextQueue = songInfo.slice(1);
            }
        } else {
            currentSongIndex = 0;
            nextQueue = songInfo.slice(1);
        }
        setQueue(nextQueue);
    }
});

function getActiveQueue() {
    if (isShuffled && shuffledQueue.length > 0) {
        return shuffledQueue;
    } else {
        return songInfo;
    }
}

function playNextSong() {
    const activeQueue = getActiveQueue();
    if (activeQueue.length === 0) return;

    if (loopMode === 2) {
        audio.currentTime = 0;
        audio.play();
        return;
    }

    currentSongIndex = (currentSongIndex + 1) % activeQueue.length;

    if (loopMode === 0 && currentSongIndex === 0 && activeQueue.length > 1) {
        audio.pause();
        isPlaying = false;
        const playBtn = document.querySelector(".play-btn-player");
        if (playBtn) {
            playBtn.textContent = '▶️';
        }
        return;
    }

    const nextSong = activeQueue[currentSongIndex];
    nextQueue = activeQueue.slice(currentSongIndex + 1);
    setQueue(nextQueue);
    playCurrentSong(nextSong.title, currentSongIndex);
}

function playPreviousSong() {
    const activeQueue = getActiveQueue();
    if (activeQueue.length === 0) return;

    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        if (audio.paused) audio.play();
        return;
    }

    currentSongIndex = (currentSongIndex - 1 + activeQueue.length) % activeQueue.length;
    const prevSong = activeQueue[currentSongIndex];
    nextQueue = activeQueue.slice(currentSongIndex + 1);
    setQueue(nextQueue);
    playCurrentSong(prevSong.title, currentSongIndex);
}

// Loop button handler
document.querySelector('#loop').addEventListener('click', () => {
    loopMode = (loopMode + 1) % 3;
    const loopBtn = document.querySelector('#loop');

    switch (loopMode) {
        case 0:
            loopBtn.textContent = '🔁';
            loopBtn.style.opacity = '0.5';
            break;
        case 1:
            loopBtn.textContent = '🔁';
            loopBtn.style.opacity = '1';
            break;
        case 2:
            loopBtn.textContent = '🔂';
            loopBtn.style.opacity = '1';
            break;
    }
});

// Navigation event listeners
document.getElementById('previous').addEventListener('click', playPreviousSong);
document.getElementById('next').addEventListener('click', playNextSong);

// Auto-play next song when current song ends
audio.addEventListener('ended', () => {
    if (loopMode === 2) {
        audio.currentTime = 0;
        audio.play();
    } else if (loopMode === 1) {
        playNextSong();
    } else {
        const activeQueue = getActiveQueue();
        if (currentSongIndex < activeQueue.length - 1) {
            playNextSong();
        } else {
            isPlaying = false;
            const playBtn = document.querySelector(".play-btn-player");
            if (playBtn) playBtn.textContent = '▶️';
        }
    }
});

// Play/pause toggle
document.querySelector(".play-btn-player")?.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        isPlaying = true;
        document.querySelector(".play-btn-player").textContent = '⏸';
    } else {
        audio.pause();
        isPlaying = false;
        document.querySelector(".play-btn-player").textContent = '▶️';
    }
});

// FIXED: getTags to include File objects
async function getTags() {
    const jsmediatags = window.jsmediatags;

    const folderInput = document.createElement('input');
    folderInput.type = 'file';
    folderInput.webkitdirectory = true;
    folderInput.multiple = true;
    folderInput.style.display = 'none';
    document.body.appendChild(folderInput);

    return new Promise((resolve) => {
        folderInput.addEventListener("change", (event) => {
            const fileList = event.target.files;
            const results = [];
            let processed = 0;

            Array.from(fileList).forEach((file) => {
                jsmediatags.read(file, {
                    onSuccess: (tag) => {
                        let backgroundImage = null;
                        const artist = tag.tags.artist || file.name.split(' - ')[0] || 'Unknown Artist';
                        
                        if (tag.tags.picture) {
                            const data = tag.tags.picture.data;
                            const format = tag.tags.picture.format;
                            let base64String = "";

                            for (let i = 0; i < data.length; i++) {
                                base64String += String.fromCharCode(data[i]);
                            }

                            backgroundImage = `url(data:${format};base64,${window.btoa(base64String)})`;
                        }

                        results.push({
                            file: file, // CRITICAL: Include the File object
                            fileName: file.name,
                            song: file.name.split(' - ')[1],
                            backgroundImage,
                            artist
                        });

                        processed++;
                        if (processed === fileList.length) {
                            resolve(results);
                        }
                    },
                    onError: (error) => {
                        console.error(error);
                        results.push({
                            file: file, // CRITICAL: Include the File object even on error
                            fileName: file.name,
                            song: file.name.split(' - ')[1],
                            backgroundImage: null,
                            artist: file.name.split(' - ') || 'Unknown Artist'
                        });
                        processed++;
                        if (processed === fileList.length) {
                            resolve(results);
                        }
                    }
                });
            });
        });

        document.querySelector('.create-btn').addEventListener("click", () => {
            folderInput.click();
        });
    });
}

getTags().then((songsData) => {
    const songList = document.querySelector('.song-list');
    songList.innerHTML = "";

    songsData.forEach((songData) => {
        // Your existing DOM creation code...
        const fullFileName = songData.fileName;
        
        const songItem = document.createElement('div');
        songItem.className = 'song-item playable';
        songItem.dataset.fullFileName = fullFileName;
        songItem.dataset.src = songData.song;

        const thumbnail = document.createElement('div');
        thumbnail.className = 'song-thumbnail';
        if (songData.backgroundImage) {
            thumbnail.style.backgroundImage = songData.backgroundImage;
            thumbnail.style.backgroundSize = 'cover';
            thumbnail.style.backgroundPosition = 'center';
        } else {
            thumbnail.style.backgroundImage = "linear-gradient(135deg, #ff6b6b, #ffd93d)";
        }

        const songInfo = document.createElement('div');
        songInfo.className = 'song-info';
        songInfo.style.flexDirection = 'column';
        songInfo.style.gap = '5px';

        const metaContainer = document.createElement('div');
        metaContainer.className = 'song-meta-row flex items-center';
        metaContainer.style.gap = '10px';

        const songTitle = document.createElement('div');
        songTitle.className = 'song-title';
        songTitle.textContent = songData.song ? songData.song.replace(/\.[^/.]+$/, "") : fullFileName;

        const songMetadata = document.createElement('div');
        songMetadata.className = 'song-metadata';
        songMetadata.innerHTML = `<span class="song-type">Local File</span>`;

        const songArtist = document.createElement('div');
        songArtist.className = 'song-artist song-metadata';
        songArtist.innerHTML = `<div class="song-artist">• ${songData.artist}</div>`;

        songInfo.appendChild(songTitle);
        songInfo.appendChild(metaContainer);

        const pinIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        pinIcon.setAttribute("class", "pin-icon");
        pinIcon.setAttribute("viewBox", "0 0 16 16");
        pinIcon.setAttribute("fill", "currentColor");
        pinIcon.innerHTML = `<path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-.451.293-.707.293-.256 0-.512-.098-.707-.293a.999.999 0 0 1 0-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.766 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133c-.021-.126-.039-.284-.039-.461 0-.431.108-1.023.589-1.503a.5.5 0 0 1 .353-.146z"/>`;

        songItem.appendChild(thumbnail);
        songItem.appendChild(songInfo);
        songItem.appendChild(pinIcon);
        metaContainer.appendChild(songMetadata);
        metaContainer.appendChild(songArtist);

        songList.appendChild(songItem);
    });

    // CRITICAL: Create proper songInfo array with File objects
    songInfo = songsData.map((songData) => ({
        title: songData.fileName,
        artist: songData.artist,
        thumbnail: songData.backgroundImage,
        file: songData.file // This is the key fix!
    }));
    
    populateTrendingSongs(songInfo);
    updateScrollButtons();
    playSong();
});

function populateTrendingSongs(songs, maxCards = null) {
    const cardRow = document.querySelector('.card-row.songs');
    if (!cardRow) {
        console.error('Song cards container not found');
        return;
    }

    cardRow.innerHTML = '';
    const cardsToCreate = maxCards ? Math.min(songs.length, maxCards) : songs.length;

    for (let i = 0; i < cardsToCreate; i++) {
        const song = songs[i];
        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
            <div class="img-wrapper">
                <div class="trending-thumbnail" style="background-image: ${song.thumbnail || "linear-gradient(135deg, #ff6b6b, #ffd93d)"}; background-size: cover; background-position: center center;"></div>
                
                <div class="play-btn">
                    <svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="12" fill="#3be477"></circle>
                        <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606" fill="black" transform="scale(0.55) translate(11,11)"></path>
                    </svg>
                </div>
            </div>
            <h4>${truncateText(song.title, 30)}</h4>
            <p>${truncateText(song.artist, 45)}</p>
        `;

        card.dataset.songIndex = i;
        card.dataset.songTitle = song.title;
        card.dataset.songArtist = song.artist;
        card.dataset.songThumbnail = song.thumbnail;

        const playBtn = card.querySelector('.play-btn');
        playBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            handleSongPlay(i, song);
        });

        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });

        cardRow.appendChild(card);
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Your existing progress bar, volume, and scroll button code...
function updateProgressBar() {
    if (!isDragging && audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = progress + '%';
    }
}

function setAudioProgress(clientX) {
    const rect = progressBar.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const progressBarWidth = rect.width;
    const clickedProgress = (clickX / progressBarWidth);
    const clampedProgress = Math.max(0, Math.min(1, clickedProgress));

    if (audio.duration) {
        const newTime = clampedProgress * audio.duration;
        audio.currentTime = newTime;
        progressFill.style.width = (clampedProgress * 100) + '%';

        if (audio.paused && currSong) {
            audio.play();
            isPlaying = true;
            const playBtn = document.querySelector(".play-btn-player");
            if (playBtn) {
                playBtn.textContent = '⏸';
            }
        }
    }
}

// Scroll buttons
const cardRow = document.querySelector('.card-row');
const leftBtn = document.getElementById('scrollLeft');
const rightBtn = document.getElementById('scrollRight');
const scrollAmount = 300;

function updateScrollButtons() {
    if (!cardRow || !leftBtn || !rightBtn) return;
    
    const canScroll = cardRow.scrollWidth > cardRow.clientWidth;
    leftBtn.style.display = canScroll ? '' : 'none';
    rightBtn.style.display = canScroll ? '' : 'none';

    if (cardRow.scrollLeft <= 0) {
        leftBtn.style.visibility = 'hidden';
    } else {
        leftBtn.style.visibility = 'visible';
    }

    const maxScrollLeft = cardRow.scrollWidth - cardRow.clientWidth;
    if (cardRow.scrollLeft >= maxScrollLeft - 2) {
        rightBtn.style.visibility = 'hidden';
    } else {
        rightBtn.style.visibility = 'visible';
    }
}

leftBtn?.addEventListener('click', () => {
    cardRow.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
});

rightBtn?.addEventListener('click', () => {
    cardRow.scrollBy({ left: scrollAmount, behavior: 'smooth' });
});

cardRow?.addEventListener('scroll', updateScrollButtons);
window.addEventListener('resize', updateScrollButtons);
document.addEventListener('DOMContentLoaded', updateScrollButtons);

// Progress bar event listeners
progressBar?.addEventListener('mousedown', (e) => {
    isDragging = true;
    setAudioProgress(e.clientX);
    progressBar.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        setAudioProgress(e.clientX);
    }
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        if (progressBar) progressBar.style.cursor = 'pointer';
    }
});

audio?.addEventListener('timeupdate', updateProgressBar);

(function updateVolume() {
    const volumeBar = document.getElementById('volumeBar');
    const volumeFill = document.getElementById('volumeFill');
    const muteBtn = document.getElementById('mute-btn');

    if (!volumeBar || !volumeFill || !muteBtn) return;

    // store last non-muted volume
    let lastVolume = 0.5;

    // default volume
    audio.volume = lastVolume;
    volumeFill.style.width = (lastVolume * 100) + '%';

    function setVolumeFromEvent(e) {
        const rect = volumeBar.getBoundingClientRect();
        let offsetX = e.clientX - rect.left;
        let percentage = offsetX / rect.width;

        // clamp between 0 and 1
        percentage = Math.max(0, Math.min(1, percentage));

        audio.volume = percentage;
        lastVolume = percentage; // save latest volume
        volumeFill.style.width = (percentage * 100) + '%';
    }

    // click to set volume
    volumeBar.addEventListener('click', setVolumeFromEvent);

    // drag to set volume
    let isDraggingVolume = false;
    volumeBar.addEventListener('mousedown', () => { isDraggingVolume = true; });
    document.addEventListener('mouseup', () => { isDraggingVolume = false; });
    document.addEventListener('mousemove', (e) => {
        if (isDraggingVolume) setVolumeFromEvent(e);
    });

    // mute toggle
    muteBtn.addEventListener('click', () => {
        if (muteBtn.innerHTML === '🔊') {
            muteBtn.innerHTML = '🔇';
            lastVolume = audio.volume; // save before muting
            audio.volume = 0;
            volumeFill.style.width = '0%';
        } else {
            muteBtn.innerHTML = '🔊';
            audio.volume = lastVolume; // restore last volume
            volumeFill.style.width = (lastVolume * 100) + '%';
        }
    });
})();

// Fullscreen button
const fullscreenBtn = document.getElementById('fullscreenBtn');

fullscreenBtn?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        // enter fullscreen
        document.documentElement.requestFullscreen();
    } else {
        // exit fullscreen
        document.exitFullscreen();
    }
});

// Also add back the time display function that might be missing
function displaySongTime() {
    const currTime = document.querySelector('.curr-time');
    const totalTime = document.querySelector('.total-time');
    if (currTime && totalTime && audio.duration) {
        currTime.innerHTML = formatTime(audio.currentTime);
        totalTime.innerHTML = formatTime(audio.duration);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Add time display updates
audio?.addEventListener('timeupdate', () => {
    updateProgressBar();
    displaySongTime();
});

// Touch events for progress bar (if needed for mobile)
progressBar?.addEventListener('touchstart', (e) => {
    isDragging = true;
    const touch = e.touches[0];
    setAudioProgress(touch.clientX);
    e.preventDefault();
});

document.addEventListener('touchmove', (e) => {
    if (isDragging) {
        const touch = e.touches;
        setAudioProgress(touch.clientX);
        e.preventDefault();
    }
});

document.addEventListener('touchend', () => {
    if (isDragging) {
        isDragging = false;
    }
});

// Reset progress when new song loads
audio?.addEventListener('loadstart', () => {
    if (progressFill) progressFill.style.width = '0%';
});

// Click to seek (without dragging)
progressBar?.addEventListener('click', (e) => {
    if (!isDragging) {
        setAudioProgress(e.clientX);
    }
});

// Prevent text selection while dragging
progressBar?.addEventListener('selectstart', (e) => {
    e.preventDefault();
});

// mobile device optimizations
let startX = 0;
let startY = 0;
let isScrolling = undefined;

// Hamburger menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navExtremeRight = document.querySelector('.nav-extreme-right');
    
    if (mobileMenuBtn && navExtremeRight) {
        mobileMenuBtn.addEventListener('click', () => {
            navExtremeRight.classList.toggle('active');
            mobileMenuBtn.textContent = navExtremeRight.classList.contains('active') ? '✕' : '☰';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenuBtn.contains(e.target) && !navExtremeRight.contains(e.target)) {
                navExtremeRight.classList.remove('active');
                mobileMenuBtn.textContent = '☰';
            }
        });
    }
});

document.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isScrolling = undefined;
});

document.addEventListener('touchmove', (e) => {
    if (isScrolling) return;
    
    const currentX = e.touches.clientX;
    const currentY = e.touches.clientY;
    const diffX = startX - currentX;
    const diffY = startY - currentY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        isScrolling = true;
        // Horizontal swipe - could trigger next/previous song
        if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // Swipe left - next song
                playNextSong();
            } else {
                // Swipe right - previous song
                playPreviousSong();
            }
        }
    }
});

// Mobile detection
function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Add mobile class
if (isMobile()) {
    document.body.classList.add('mobile-device');
}

// Handle orientation changes
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        updateScrollButtons();
    }, 100);
});
