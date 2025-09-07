console.log('🚀 Camera Widget Loading...');

let currentStream = null;
let uploadedPhotos = []; // Array to store multiple photos

function initCameraWidget() {
    console.log('📍 initCameraWidget called');
    
    const container = document.getElementById('camera-widget');
    if (!container) {
        console.error('❌ No camera-widget container found');
        return;
    }
    
    console.log('✅ Container found:', container);
    
    // Create the interface with improved thumbnail view
    container.innerHTML = `
        <div class="widget-container" style="padding: 20px; text-align: center; background: #f8f9fa; border-radius: 8px;">
            <div id="initial-state" style="display: block;">
                <button id="start-camera-btn" style="
                    background: #007bff; 
                    color: white; 
                    padding: 15px 30px; 
                    border: none; 
                    border-radius: 5px; 
                    font-size: 16px; 
                    cursor: pointer;
                    width: 200px;
                    height: 50px;
                ">📷 Take Photo</button>
                <p style="margin-top: 10px; color: #666; font-size: 14px;">Click to start camera</p>
            </div>
            
            <div id="camera-state" style="display: none;">
                <div style="background: #000; width: 100%; height: 300px; margin-bottom: 15px; border-radius: 5px; position: relative;">
                    <video id="camera-video" style="width: 100%; height: 100%; object-fit: cover;" playsinline muted></video>
                </div>
                <button id="capture-btn" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">📸 Capture</button>
                <button id="cancel-btn" style="background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">✖ Cancel</button>
            </div>
            
            <div id="preview-state" style="display: none;">
                <canvas id="photo-canvas" style="max-width: 100%; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 15px;"></canvas><br>
                <button id="approve-btn" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">✓ Approve</button>
                <button id="retake-btn" style="background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">↻ Retake</button>
            </div>
            
            <div id="uploading-state" style="display: none;">
                <p>Uploading...</p>
            </div>
            
            <div id="thumbnail-state" style="display: none;">
                <p style="color: green; font-weight: bold;">Photo uploaded successfully!</p>
                <div style="margin: 15px 0;">
                    <img id="uploaded-thumbnail" style="width: 150px; height: 150px; object-fit: cover; border-radius: 5px; cursor: pointer; border: 2px solid #28a745;" alt="Thumbnail">
                </div>
                <div style="margin: 15px 0;">
                    <button id="replace-photo-btn" style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">Replace This Photo</button>
                    <button id="add-another-btn" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">📷 Add Another Photo</button>
                </div>
                <div id="uploaded-photos-container" style="margin-top: 20px; display: none;">
                    <h4 style="margin-bottom: 10px;">Your Uploaded Photos:</h4>
                    <div id="uploaded-photos-list" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;"></div>
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ Interface created');
    setupClickHandlers();
    resizeWidget(75);
    console.log('✅ Widget setup complete');
}

function setupClickHandlers() {
    console.log('📍 Setting up click handlers...');
    
    // Start camera button
    const startBtn = document.getElementById('start-camera-btn');
    if (startBtn) {
        startBtn.onclick = function(e) {
            console.log('🎯 START CAMERA CLICKED!');
            e.preventDefault();
            startCamera();
        };
    }
    
    // Capture button
    const captureBtn = document.getElementById('capture-btn');
    if (captureBtn) {
        captureBtn.onclick = function(e) {
            console.log('🎯 CAPTURE CLICKED!');
            e.preventDefault();
            capturePhoto();
        };
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.onclick = function(e) {
            console.log('🎯 CANCEL CLICKED!');
            e.preventDefault();
            stopCamera();
            showState('initial');
        };
    }
    
    // Approve button
    const approveBtn = document.getElementById('approve-btn');
    if (approveBtn) {
        approveBtn.onclick = function(e) {
            console.log('🎯 APPROVE CLICKED!');
            e.preventDefault();
            approvePhoto();
        };
    }
    
    // Retake button
    const retakeBtn = document.getElementById('retake-btn');
    if (retakeBtn) {
        retakeBtn.onclick = function(e) {
            console.log('🎯 RETAKE CLICKED!');
            e.preventDefault();
            showState('camera');
        };
    }
    
    // Replace button
    const replaceBtn = document.getElementById('replace-photo-btn');
    if (replaceBtn) {
        replaceBtn.onclick = function(e) {
            console.log('🎯 REPLACE CLICKED!');
            e.preventDefault();
            // Remove the current photo and go back to camera
            if (uploadedPhotos.length > 0) {
                uploadedPhotos.pop(); // Remove the last photo
                updateUploadedPhotosDisplay();
            }
            showState('initial');
        };
    }
    
    // Add Another button
    const addAnotherBtn = document.getElementById('add-another-btn');
    if (addAnotherBtn) {
        addAnotherBtn.onclick = function(e) {
            console.log('🎯 ADD ANOTHER CLICKED!');
            e.preventDefault();
            showState('initial');
        };
    }
}

function showState(stateName) {
    console.log('📍 showState called with:', stateName);
    
    const states = ['initial', 'camera', 'preview', 'uploading', 'thumbnail'];
    
    states.forEach(state => {
        const element = document.getElementById(state + '-state');
        if (element) {
            element.style.display = 'none';
        }
    });
    
    const targetElement = document.getElementById(stateName + '-state');
    if (targetElement) {
        targetElement.style.display = 'block';
        console.log('✅ Shown:', stateName);
    }
    
    // Show/hide uploaded photos container based on whether we have multiple photos
    const photosContainer = document.getElementById('uploaded-photos-container');
    if (photosContainer) {
        photosContainer.style.display = uploadedPhotos.length > 1 ? 'block' : 'none';
    }
    
    const heights = {
        'initial': 75,
        'camera': 400,
        'preview': 400,
        'uploading': 120,
        'thumbnail': uploadedPhotos.length > 1 ? 300 : 200 // Dynamic height based on number of photos
    };
    
    resizeWidget(heights[stateName] || 75);
}

function resizeWidget(height) {
    console.log('📍 resizeWidget called with height:', height);
    
    setTimeout(() => {
        try {
            if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.resize) {
                window.JFCustomWidget.resize(height);
                return;
            }
            
            if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.resize) {
                JFCustomWidget.resize(height);
                return;
            }
            
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'setHeight', height: height }, '*');
                return;
            }
            
        } catch (e) {
            console.error('❌ Resize error:', e);
        }
    }, 100);
}

async function startCamera() {
    console.log('📍 startCamera called');
    
    try {
        resizeWidget(400);
        showState('camera');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        
        currentStream = stream;
        
        const video = document.getElementById('camera-video');
        if (!video) {
            throw new Error('Video element not found');
        }
        
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
            video.play().catch(e => console.log('Video play issue:', e));
        };
        
    } catch (error) {
        console.error('❌ Camera error:', error);
        alert('Camera error: ' + error.message);
        showState('initial');
        resizeWidget(75);
    }
}

function stopCamera() {
    console.log('📍 stopCamera called');
    
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
        
        const video = document.getElementById('camera-video');
        if (video) {
            video.srcObject = null;
        }
    }
}

function capturePhoto() {
    console.log('📍 capturePhoto called');
    
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('photo-canvas');
    
    if (!video || !canvas) {
        console.error('❌ Video or canvas not found');
        return;
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert('Video not ready. Please wait and try again.');
        return;
    }
    
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    stopCamera();
    showState('preview');
}

function approvePhoto() {
    console.log('📍 approvePhoto called');
    
    showState('uploading');
    
    setTimeout(() => {
        const canvas = document.getElementById('photo-canvas');
        if (canvas) {
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const thumbnail = document.getElementById('uploaded-thumbnail');
                if (thumbnail) {
                    thumbnail.src = url;
                    thumbnail.onclick = () => window.open(url, '_blank');
                }
                
                // Add to uploaded photos array
                uploadedPhotos.push({
                    url: url,
                    blob: blob,
                    timestamp: Date.now()
                });
                
                // Update the display of all uploaded photos
                updateUploadedPhotosDisplay();
                
                // Submit to JotForm
                const fileName = 'photo-' + Date.now() + '.jpg';
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.submit) {
                            window.JFCustomWidget.submit({
                                type: 'file',
                                data: {
                                    file: reader.result,
                                    filename: fileName
                                }
                            });
                        }
                    } catch (e) {
                        console.error('❌ Submit error:', e);
                    }
                };
                reader.readAsDataURL(blob);
                
                showState('thumbnail');
                
            }, 'image/jpeg', 0.8);
        }
    }, 1500);
}

function updateUploadedPhotosDisplay() {
    const photosList = document.getElementById('uploaded-photos-list');
    const photosContainer = document.getElementById('uploaded-photos-container');
    
    if (!photosList || !photosContainer) return;
    
    // Clear existing photos
    photosList.innerHTML = '';
    
    // Add each uploaded photo
    uploadedPhotos.forEach((photo, index) => {
        const photoElement = document.createElement('div');
        photoElement.style.position = 'relative';
        photoElement.style.cursor = 'pointer';
        
        photoElement.innerHTML = `
            <img src="${photo.url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; border: 2px solid #007bff;">
            <button onclick="removePhoto(${index})" style="
                position: absolute;
                top: -8px;
                right: -8px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                font-size: 12px;
                cursor: pointer;
            ">✕</button>
        `;
        
        photoElement.onclick = () => window.open(photo.url, '_blank');
        photosList.appendChild(photoElement);
    });
    
    // Show container if we have multiple photos
    photosContainer.style.display = uploadedPhotos.length > 1 ? 'block' : 'none';
    
    // Adjust container height based on number of photos
    const thumbnailState = document.getElementById('thumbnail-state');
    if (thumbnailState && thumbnailState.style.display === 'block') {
        const newHeight = uploadedPhotos.length > 1 ? 350 : 200;
        resizeWidget(newHeight);
    }
}

// Global function to remove photos
window.removePhoto = function(index) {
    if (confirm('Are you sure you want to remove this photo?')) {
        // Revoke the object URL to free memory
        URL.revokeObjectURL(uploadedPhotos[index].url);
        uploadedPhotos.splice(index, 1);
        updateUploadedPhotosDisplay();
        
        // If no photos left, go back to initial state
        if (uploadedPhotos.length === 0) {
            showState('initial');
        }
    }
};

// Initialize the widget
function tryInit() {
    const container = document.getElementById('camera-widget');
    if (container) {
        initCameraWidget();
        return true;
    }
    return false;
}

if (!tryInit()) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    }
    setTimeout(tryInit, 100);
    setTimeout(tryInit, 500);
}

// Debug function
window.debugCameraSimple = function() {
    console.log('🐛 Debug Info:');
    console.log('- Uploaded photos:', uploadedPhotos.length);
    console.log('- Container:', document.getElementById('camera-widget'));
    console.log('- JFCustomWidget:', typeof window.JFCustomWidget !== 'undefined' ? 'available' : 'not found');
};

console.log('📋 Run window.debugCameraSimple() for debug info');
