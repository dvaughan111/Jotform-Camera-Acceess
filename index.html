console.log('Camera Widget Loading...');

let currentStream = null;
let uploadedPhotos = [];
let isSubmitting = false;

// JotForm Widget Integration - CORRECTED based on documentation
(function() {
    function waitForJotForm() {
        if (typeof JFCustomWidget !== 'undefined') {
            console.log('JotForm Custom Widget API available');
            
            // Subscribe to ready event - CRITICAL: Must listen first
            JFCustomWidget.subscribe('ready', function(data) {
                console.log('Widget ready with data:', data);
                initCameraWidget();
                
                // Send initial empty data
                JFCustomWidget.sendData({
                    value: '',
                    valid: true
                });
            });
            
            // CORRECTED: Submit event handler - must use sendSubmit()
            JFCustomWidget.subscribe('submit', function() {
                console.log('Form submit event received');
                
                if (isSubmitting) {
                    console.log('Already submitting, please wait...');
                    return;
                }
                
                isSubmitting = true;
                
                try {
                    // Prepare submission data
                    let submissionValue = '';
                    
                    if (uploadedPhotos.length > 0) {
                        submissionValue = uploadedPhotos.length === 1 ? 
                            "1 photo captured" : 
                            `${uploadedPhotos.length} photos captured`;
                    }
                    
                    console.log('Submitting value:', submissionValue);
                    
                    // CORRECTED: Use sendSubmit() instead of returning data
                    JFCustomWidget.sendSubmit({
                        valid: true,
                        value: submissionValue
                    });
                    
                } catch (error) {
                    console.error('Error during submission:', error);
                    JFCustomWidget.sendSubmit({
                        valid: false,
                        value: 'error',
                        message: error.message
                    });
                } finally {
                    isSubmitting = false;
                }
            });
            
            // Handle populate requests
            JFCustomWidget.subscribe('populate', function(data) {
                console.log('Populate event received:', data);
                
                if (data && data.value) {
                    console.log('Existing form data:', data.value);
                    // You could parse and restore existing data here
                }
                
                return {
                    value: uploadedPhotos.length > 0 ? 
                        `${uploadedPhotos.length} photos captured` : 
                        '',
                    valid: true
                };
            });
            
        } else {
            setTimeout(waitForJotForm, 50);
        }
    }
    
    // Start waiting for JotForm API
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
        currentState.style.display = 'flex';
    }
    
    if (state === 'gallery') {
        updateGallery();
    }
    
    updateHeight(state);
}

function updateHeight(state) {
    const heights = { 
        initial: 150, 
        camera: 400, 
        preview: 400, 
        gallery: 300 + (uploadedPhotos.length * 180)
    };
    
    try {
        if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.requestFrameResize) {
            JFCustomWidget.requestFrameResize({
                height: heights[state] || 150
            });
        }
    } catch (e) {
        console.log('Height error:', e);
    }
}

function showStatus(message, type) {
    const statusArea = document.getElementById('status-area');
    statusArea.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
    
    if (type === 'success') {
        setTimeout(() => {
            statusArea.innerHTML = '';
        }, 3000);
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
        
        video.play().catch(console.error);
        
    } catch (error) {
        showStatus('Camera access denied or unavailable', 'error');
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
        
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
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
    
    if (list) {
        list.innerHTML = '';
        
        if (uploadedPhotos.length === 0) {
            list.innerHTML = '<div class="empty-state">No photos uploaded yet</div>';
            return;
        }
        
        uploadedPhotos.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            
            const img = document.createElement('img');
            img.src = photo.dataUrl;
            img.className = 'photo-thumbnail';
            img.alt = `Uploaded photo ${index + 1}`;
            
            img.addEventListener('click', () => viewPhoto(photo.dataUrl));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'photo-delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deletePhoto(index);
            });
            
            photoItem.appendChild(img);
            photoItem.appendChild(deleteBtn);
            list.appendChild(photoItem);
        });
    }
}

function viewPhoto(url) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <img src="${url}" class="modal-image" alt="Full size photo">
            <button class="modal-close">×</button>
        </div>
    `;
    
    modal.querySelector('.modal-close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    document.body.appendChild(modal);
}

function deletePhoto(index) {
    if (confirm('Are you sure you want to delete this photo?')) {
        uploadedPhotos.splice(index, 1);
        updateGallery();
        sendDataToJotForm();
    }
}

function addMorePhotos() {
    showState('initial');
}

function finish() {
    showStatus('Upload completed successfully!', 'success');
    sendDataToJotForm();
}

function sendDataToJotForm() {
    try {
        if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.sendData) {
            const value = uploadedPhotos.length > 0 ? 
                (uploadedPhotos.length === 1 ? "1 photo captured" : `${uploadedPhotos.length} photos captured`) : 
                '';
            
            JFCustomWidget.sendData({
                value: value,
                valid: true
            });
            
            console.log('Data sent to JotForm:', value);
        }
    } catch (e) {
        console.error('Error sending data to JotForm:', e);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded');
    
    // Fallback: if JotForm widget API is not available after 2 seconds, initialize directly
    setTimeout(function() {
        if (typeof JFCustomWidget === 'undefined') {
            console.log('JotForm not detected, initializing directly');
            initCameraWidget();
        }
    }, 2000);
});
