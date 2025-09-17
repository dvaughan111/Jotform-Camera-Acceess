console.log('Camera Widget Loading...');

let currentStream = null;
let uploadedPhotos = [];
let isSubmitting = false;

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
            
            // Handle submit polling - FIXED: Return simple string, not object
            JFCustomWidget.subscribe('submit', function() {
                console.log('Submit event - photos:', uploadedPhotos.length);
                
                // Return simple text value (not files - that causes timeouts)
                if (uploadedPhotos.length > 0) {
                    return `${uploadedPhotos.length} photos captured`;
                } else {
                    return '';
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
        currentState.style.display = 'flex';
    }
    
    if (state === 'gallery') {
        updateGallery();
    }
    
    // Update widget height for JotForm
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
            JFCustomWidget.requestFrameResize(heights[state] || 150);
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
            
            // Make image clickable to view larger version
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

// View photo in modal
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

// Delete a photo
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
    // Send final data to JotForm
    sendDataToJotForm();
    
    // For JotForm, we need to signal that we're done
    if (typeof JFCustomWidget !== 'undefined') {
        try {
            // This tells JotForm that the widget has completed its task
            JFCustomWidget.submitForm();
        } catch (e) {
            console.error('Error submitting to JotForm:', e);
        }
    }
    
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
