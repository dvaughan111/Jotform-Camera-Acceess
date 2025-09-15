console.log('🚀 Camera Widget Loading...');

let currentStream = null;
let uploadedPhotos = [];

function initCameraWidget() {
    console.log('📍 initCameraWidget called');
    
    const container = document.getElementById('camera-widget');
    if (!container) {
        console.error('❌ No camera-widget container found');
        return;
    }
    
    // Create the interface with multiple photo support
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
                    <video id="camera-video" playsinline muted></video>
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
            
            <!-- THUMBNAIL STATE - UPDATED FOR MULTIPLE PHOTOS -->
            <div id="thumbnail-state" style="display: none;">
                <p class="success-message">Photo added successfully!</p>
                
                <!-- Action Buttons -->
                <div class="actions-container">
                    <button id="add-another-btn" class="success-btn">📷 Add Another Photo</button>
                    <button id="done-btn" class="primary-btn">✅ Done Uploading</button>
                </div>
                
                <!-- Uploaded Photos Gallery - FIXED VISIBILITY -->
                <div id="uploaded-photos-container" class="photo-gallery">
                    <h4 class="gallery-title">Your Uploaded Photos:</h4>
                    <div id="uploaded-photos-list" class="uploaded-photos-list"></div>
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ Interface created');
    setupClickHandlers();
    resizeWidget(100);
    console.log('✅ Widget setup complete');
}

function setupClickHandlers() {
    console.log('📍 Setting up click handlers...');
    
    // Start camera button
    document.getElementById('start-camera-btn').onclick = function(e) {
        e.preventDefault();
        startCamera();
    };
    
    // Capture button
    document.getElementById('capture-btn').onclick = function(e) {
        e.preventDefault();
        capturePhoto();
    };
    
    // Cancel button
    document.getElementById('cancel-btn').onclick = function(e) {
        e.preventDefault();
        stopCamera();
        showState('initial');
    };
    
    // Approve button
    document.getElementById('approve-btn').onclick = function(e) {
        e.preventDefault();
        approvePhoto();
    };
    
    // Retake button
    document.getElementById('retake-btn').onclick = function(e) {
        e.preventDefault();
        showState('camera');
    };
    
    // Add Another button
    document.getElementById('add-another-btn').onclick = function(e) {
        e.preventDefault();
        showState('initial');
    };
    
    // Done button
    document.getElementById('done-btn').onclick = function(e) {
        e.preventDefault();
        alert('All photos have been added! You can continue with your form.');
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
    
    // Update photos display when showing thumbnail state
    if (stateName === 'thumbnail') {
        updateUploadedPhotosDisplay();
    }
    
    // Adjust height based on number of photos
    const photoCount = uploadedPhotos.length;
    const baseHeight = 100;
    const photoHeight = Math.min(photoCount * 30, 200); // Max additional height
    const heights = {
        'initial': baseHeight,
        'camera': 450,
        'preview': 450,
        'uploading': 150,
        'thumbnail': baseHeight + photoHeight + 200 // Base + photos + buttons
    };
    
    resizeWidget(heights[stateName] || baseHeight);
}

function resizeWidget(height) {
    setTimeout(() => {
        try {
            if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.requestFrameResize) {
                window.JFCustomWidget.requestFrameResize(height);
            } else if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'setHeight', height: height }, '*');
            }
        } catch (e) {
            console.error('❌ Resize error:', e);
        }
    }, 100);
}

async function startCamera() {
    try {
        resizeWidget(450);
        showState('camera');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        currentStream = stream;
        const video = document.getElementById('camera-video');
        if (video) {
            video.srcObject = stream;
            video.onloadedmetadata = () => video.play().catch(console.log);
        }
    } catch (error) {
        alert('Camera error: ' + error.message);
        showState('initial');
        resizeWidget(100);
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
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                
                // Add to uploaded photos array
                const photoData = {
                    url: url,
                    blob: blob,
                    timestamp: Date.now(),
                    fileName: `photo-${Date.now()}-${uploadedPhotos.length + 1}.jpg`
                };
                
                uploadedPhotos.push(photoData);
                
                // Submit to JotForm
                submitPhotoToJotForm(photoData);
                
                updateUploadedPhotosDisplay();
                showState('thumbnail');
                
            }, 'image/jpeg', 0.85);
        }
    }, 1000);
}

function submitPhotoToJotForm(photoData) {
    // Store in a simple global variable that JotForm can access
    if (!window.widgetPhotos) {
        window.widgetPhotos = [];
    }
    
    // Convert to base64 string (most compatible)
    const reader = new FileReader();
    reader.onload = function() {
        window.widgetPhotos.push({
            filename: photoData.fileName,
            data: reader.result,
            size: photoData.blob.size,
            type: 'image/jpeg'
        });
        
        console.log('✅ Photo stored:', photoData.fileName);
        console.log('Total photos:', window.widgetPhotos.length);
        
        // Try multiple ways to send data to JotForm
        try {
            // Method 1: Direct sendData
            if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.sendData) {
                window.JFCustomWidget.sendData({
                    value: window.widgetPhotos
                });
            }
            
            // Method 2: Set global value
            window.jotformWidgetValue = window.widgetPhotos;
            
            // Method 3: Post message to parent
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'widgetData',
                    value: window.widgetPhotos
                }, '*');
            }
            
        } catch (e) {
            console.error('❌ Submit error:', e);
        }
    };
    reader.readAsDataURL(photoData.blob);
}

