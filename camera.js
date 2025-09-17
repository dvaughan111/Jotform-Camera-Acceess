console.log('Camera Widget Loading...');

let currentStream = null;
let uploadedPhotos = [];

// JotForm Widget Integration
(function() {
    // Wait for JotForm Widget API
    function waitForJotForm() {
        if (typeof JFCustomWidget !== 'undefined') {
            console.log('JotForm Widget API available');
            
            // Subscribe to ready event
            JFCustomWidget.subscribe('ready', function() {
                console.log('Widget ready');
                initCameraWidget();
                
                // Send initial empty data
                JFCustomWidget.sendData({
                    value: '',
                    valid: true
                });
            });
            
            // Handle submit polling
            JFCustomWidget.subscribe('submit', function() {
                console.log('Submit event - photos:', uploadedPhotos.length);
                
                // Return simple text value
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
            
            // Handle the polling requests
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
    console.log('Initializing camera widget...');
    
    // Set up event listeners
    document.getElementById('start-btn').addEventListener('click', startCamera);
    document.getElementById('capture-btn').addEventListener('click', capturePhoto);
    document.getElementById('cancel-btn').addEventListener('click', cancelCamera);
    document.getElementById('approve-btn').addEventListener('click', approvePhoto);
    document.getElementById('retake-btn').addEventListener('click', retakePhoto);
    document.getElementById('add-more-btn').addEventListener('click', addMorePhotos);
    document.getElementById('done-btn').addEventListener('click', finish);
    
    console.log('Camera widget initialized successfully');
}

function showState(state) {
    const states = ['initial', 'camera', 'preview', 'gallery'];
    states.forEach(s => {
        const el = document.getElementById(s + '-state');
        if (el) el.style.display = 'none';
    });
    
    const currentState = document.getElementById(state + '-state');
    if (currentState) {
        currentState.style.display = 'block';
    }
    
    if (state === 'gallery') {
        updateGallery();
    }
    
    // Update widget height for JotForm
    updateHeight(state);
}

function updateHeight(state) {
    const heights = { 
        initial: 100, 
        camera: 300, 
        preview: 300, 
        gallery: 200 + (uploadedPhotos.length * 60)
    };
    
    try {
        if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.requestFrameResize) {
            JFCustomWidget.requestFrameResize(heights[state] || 100);
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

function cancelCamera() {
    stopCamera();
    showState('initial');
}

function retakePhoto() {
    showState('camera');
    startCamera();
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
    const countElement = document.getElementById('photo-count');
    const doneBtn = document.getElementById('done-btn');
    
    if (countElement) {
        countElement.textContent = uploadedPhotos.length;
    }
    
    if (doneBtn) {
        doneBtn.textContent = `Done (${uploadedPhotos.length})`;
    }
    
    if (list) {
        list.innerHTML = uploadedPhotos.map((photo, i) => 
            `<img src="${photo.dataUrl}" style="width: 50px; height: 50px; margin: 2px; border-radius: 4px; object-fit: cover;">`
        ).join('');
    }
}

function addMorePhotos() {
    showState('initial');
}

function finish() {
    sendDataToJotForm();
    alert(`${uploadedPhotos.length} photos ready!`);
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded');
    // If JotForm widget API is not available, initialize directly
    if (typeof JFCustomWidget === 'undefined') {
        console.log('JotForm not detected, initializing directly');
        initCameraWidget();
    }
});
