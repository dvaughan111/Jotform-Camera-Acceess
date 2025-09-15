console.log('🚀 Camera Widget Loading...');

let currentStream = null;
let uploadedPhotos = [];
let widgetReady = false;

// JotForm Widget initialization - MUST BE FIRST
(function() {
    // Wait for JotForm Widget API
    const initWidget = () => {
        if (typeof JFCustomWidget !== 'undefined') {
            console.log('🎯 JotForm Widget API found');
            
            // Initialize widget with proper structure
            JFCustomWidget.subscribe('ready', function() {
                console.log('🎯 Widget ready event received');
                widgetReady = true;
                
                // Send initial empty value
                JFCustomWidget.sendData({
                    value: '',
                    valid: true
                });
            });
            
            // Handle form submission
            JFCustomWidget.subscribe('submit', function() {
                console.log('📤 Form submit event - returning photos:', uploadedPhotos.length);
                
                if (uploadedPhotos.length === 0) {
                    return {
                        value: '',
                        valid: true
                    };
                }
                
                // Convert photos to comma-separated base64 string
                const photoDataList = uploadedPhotos.map(photo => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    
                    return new Promise((resolve) => {
                        img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/jpeg', 0.8));
                        };
                        img.src = photo.url;
                    });
                });
                
                return Promise.all(photoDataList).then(dataUrls => {
                    const combinedData = dataUrls.join('|||'); // Use separator
                    console.log('📤 Submitting combined photo data, length:', combinedData.length);
                    
                    return {
                        value: combinedData,
                        valid: true
                    };
                });
            });
            
        } else {
            console.log('⏳ Waiting for JotForm Widget API...');
            setTimeout(initWidget, 100);
        }
    };
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();

