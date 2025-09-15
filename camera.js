console.log('Camera Widget Loading...');

let currentStream = null;
let uploadedPhotos = [];

// JotForm Widget - CORRECT PATTERN
(function() {
    // Wait for JotForm Widget API
    function waitForJotForm() {
        if (typeof JFCustomWidget !== 'undefined') {
            console.log('JotForm Widget API available');
            
            // Subscribe to ready event
            JFCustomWidget.subscribe('ready', function() {
                console.log('Widget ready');
                
                // Send initial empty data
                JFCustomWidget.sendData({
                    value: '',
                    valid: true
                });
            });
            
            // CRITICAL: Handle submit polling
            JFCustomWidget.subscribe('submit', function() {
                console.log('Submit event - photos:', uploadedPhotos.length);
                
                // Return simple text value (not files - that causes timeouts)
                if (uploadedPhotos.length > 0) {
                    return {
                        value: `${uploadedPhotos.length} photos captured`,
                        valid: true
                    };
                } else {
                    return {
                        value: '',
                        valid: true
                    };
                }
            });
            
            // CRITICAL: Handle the polling requests we see in Network tab
            JFCustomWidget.subscribe('populate', function() {
                console.log('Populate event');
                return uploadedPhotos.length > 0 ? `${uploadedPhotos.length} photos` : '';
            });
            
        } else {
            setTimeout(waitForJotForm, 50);
        }
    }
    
    waitForJotForm();
})();

function initCameraWidget() {
    const container = document.getElementById('camera-widget');
    if (!container) return;
    
    container.innerHTML = `
        <div style="padding: 15px; text-align: center; background: #f8f9fa; border-radius: 8px;">
            <div id="initial-state">
                <button id="start-btn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Take Photo</button>
                <p style="margin-top: 8px; color: #666; font-size: 14px;">Click to start camera</p>
            </div>
            
            <div id="camera-state" style="display: none;">
                <video id="video" playsinline muted style="width: 100%; max-width: 300px; height: 200px; background: #000; border-radius: 4px; margin-bottom: 10px;"></video>
                <div>
                    <button id="capture-btn" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; margin: 0 5px; cursor: pointer;">Capture</button>
                    <button id="cancel-btn" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; margin: 0 5px; cursor: pointer;">Cancel</button>
                </div>
            </div>
            
            <div id="preview-state" style="display: none;">
                <canvas id="canvas" style="max-width: 300px; max-height: 200px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;"></canvas>
                <div>
                    <button id="approve-btn" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; margin: 0 5px; cursor: pointer;">Approve</button>
                    <button id="retake-btn" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; margin: 0 5px; cursor: pointer;">Retake</button>
                </div>
            </div>
            
            <div id="gallery-state" style="display: none;">
                <p style="color: #28a745; font-weight: bold;">Photo added!</p>
                <div id="photos-list" style="margin: 10px 0;"></div>
                <div>
                    <button id="add-more-btn" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; margin: 0 5px; cursor: pointer;">Add More</button>
                    <button id="done-btn" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; margin: 0 5px; cursor: pointer;">Done (0)</button>
                </div>
            </div>
        </div>
    `;
    
    setupHandlers();
    updateHeight(80);
}

function setupHandlers() {
    document.getElementById('start-btn').onclick = startCamera;
    document.getElementById('capture-btn').onclick = capturePhoto;
    document.getElementById('cancel-btn').onclick = () => {
        stopCamera();
        showState('initial');
    };
    document.getElementById('approve-btn').onclick = approvePhoto;
    document.getElementById('retake-btn').onclick = () => showState('camera');
    document.getElementById('add-more-btn').onclick = () => showState('initial');
    document.getElementById('done-btn').onclick = () => {
        sendDataToJotForm();
        alert(`${uploadedPhotos.length} photos ready!`);
    };
}

function showState(state) {
    const states = ['initial', 'camera', 'preview', 'gallery'];
    states.forEach(s => {
        const el = document.getElementById(s + '-state');
        if (el) el.style.display = 'none';
    });
    
    document.getElementById(state + '-state').style.display = 'block';
    
    if (state === 'gallery') {
        updateGallery();
    }
    
    const heights = { initial: 80, camera: 280, preview: 280, gallery: 150 };
    updateHeight(heights[state] || 80);
}

function updateHeight(h) {
    try {
        if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.requestFrameResize) {
            JFCustomWidget.requestFrameResize(h);
        }
    } catch (e) {
        console.log('Height error:', e);
    }
}

async function startCamera() {
    try {
        showState('camera');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        
        currentStream = stream;
        const video = document.getElementById('video');
        video.srcObject = stream;
        
        // Manual play after user interaction
        setTimeout(() => {
            video.play().catch(console.log);
        }, 100);
        
    } catch (error) {
        alert('Camera failed: ' + error.message);
        showState('initial');
    }
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    
    if (video && canvas && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        stopCamera();
        showState('preview');
    }
}

function approvePhoto() {
    const canvas = document.getElementById('canvas');
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    uploadedPhotos.push({
        dataUrl: dataUrl,
        timestamp: Date.now()
    });
    
    console.log('Photo added, total:', uploadedPhotos.length);
    sendDataToJotForm();
    showState('gallery');
}

function updateGallery() {
    const list = document.getElementById('photos-list');
    const btn = document.getElementById('done-btn');
    
    btn.textContent = `Done (${uploadedPhotos.length})`;
    
    list.innerHTML = uploadedPhotos.map((photo, i) => 
        `<img src="${photo.dataUrl}" style="width: 50px; height: 50px; margin: 2px; border-radius: 4px; object-fit: cover;">`
    ).join('');
}

function sendDataToJotForm() {
    try {
        if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.sendData) {
            const value = uploadedPhotos.length > 0 ? `${uploadedPhotos.length} photos captured` : '';
            
            JFCustomWidget.sendData({
                value: value,
                valid: true
            });
            
            console.log('Data sent:', value);
        }
    } catch (e) {
        console.error('Send error:', e);
    }
}

// Initialize
function init() {
    const container = document.getElementById('camera-widget');
    if (container) {
        initCameraWidget();
    } else {
        setTimeout(init, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('Camera widget loaded');
