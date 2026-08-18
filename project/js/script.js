// ==================== 로그인 관리 ====================
const DEFAULT_PASSWORD = '1234';

// 페이지 로드 시 로그인 상태 확인
window.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    
    // 로그인된 상태면 메인 앱 초기화
    if (isLoggedIn()) {
        initializeApp();
    }
});

function isLoggedIn() {
    return sessionStorage.getItem('shortformLoggedIn') === 'true';
}

function checkLoginStatus() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (isLoggedIn()) {
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
    } else {
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const password = document.getElementById('password').value;
    const savedPassword = localStorage.getItem('shortformPassword') || DEFAULT_PASSWORD;
    const loginError = document.getElementById('loginError');
    
    if (password === savedPassword) {
        sessionStorage.setItem('shortformLoggedIn', 'true');
        loginError.classList.add('hidden');
        checkLoginStatus();
        initializeApp();
        document.getElementById('password').value = '';
    } else {
        loginError.classList.remove('hidden');
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

function handleLogout() {
    if (confirm('정말로 로그아웃하시겠습니까?')) {
        sessionStorage.removeItem('shortformLoggedIn');
        checkLoginStatus();
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

function changePassword() {
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    
    if (!newPassword) {
        alert('새 비밀번호를 입력해주세요.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        document.getElementById('confirmPassword').focus();
        return;
    }
    
    if (newPassword.length < 4) {
        alert('비밀번호는 4자 이상이어야 합니다.');
        return;
    }
    
    localStorage.setItem('shortformPassword', newPassword);
    alert('비밀번호가 변경되었습니다!');
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// ==================== 메인 앱 초기화 ====================
let videos = [];

function initializeApp() {
    loadVideosFromStorage();
    renderVideos(videos);
    updateStats();
    setupDragAndDrop();
}

// ==================== 드래그 앤 드롭 ====================
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#764ba2';
        dropZone.style.backgroundColor = '#e8e4f3';
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#667eea';
        dropZone.style.backgroundColor = '#f0f0ff';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#667eea';
        dropZone.style.backgroundColor = '#f0f0ff';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const videoInput = document.getElementById('video');
            videoInput.files = files;
            handleVideoSelect({ target: videoInput });
        }
    });
    
    // 클릭으로 파일 선택
    dropZone.addEventListener('click', () => {
        document.getElementById('video').click();
    });
}

// ==================== 영상 선택 처리 ====================
function handleVideoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 크기 체크 (50MB)
    if (file.size > 50 * 1024 * 1024) {
        alert('파일 크기는 50MB 이하여야 합니다.');
        return;
    }
    
    // 영상 미리보기
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('videoPreview');
        preview.innerHTML = `
            <video controls style="max-width: 100%; max-height: 300px; border-radius: 5px;">
                <source src="${e.target.result}" type="${file.type}">
                브라우저가 지원하지 않습니다.
            </video>
            <div class="preview-info">
                <p>📹 ${file.name}</p>
                <p>크기: ${(file.size / (1024 * 1024)).toFixed(2)}MB</p>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

// ==================== 영상 업로드 ====================
function uploadVideo() {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const category = document.getElementById('category').value;
    const videoInput = document.getElementById('video');
    
    // 유효성 검사
    if (!title) {
        alert('제목을 입력해주세요.');
        document.getElementById('title').focus();
        return;
    }
    
    if (!category) {
        alert('카테고리를 선택해주세요.');
        document.getElementById('category').focus();
        return;
    }
    
    if (!videoInput.files[0]) {
        alert('영상 파일을 선택해주세요.');
        return;
    }
    
    // 영상 파일을 Data URL로 변환
    const file = videoInput.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const newVideo = {
            id: Date.now(),
            title: title,
            description: description,
            category: category,
            videoData: e.target.result,
            fileName: file.name,
            uploadDate: new Date().toLocaleDateString('ko-KR'),
            views: 0,
            likes: 0
        };
        
        videos.unshift(newVideo);
        saveVideosToStorage();
        renderVideos(videos);
        updateStats();
        
        // 폼 초기화
        resetForm();
        
        // 영상 목록 섹션으로 스크롤
        setTimeout(() => {
            scrollToSection('videos');
        }, 300);
        
        alert('영상이 성공적으로 업로드되었습니다! 🎉');
    };
    
    reader.readAsDataURL(file);
}

// 폼 초기화
function resetForm() {
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('category').value = '';
    document.getElementById('video').value = '';
    document.getElementById('videoPreview').innerHTML = '';
}

// ==================== 영상 렌더링 ====================
function renderVideos(videoList) {
    const videoListContainer = document.getElementById('videoList');
    const emptyMessage = document.getElementById('emptyMessage');
    
    if (videoList.length === 0) {
        videoListContainer.innerHTML = '';
        emptyMessage.classList.remove('hidden');
        return;
    }
    
    emptyMessage.classList.add('hidden');
    
    videoListContainer.innerHTML = videoList.map(video => {
        const categoryLabels = {
            'comedy': '🤣 코미디',
            'music': '🎵 음악',
            'dance': '💃 춤',
            'cooking': '🍳 요리',
            'beauty': '💄 뷰티',
            'travel': '✈️ 여행',
            'game': '🎮 게임',
            'daily': '📅 일상',
            'other': '📌 기타'
        };
        
        return `
            <div class="video-card">
                <div class="video-card-thumbnail">
                    <video onmouseover="this.play()" onmouseout="this.pause()">
                        <source src="${video.videoData}" type="video/mp4">
                    </video>
                    <div class="play-icon">▶️</div>
                </div>
                <div class="video-card-info">
                    <div class="video-card-title">${escapeHtml(video.title)}</div>
                    <div class="video-card-category">${categoryLabels[video.category] || video.category}</div>
                    <div class="video-card-description">${escapeHtml(video.description)}</div>
                    <div style="font-size: 12px; color: #999; margin-bottom: 10px;">
                        👁️ ${video.views} | ❤️ ${video.likes} | 📅 ${video.uploadDate}
                    </div>
                    <div class="video-card-actions">
                        <button class="btn-small" onclick="likeVideo(${video.id})">❤️ 좋아요</button>
                        <button class="btn-small" onclick="deleteVideo(${video.id})">🗑️ 삭제</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== 영상 관리 ====================
function likeVideo(videoId) {
    const video = videos.find(v => v.id === videoId);
    if (video) {
        video.likes += 1;
        video.views += 1;
        saveVideosToStorage();
        renderVideos(videos);
        updateStats();
    }
}

function deleteVideo(videoId) {
    if (confirm('정말로 이 영상을 삭제하시겠습니까?')) {
        videos = videos.filter(v => v.id !== videoId);
        saveVideosToStorage();
        renderVideos(videos);
        updateStats();
        alert('영상이 삭제되었습니다.');
    }
}

// ==================== 통계 업데이트 ====================
function updateStats() {
    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0);
    
    const totalVideosEl = document.getElementById('totalVideos');
    const totalViewsEl = document.getElementById('totalViews');
    const totalLikesEl = document.getElementById('totalLikes');
    
    if (totalVideosEl) totalVideosEl.textContent = totalVideos;
    if (totalViewsEl) totalViewsEl.textContent = totalViews;
    if (totalLikesEl) totalLikesEl.textContent = totalLikes;
}

// ==================== 검색 및 필터링 ====================
function filterVideos() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    const filtered = videos.filter(video => {
        const matchesSearch = 
            video.title.toLowerCase().includes(searchTerm) ||
            video.description.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !categoryFilter || video.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    renderVideos(filtered);
}

// ==================== 스크롤 기능 ====================
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==================== 저장소 관리 ====================
function saveVideosToStorage() {
    // 저용량 저장소를 위해 최대 20개의 최신 영상만 저장
    const dataToSave = videos.slice(0, 20);
    
    try {
        localStorage.setItem('shortformVideos', JSON.stringify(dataToSave));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('저장소가 가득 찼습니다. 일부 영상을 삭제해주세요.');
        }
    }
}

function loadVideosFromStorage() {
    try {
        const saved = localStorage.getItem('shortformVideos');
        if (saved) {
            videos = JSON.parse(saved);
        }
    } catch (e) {
        console.error('데이터 로드 실패:', e);
        videos = [];
    }
}

// ==================== 유틸리티 ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 키보드 단축키 ====================
document.addEventListener('keydown', (e) => {
    if (!isLoggedIn()) return;
    
    // Ctrl + U: 업로드 섹션으로 이동
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        scrollToSection('upload');
    }
    
    // Ctrl + G: 영상 목록으로 이동
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        scrollToSection('videos');
    }
});