function initCameraWidget() {
    console.log('📍 initCameraWidget called');
    
    const container = document.getElementById('camera-widget');
    if (!container) {
        console.error('❌ No camera-widget container found');
        return;
    }
    
    // Create the interface
    container.innerHTML = `
        <div class="widget-container" style="padding: 20px; text-align: center; background: #f8f9fa; border-radius: 8px; min-height: 100px;">
            <!-- INITIAL STATE -->
            <div id="initial-state" style="display: block;">
                <button id="start-camera-btn" class="primary-btn">📷 Take Photo</button>
                <p style="margin-top: 10px; color: #666; font-size: 14px;">Click to start camera</p>
            </div>
            
            <!-- CAMERA STATE -->
            <div id="camera-state" style="display: none;">
                <div class="video-container">
                    <video id="camera-video" playsinline muted autoplay></video>
                </div>
                <div class="button-row">
                    <button id="capture-btn" class="success-btn">📸 Capture</button>
                    <button id="cancel-btn" class="secondary-btn">✖ Cancel</button>
                </div>
            </div>
            
            <!-- PREVIEW STATE -->
            <div id="preview-state" style="display: none;">
                <div class="preview-container">
                    <canvas id="photo-canvas"></canvas>
                </div>
                <div class="preview-actions">
                    <button id="approve-btn" class="success-btn">✓ Approve</button>
                    <button id="retake-btn" class="secondary-btn">↻ Retake</button>
                </div>
            </div>
            
            <!-- UPLOADING STATE -->
            <div id="uploading-state" style="display: none;">
                <p class="uploading-text">Processing photo...</p>
                <div class="progress-bar"></div>
            </div>
            
            <!-- THUMBNAIL STATE -->
            <div id="thumbnail-state" style="display: none;">
                <p class="success-message">Photo added successfully!</p>
                
                <div class="actions-container">
                    <button id="add-another-btn" class="success-btn">📷 Add Another Photo</button>
                    <button id="done-btn" class="primary-btn">✅ Done (${uploadedPhotos.length} photos)</button>
                </div>
                
                <div id="uploaded-photos-container" class="photo-gallery">
                    <h4 class="gallery-title">Uploaded Photos (${uploadedPhotos.length}):</h4>
                    <div id="uploaded-photos-list" class="uploaded-photos-list"></div>
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ Interface created');
    setupClickHandlers();
    updateWidgetHeight(100);
    console.log('✅ Widget setup complete');
}

function setupClickHandlers() {
    console.log('📍 Setting up click handlers...');
    
    document.getElementById('start-camera-btn').onclick = (e) => {
        e.preventDefault();
        startCamera();
    };
    
    document.getElementById('capture-btn').onclick = (e) => {
        e.preventDefault();
        capturePhoto();
    };
    
    document.getElementById('cancel-btn').onclick = (e) => {
        e.preventDefault();
        stopCamera();
        showState('initial');
    };
    
    document.getElementById('approve-btn').onclick = (e) => {
        e.preventDefault();
        approvePhoto();
    };
    
    document.getElementById('retake-btn').onclick = (e) => {
        e.preventDefault();
        showState('camera');
    };
    
    document.getElementById('add-another-btn').onclick = (e) => {
        e.preventDefault();
        showState('initial');
    };
    
    document.getElementById('done-btn').onclick = (e) => {
        e.preventDefault();
        sendDataToJotForm();
        alert(`${uploadedPhotos.length} photos ready for submission!`);
    };
}

function showState(stateName) {
    console.log('📍 showState called with:', stateName);
    
    const states = ['initial', 'camera', 'preview', 'uploading', 'thumbnail'];
    states.forEach(state => {
        const element = document.getElementById(state + '-state');
        if (element) element.style.display = 'none';
    });
    
    const targetElement = document.getElementById(stateName + '-state');
    if (targetElement) targetElement.style.display = 'block';
    
    if (stateName === 'thumbnail') {
        updateUploadedPhotosDisplay();
        // Update button text with photo count
        const doneBtn = document.getElementById('done-btn');
        if (doneBtn) {
            doneBtn.innerHTML = `✅ Done (${uploadedPhotos.length} photos)`;
        }
    }
    
    const heights = {
        'initial': 100,
        'camera': 400,
        'preview': 400,
        'uploading': 120,
        'thumbnail': Math.min(300 + (uploadedPhotos.length * 20), 500)
    };
    
    updateWidgetHeight(heights[stateName] || 100);
}

function updateWidgetHeight(height) {
    try {
        if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.requestFrameResize) {
            JFCustomWidget.requestFrameResize(height);
        }
    } catch (e) {
        console.log('Height update error:', e);
    }
}

async function startCamera() {
    try {
        showState('camera');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        currentStream = stream;
        const video = document.getElementById('camera-video');
        if (video) {
            video.srcObject = stream;
        }
    } catch (error) {
        console.error('Camera error:', error);
        alert('Camera error: ' + error.message);
        showState('initial');
    }
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
        const video = document.getElementById('camera-video');
        if (video) video.srcObject = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('photo-canvas');
    
    if (video && canvas && video.videoWidth > 0) {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        stopCamera();
        showState('preview');
    }
}

function approvePhoto() {
    showState('uploading');
    
    setTimeout(() => {
        const canvas = document.getElementById('photo-canvas');
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const url = canvas.toDataURL('image/jpeg', 0.9); // Higher quality for display
            
            const photoData = {
                url: url,
                dataUrl: dataUrl,
                timestamp: Date.now(),
                fileName: `photo-${Date.now()}-${uploadedPhotos.length + 1}.jpg`
            };
            
            uploadedPhotos.push(photoData);
            console.log('✅ Photo added:', photoData.fileName);
            
            // Send updated data to JotForm
            sendDataToJotForm();
            
            showState('thumbnail');
        }
    }, 800);
}

function sendDataToJotForm() {
    if (!widgetReady) {
        console.log('⚠️ Widget not ready yet');
        return;
    }
    
    try {
        if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.sendData) {
            // Create a simple string value with photo count
            const photoCount = uploadedPhotos.length;
            const value = photoCount > 0 ? `${photoCount} photos captured` : '';
            
            JFCustomWidget.sendData({
                value: value,
                valid: true
            });
            
            console.log('📤 Data sent to JotForm:', value);
        }
    } catch (e) {
        console.error('❌ Send data error:', e);
    }
}

function updateUploadedPhotosDisplay() {
    const photosList = document.getElementById('uploaded-photos-list');
    const photosContainer = document.getElementById('uploaded-photos-container');
    
    if (!photosList || !photosContainer) return;
    
    photosList.innerHTML = '';
    
    if (uploadedPhotos.length === 0) {
        photosList.innerHTML = '<div class="empty-state">No photos yet</div>';
        return;
    }
    
    uploadedPhotos.forEach((photo, index) => {
        const photoElement = document.createElement('div');
        photoElement.className = 'photo-thumbnail';
        photoElement.innerHTML = `
            <img src="${photo.url}" alt="Photo ${index + 1}">
            <button class="photo-delete-btn" onclick="removePhoto(${index})">✕</button>
        `;
        
        photoElement.onclick = (e) => {
            if (!e.target.classList.contains('photo-delete-btn')) {
                window.open(photo.url, '_blank');
            }
        };
        
        photosList.appendChild(photoElement);
    });
    
    // Update title
    const title = document.querySelector('.gallery-title');
    if (title) {
        title.textContent = `Uploaded Photos (${uploadedPhotos.length}):`;
    }
}

function removePhoto(index) {
    if (confirm('Remove this photo?')) {
        uploadedPhotos.splice(index, 1);
        updateUploadedPhotosDisplay();
        sendDataToJotForm(); // Update JotForm data
        
        if (uploadedPhotos.length === 0) {
            showState('initial');
        } else {
            showState('thumbnail'); // Refresh the view
        }
    }
}

// Make functions globally available
window.removePhoto = removePhoto;

// Debug function
window.debugWidget = function() {
    console.log('🔍 Widget Debug:');
    console.log('- Widget ready:', widgetReady);
    console.log('- Photos:', uploadedPhotos.length);
    console.log('- JFCustomWidget:', typeof JFCustomWidget);
    uploadedPhotos.forEach((photo, i) => {
        console.log(`  ${i + 1}. ${photo.fileName}`);
    });
};

// Initialize widget interface
function tryInit() {
    const container = document.getElementById('camera-widget');
    if (container) {
        initCameraWidget();
        return true;
    }
    return false;
}

if (!tryInit()) {
    document.addEventListener('DOMContentLoaded', tryInit);
    setTimeout(tryInit, 200);
}

console.log('📋 Camera widget script loaded!');
