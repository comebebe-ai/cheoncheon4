// ==================== 데이터 저장소 ====================
let videos = [];

// 페이지 로드 시 저장된 영상 불러오기
window.addEventListener('DOMContentLoaded', () => {
    loadVideosFromStorage();
    renderVideos(videos);
    
    // 드래그 앤 드롭 설정
    setupDragAndDrop();
});

// ==================== 드래그 앤 드롭 ====================
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    
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
    }
}

function deleteVideo(videoId) {
    if (confirm('정말로 이 영상을 삭제하시겠습니까?')) {
        videos = videos.filter(v => v.id !== videoId);
        saveVideosToStorage();
        renderVideos(videos);
        alert('영상이 삭제되었습니다.');
    }
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
    // 저용량 저장소를 위해 최대 10개의 최신 영상만 저장
    const dataToSave = videos.slice(0, 10);
    
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