function updateUploadedPhotosDisplay() {
    const photosList = document.getElementById('uploaded-photos-list');
    const photosContainer = document.getElementById('uploaded-photos-container');
    
    if (!photosList || !photosContainer) return;
    
    photosList.innerHTML = '';
    
    if (uploadedPhotos.length === 0) {
        photosList.innerHTML = '<div class="empty-state">No photos uploaded yet</div>';
        photosContainer.style.display = 'none';
        return;
    }
    
    photosContainer.style.display = 'block';
    
    // Display ALL uploaded photos
    uploadedPhotos.forEach((photo, index) => {
        const photoElement = document.createElement('div');
        photoElement.className = 'photo-thumbnail';
        photoElement.innerHTML = `
            <img src="${photo.url}" alt="Photo ${index + 1}">
            <button class="photo-delete-btn" data-index="${index}">✕</button>
        `;
        
        // Click to view full image
        photoElement.onclick = () => window.open(photo.url, '_blank');
        
        // Delete button handler
        const deleteBtn = photoElement.querySelector('.photo-delete-btn');
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            removePhoto(index);
        };
        
        photosList.appendChild(photoElement);
    });
}

function removePhoto(index) {
    if (confirm('Are you sure you want to remove this photo?')) {
        // Revoke the object URL to free memory
        URL.revokeObjectURL(uploadedPhotos[index].url);
        
        // Remove from display array
        uploadedPhotos.splice(index, 1);
        
        // Remove from JotForm data array too
        if (window.widgetPhotos) {
            window.widgetPhotos.splice(index, 1);
            
            // Update JotForm with new data
            try {
                if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.sendData) {
                    window.JFCustomWidget.sendData({
                        value: window.widgetPhotos
                    });
                }
                
                // Update global value
                window.jotformWidgetValue = window.widgetPhotos;
                
            } catch (e) {
                console.error('❌ Remove photo error:', e);
            }
        }
        
        // Update display
        updateUploadedPhotosDisplay();
        
        // If no photos left, go back to initial state
        if (uploadedPhotos.length === 0) {
            showState('initial');
        }
    }
}

// Debug function - call from console: debugWidgetStatus()
function debugWidgetStatus() {
    console.log('🔍 Widget Debug Status:');
    console.log('- Photos captured:', uploadedPhotos.length);
    console.log('- Widget photos array:', window.widgetPhotos?.length || 0);
    console.log('- JFCustomWidget available:', typeof window.JFCustomWidget !== 'undefined');
    console.log('- sendData method:', typeof window.JFCustomWidget?.sendData);
    console.log('- Global widget value:', window.jotformWidgetValue?.length || 0);
    
    if (window.widgetPhotos) {
        window.widgetPhotos.forEach((photo, index) => {
            console.log(`  Photo ${index + 1}:`, photo.filename, photo.size, 'bytes');
        });
    }
}

// Make debug function globally available
window.debugWidgetStatus = debugWidgetStatus;

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
    setTimeout(tryInit, 100);
}

// Simplified JotForm Widget API initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize widget data
    if (!window.widgetPhotos) {
        window.widgetPhotos = [];
    }
    
    // Initialize global value
    window.jotformWidgetValue = [];
    
    console.log('🎯 Widget data initialized');
});

// Multiple fallback methods for JotForm integration
window.addEventListener('load', function() {
    setTimeout(function() {
        if (typeof window.JFCustomWidget !== 'undefined') {
            console.log('🎯 JotForm Widget API available on load');
            
            try {
                // Send initial empty data
                window.JFCustomWidget.sendData({
                    value: window.widgetPhotos || []
                });
            } catch (e) {
                console.log('JotForm sendData not ready yet');
            }
        }
    }, 1000);
});

// Listen for JotForm messages
window.addEventListener('message', function(event) {
    try {
        if (event.origin.includes('jotform.com') || event.origin.includes('jotform.io')) {
            if (event.data && event.data.type === 'getWidgetValue') {
                console.log('📤 JotForm requesting widget value');
                event.source.postMessage({
                    type: 'widgetValue',
                    value: window.widgetPhotos || []
                }, event.origin);
            }
        }
    } catch (e) {
        console.log('Message handling error:', e);
    }
});

// Additional fallback - expose getValue function
window.getWidgetValue = function() {
    console.log('📤 Direct getValue called:', window.widgetPhotos?.length || 0, 'photos');
    return window.widgetPhotos || [];
};

// Alternative widget data getter
window.getWidgetData = function() {
    return {
        value: window.widgetPhotos || [],
        valid: true
    };
};

console.log('📋 Multiple photo upload widget loaded!');
