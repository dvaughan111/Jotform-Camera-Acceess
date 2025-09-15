console.log('Camera Widget Loading...');

let currentStream = null;
let uploadedPhotos = [];
let widgetReady = false;

// JotForm Widget initialization
(function() {
    const initWidget = () => {
        if (typeof JFCustomWidget !== 'undefined') {
            console.log('JotForm Widget API found');
            
            JFCustomWidget.subscribe('ready', function() {
                console.log('Widget ready event received');
                widgetReady = true;
                
                // Send initial empty value
                JFCustomWidget.sendData({
                    value: []
                });
            });
            
            // Handle form submission - return actual file objects
            JFCustomWidget.subscribe('submit', function() {
                console.log('Form submit event - photos:', uploadedPhotos.length);
                
                if (uploadedPhotos.length === 0) {
                    return {
                        value: [],
                        valid: true
                    };
                }
                
                // Convert canvas data to actual File objects
                const filePromises = uploadedPhotos.map((photo, index) => {
                    return new Promise((resolve) => {
                        fetch(photo.dataUrl)
                            .then(res => res.blob())
                            .then(blob => {
                                const file = new File([blob], `photo-${index + 1}.jpg`, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now()
                                });
                                resolve(file);
                            });
                    });
                });
                
                return Promise.all(filePromises).then(files => {
                    console.log('Submitting files:', files.length);
                    return {
                        value: files,
                        valid: true
                    };
                });
            });
            
        } else {
            setTimeout(initWidget, 100);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();

function initCameraWidget() {
    const container = document.getElementById('camera-widget');
    if (!container) {
        console.error('No camera-widget container found');
        return;
    }
    
    container.innerHTML = `
        <div class="widget-container" style="padding: 15px; text-align: center; background: #f8f9fa; border-radius: 8px;">
            <div id="initial-state">
                <button id="start-camera-btn" class="primary-btn">Take Photo</button>
                <p style="margin-top: 8px; color: #666; font-size: 14px;">Click to start camera</p>
            </div>
            
            <div id="camera-state" style="display: none;">
                <div class="video-container">
                    <video id="camera-video" playsinline muted style="width: 100%; max-width: 300px; height: 200px; background: #000; border-radius: 4px;"></video>
                </div>
                <div style="margin-top: 10px;">
                    <button id="capture-btn" class="success-btn">Capture</button>
                    <button id="cancel-btn" class="secondary-btn">Cancel</button>
                </div>
            </div>
            
            <div id="preview-state" style="display: none;">
                <div style="margin-bottom: 10px;">
                    <canvas id="photo-canvas" style="max-width: 300px; max-height: 200px; border: 1px solid #ddd; border-radius: 4px;"></canvas>
                </div>
                <div>
                    <button id="approve-btn" class="success-btn">Approve</button>
                    <button id="retake-btn" class="secondary-btn">Retake</button>
                </div>
            </div>
            
            <div id="processing-state" style="display: none;">
                <p>Processing photo...</p>
            </div>
            
            <div id="thumbnail-state" style="display: none;">
                <p style="color: #28a745; font-weight: bold; margin-bottom: 10px;">Photo added successfully!</p>
                
                <div style="margin: 15px 0;">
                    <button id="add-another-btn" class="success-btn">Add Another</button>
                    <button id="done-btn" class="primary-btn">Done (<span id="photo-count">0</span>)</button>
                </div>
                
                <div id="photos-gallery" style="margin-top: 15px;">
                    <div id="photos-list"></div>
                </div>
            </div>
        </div>
    `;
    
    setupClickHandlers();
    updateWidgetHeight(80);
}

function setupClickHandlers() {
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
        alert(`${uploadedPhotos.length} photos ready for form submission!`);
    };
}

function showState(stateName) {
    const states = ['initial', 'camera', 'preview', 'processing', 'thumbnail'];
    states.forEach(state => {
        const element = document.getElementById(state + '-state');
        if (element) element.style.display = 'none';
    });
    
    const targetElement = document.getElementById(stateName + '-state');
    if (targetElement) targetElement.style.display = 'block';
    
    if (stateName === 'thumbnail') {
        updatePhotosDisplay();
    }
    
    const heights = {
        'initial': 80,
        'camera': 280,
        'preview': 280,
        'processing': 100,
        'thumbnail': Math.min(200 + (uploadedPhotos.length * 15), 350)
    };
    
    updateWidgetHeight(heights[stateName] || 80);
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
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        
        currentStream = stream;
        const video = document.getElementById('camera-video');
        if (video) {
            video.srcObject = stream;
            // Remove autoplay, manually play after user interaction
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(e => console.log('Video play failed:', e));
            });
        }
    } catch (error) {
        console.error('Camera error:', error);
        alert('Camera access failed: ' + error.message);
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
    } else {
        alert('Camera not ready. Please try again.');
    }
}

function approvePhoto() {
    showState('processing');
    
    setTimeout(() => {
        const canvas = document.getElementById('photo-canvas');
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            const photoData = {
                dataUrl: dataUrl,
                timestamp: Date.now(),
                fileName: `photo-${uploadedPhotos.length + 1}.jpg`
            };
            
            uploadedPhotos.push(photoData);
            console.log('Photo added:', photoData.fileName);
            
            sendDataToJotForm();
            showState('thumbnail');
        }
    }, 500);
}

function sendDataToJotForm() {
    if (!widgetReady || typeof JFCustomWidget === 'undefined') {
        console.log('Widget not ready');
        return;
    }
    
    try {
        // Convert photos to File objects for JotForm
        const filePromises = uploadedPhotos.map((photo, index) => {
            return fetch(photo.dataUrl)
                .then(res => res.blob())
                .then(blob => new File([blob], `photo-${index + 1}.jpg`, {
                    type: 'image/jpeg'
                }));
        });
        
        Promise.all(filePromises).then(files => {
            JFCustomWidget.sendData({
                value: files
            });
            console.log('Data sent to JotForm:', files.length, 'files');
        });
        
    } catch (e) {
        console.error('Send data error:', e);
    }
}

function updatePhotosDisplay() {
    const photosList = document.getElementById('photos-list');
    const photoCount = document.getElementById('photo-count');
    
    if (photoCount) {
        photoCount.textContent = uploadedPhotos.length;
    }
    
    if (!photosList) return;
    
    photosList.innerHTML = '';
    
    uploadedPhotos.forEach((photo, index) => {
        const photoDiv = document.createElement('div');
        photoDiv.style.cssText = 'display: inline-block; margin: 5px; position: relative;';
        photoDiv.innerHTML = `
            <img src="${photo.dataUrl}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 2px solid #007bff;">
            <button onclick="removePhoto(${index})" style="position: absolute; top: -5px; right: -5px; width: 20px; height: 20px; border: none; background: #dc3545; color: white; border-radius: 50%; font-size: 12px; cursor: pointer;">×</button>
        `;
        photosList.appendChild(photoDiv);
    });
}

function removePhoto(index) {
    if (confirm('Remove this photo?')) {
        uploadedPhotos.splice(index, 1);
        sendDataToJotForm();
        
        if (uploadedPhotos.length === 0) {
            showState('initial');
        } else {
            showState('thumbnail');
        }
    }
}

// Global functions
window.removePhoto = removePhoto;

window.debugWidget = function() {
    console.log('Widget Debug:');
    console.log('- Ready:', widgetReady);
    console.log('- Photos:', uploadedPhotos.length);
    console.log('- JFCustomWidget:', typeof JFCustomWidget);
};

// Initialize
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

console.log('Camera widget loaded');
