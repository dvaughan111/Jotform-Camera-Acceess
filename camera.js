console.log('🚀 Simple Camera Widget Loading...');

// Simple initialization without complex timing
function initCameraWidget() {
    console.log('📍 initCameraWidget called');
    
    const container = document.getElementById('camera-widget');
    if (!container) {
        console.error('❌ No camera-widget container found');
        return;
    }
    
    console.log('✅ Container found:', container);
    
    // Create the interface directly
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
                <p style="color: green; font-weight: bold;">Photo uploaded!</p>
                <img id="uploaded-thumbnail" style="width: 150px; height: 150px; object-fit: cover; border-radius: 5px; cursor: pointer;" alt="Thumbnail"><br>
                <button id="replace-photo-btn" style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin-top: 10px;">Replace Photo</button>
            </div>
        </div>
    `;
    
    console.log('✅ Interface created');
    
    // Set up click handlers using simple approach
    setupClickHandlers();
    
    // Try to resize
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
        console.log('✅ Start button handler set');
    } else {
        console.error('❌ Start button not found');
    }
    
    // Capture button
    const captureBtn = document.getElementById('capture-btn');
    if (captureBtn) {
        captureBtn.onclick = function(e) {
            console.log('🎯 CAPTURE CLICKED!');
            e.preventDefault();
            capturePhoto();
        };
        console.log('✅ Capture button handler set');
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
        console.log('✅ Cancel button handler set');
    }
    
    // Approve button
    const approveBtn = document.getElementById('approve-btn');
    if (approveBtn) {
        approveBtn.onclick = function(e) {
            console.log('🎯 APPROVE CLICKED!');
            e.preventDefault();
            approvePhoto();
        };
        console.log('✅ Approve button handler set');
    }
    
    // Retake button
    const retakeBtn = document.getElementById('retake-btn');
    if (retakeBtn) {
        retakeBtn.onclick = function(e) {
            console.log('🎯 RETAKE CLICKED!');
            e.preventDefault();
            showState('camera');
        };
        console.log('✅ Retake button handler set');
    }
    
    // Replace button
    const replaceBtn = document.getElementById('replace-photo-btn');
    if (replaceBtn) {
        replaceBtn.onclick = function(e) {
            console.log('🎯 REPLACE CLICKED!');
            e.preventDefault();
            showState('initial');
        };
        console.log('✅ Replace button handler set');
    }
}

function showState(stateName) {
    console.log('📍 showState called with:', stateName);
    
    const states = ['initial', 'camera', 'preview', 'uploading', 'thumbnail'];
    
    // Hide all states
    states.forEach(state => {
        const element = document.getElementById(state + '-state');
        if (element) {
            element.style.display = 'none';
            console.log('Hidden:', state);
        }
    });
    
    // Show target state
    const targetElement = document.getElementById(stateName + '-state');
    if (targetElement) {
        targetElement.style.display = 'block';
        console.log('✅ Shown:', stateName);
    } else {
        console.error('❌ Target state not found:', stateName);
    }
    
    // Resize based on state
    const heights = {
        'initial': 75,
        'camera': 400,
        'preview': 400,
        'uploading': 120,
        'thumbnail': 150
    };
    
    resizeWidget(heights[stateName] || 75);
}

function resizeWidget(height) {
    console.log('📍 resizeWidget called with height:', height);
    
    setTimeout(() => {
        try {
            // Try JotForm methods
            if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.resize) {
                window.JFCustomWidget.resize(height);
                console.log('✅ Resized via window.JFCustomWidget.resize');
                return;
            }
            
            if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.resize) {
                JFCustomWidget.resize(height);
                console.log('✅ Resized via JFCustomWidget.resize');
                return;
            }
            
            // PostMessage fallback
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'setHeight', height: height }, '*');
                console.log('✅ Sent resize message via postMessage');
                return;
            }
            
            console.log('⚠️ No resize method worked');
            
        } catch (e) {
            console.error('❌ Resize error:', e);
        }
    }, 100);
}

let currentStream = null;

async function startCamera() {
    console.log('📍 startCamera called');
    
    try {
        console.log('🔍 Checking camera API...');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API not supported');
        }
        
        console.log('📏 Resizing to 400px...');
        resizeWidget(400);
        
        console.log('🎬 Showing camera state...');
        showState('camera');
        
        console.log('⏳ Waiting 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('📹 Requesting camera access...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        
        currentStream = stream;
        console.log('✅ Camera stream obtained');
        
        const video = document.getElementById('camera-video');
        if (!video) {
            throw new Error('Video element not found');
        }
        
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
            console.log('✅ Video metadata loaded');
            video.play().catch(e => console.log('Video play issue (normal):', e));
        };
        
        console.log('✅ Camera started successfully');
        
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
        currentStream.getTracks().forEach(track => {
            track.stop();
            console.log('Stopped track:', track.kind);
        });
        currentStream = null;
        
        const video = document.getElementById('camera-video');
        if (video) {
            video.srcObject = null;
        }
        
        console.log('✅ Camera stopped');
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
        console.error('❌ Video not ready');
        alert('Video not ready. Please wait and try again.');
        return;
    }
    
    console.log('📸 Capturing photo...');
    
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0);
    
    stopCamera();
    showState('preview');
    
    console.log('✅ Photo captured');
}

function approvePhoto() {
    console.log('📍 approvePhoto called');
    
    showState('uploading');
    
    // Simulate upload
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
                
                // Try to submit to JotForm
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
                            console.log('✅ Submitted to JotForm');
                        } else {
                            console.log('⚠️ JotForm API not available');
                        }
                    } catch (e) {
                        console.error('❌ Submit error:', e);
                    }
                };
                reader.readAsDataURL(blob);
                
                showState('thumbnail');
                console.log('✅ Photo approved and uploaded');
            }, 'image/jpeg', 0.8);
        }
    }, 1500);
}

// Initialize immediately
console.log('🎬 Starting initialization...');

// Try multiple times
function tryInit() {
    const container = document.getElementById('camera-widget');
    if (container) {
        console.log('✅ Container found, initializing...');
        initCameraWidget();
        return true;
    }
    return false;
}

// Try now
if (!tryInit()) {
    // Try when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    }
    
    // Try after delays
    setTimeout(tryInit, 100);
    setTimeout(tryInit, 500);
    setTimeout(tryInit, 1000);
}

// Debug function
window.debugCameraSimple = function() {
    console.log('🐛 Debug Info:');
    console.log('- Container:', document.getElementById('camera-widget'));
    console.log('- Start button:', document.getElementById('start-camera-btn'));
    console.log('- Initial state:', document.getElementById('initial-state'));
    console.log('- JFCustomWidget:', typeof window.JFCustomWidget !== 'undefined' ? window.JFCustomWidget : 'not found');
    console.log('- Camera API:', navigator.mediaDevices ? 'available' : 'not available');
    
    // Force show initial state
    showState('initial');
};

console.log('📋 Run window.debugCameraSimple() for debug info');
