// for project
var timeline;
var target;
var videoCanvasWidth;
var videoCanvasHeight;
var aspectRatioX = 1.0;
var aspectRatioY = 1.0;
var frameInterval = 1 / 30;

// for hit-test
var drawHint = false;	// false: not to draw the hint rect;
var ptInCanvas = false;	// false: not to draw the hint rect;
var hitResult;
var hitPosX;
var hitPosY;

// for browser support
var isIE9 = false;
var isChrome = false;
var isFirefox = false;
var isSafari = false;
var isiOSSafari = false;
var browserNotSupportVideo = false;
var browserSupportVideoMP4 = false;
var browserSupportVideoWebm = false;
var browserSupportAudioOgg = false;
var browserSupportAudioM4a = false;
var IsOnlyWebmSource = false;

// for iOS Safari support
var videoForiOS;
var videoForiOSCanPlay = false;
// for iOS Safari video element
var videoForiOSisPlay = false;
var videoForiOSisEnded = false;

///////////////////////////////////////////////////////////////////////////////
function createProject() {
    // Output timeline to JSON file
    var data = JSON.encode(project);
    $("#source")[0].value = data;
}

///////////////////////////////////////////////////////////////////////////////
// Update tooltips for playback buttons
function updateTooltips() {
    $("#controlBar .playBtn").text(strPlayBtn);
    $("#controlBar .pauseBtn").text(strPauseBtn);
    $("#controlBar .prevFrameBtn").text(strPrevFrameBtn);
    $("#controlBar .nextFrameBtn").text(strNextFrameBtn);
    $("#controlBar .volumeBtn").text(strMuteBtn);
    $("#controlBar .muteBtn").text(strUnmuteBtn);
    $("#controlBar .fullscreenBtn").text(strFullScreenBtn);
    $("#controlBar .restoreFullscreenBtn").text(strRestoreFullscreenBtn);
}

///////////////////////////////////////////////////////////////////////////////
function preLoadProject() {
    // [auto load]
    // Input JSON file
    var data = JSON.decode($("#source")[0].value);
    timeline = JVRE.Persistent.unserialize(data);

    // Check the browser is supported or not
    checkBrowserCompatibility();

    // For browser doesn't support html5
    if (browserNotSupportVideo) {
        // show "Browser not supported" string
        var htmlElement = "";
        if (isSafari) {
            htmlElement = '"<div id="notSupportString">' + notSupportStringVideo + '</br>' + notSupportStringQTime + '</div>"';
        }
        else {
            htmlElement = '"<div id="notSupportString">' + notSupportStringVideo + '</div>"';
        }

        $(htmlElement).appendTo("#standardView_videoPreviewContainerPlaceHolder");

        // disable all control buttons/slider if browser is not supported
        $("#controlBar .playBtn").button({ disabled: true });
        $("#controlBar .pauseBtn").button({ disabled: true });
        $("#controlBar .prevFrameBtn").button({ disabled: true });
        $("#controlBar .nextFrameBtn").button({ disabled: true });
        $("#controlBar .volumeBtn").button({ disabled: true });
        $("#controlBar .muteBtn").button({ disabled: true });
        $("#controlBar .volumeSlider").slider({ disabled: true });
        $("#controlBar .fullscreenBtn").button({ disabled: true });
        // hide timecode controls
        $("#controlBar .timeCodeTime").css('display', 'none');
        $("#controlBar .timeCodeDuration").css('display', 'none');
    }
    else {
        // Change/remove different video/audio format for different browser
        audioSourceForBrowser();
        // videoSourceForBrowser() should comes after audioSourceForBrowser()
        videoSourceForBrowser();

        // Load timeline
        render.source(timeline);
        render.log(false);
        render.diagnostic(false);
        render.load();
        
        // Get project frame rate for "next frame" and "previous frame"
        frameInterval = 1 / (timeline.prjFrameRate.v / 1000);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Check the browser is supported or not
function checkBrowserCompatibility() {
    // video
    if (!Modernizr.canvas) {
        browserNotSupportVideo = true;
    }
    else if (Modernizr.video) {
        if (Modernizr.video.h264) {
            browserSupportVideoMP4 = true;
        }
        else if (Modernizr.video.webm) {
            browserSupportVideoWebm = true;
        }
        else {
            browserNotSupportVideo = true;
        }
    }
    else {
        browserNotSupportVideo = true;
    }

    // audio
    if (Modernizr.audio.ogg) {
        browserSupportAudioOgg = true;	
    }
    else if (Modernizr.audio.m4a) {
        browserSupportAudioM4a = true;
    }

    // browser type
    //"ie" : Internet Explorer, "firefox" : Mozilla Firefox, "chrome" : Google Chrome, "safari" or "opera".
    if (Browser.ie9) {
        isIE9 = true;
    }
    else if (Browser.chrome) {
        isChrome = true;
    }
    else if (Browser.firefox) {
        if (Browser.version >= 4.0)
            isFirefox = true;
    }
    else if (Browser.safari) {
        if (Browser.Platform.ios) {
            isiOSSafari = true;
        }
        else if (Browser.version >= 4.0) {
            isSafari = true;
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
// Use different video source for different browser
function videoSourceForBrowser() {
    if (timeline == undefined)
        return;
    if (timeline._tracks[0]._clips[0] == undefined) {
        // if no video source, no need to deal with iOS compatibility
        isiOSSafari = false;
        return;
    }
    
    var sourcepathlength = timeline._tracks[0]._clips[0]._source._source.length;
    var IsWebmSource = timeline._tracks[0]._clips[0]._source._source.indexOf('.webm', sourcepathlength);
    if(IsWebmSource > 0) {
       IsOnlyWebmSource = true; 
    }    

    // For iOSSafari case, remove video tracks 
    if (isiOSSafari) {
        // Set video source
        var videoSourceMp4 = timeline._tracks[0]._clips[0]._source._source ;
        var videoSourceWebm = timeline._tracks[0]._clips[0]._source._source.replace('.mp4', '.webm');
        $('#videoSrcMp4').attr('src', videoSourceMp4);
        $('#videoSrcWebm').attr('src', videoSourceWebm);
        // Set video element
        videoForiOS = $('#videoElementForiOS')[0];
        
        // Set canvas to transparent
        timeline.bgColorA.v = 0.0;

        // Get the original project duration (include video clips)
        var totlaDuration = timeline.duration();
        // Remove video track
        timeline._tracks[0].del(0, timeline._tracks[0].count());
        // Adjust project duration if needed
        if (timeline.duration() < totlaDuration)
            timeline._duration = totlaDuration;
    }
    else if (browserSupportVideoMP4 && IsOnlyWebmSource == false) {
        // Now, video format default is mp4/h.264
        ; // Do nothing
    }
    else if (browserSupportVideoWebm){
        var replaceVideoSource = timeline._tracks[0]._clips[0]._source._source.replace('.mp4', '.webm');
        timeline._tracks[0]._clips[0]._source._source = replaceVideoSource;
    }
}

///////////////////////////////////////////////////////////////////////////////
// Remove audio source if browser does not support
function audioSourceForBrowser() {
    if (timeline == undefined)
        return;
    if (timeline._tracks[23]._clips[0] == undefined)
        return;

    // For iOSSafari, remove audio tracks 
    if (isiOSSafari) {
        timeline._tracks[23].del(0, timeline._tracks[23].count());
    }
    else if (browserSupportAudioOgg) {
        // Now, audio format default is ogg
        ; // Do nothing
    }
    else if (browserSupportAudioM4a) {
        var replaceAudioSource = timeline._tracks[23]._clips[0]._source._source.replace('.ogg', '.m4a');
        timeline._tracks[23]._clips[0]._source._source = replaceAudioSource;
    }
    else {
        // Remove audio track if browser does not support
        timeline._tracks[23].del(0, timeline._tracks[23].count());	
    }
}

///////////////////////////////////////////////////////////////////////////////
// Remove audio source if browser does not support
function syncTimingForiOS() {
    if (render.isPlay() && videoForiOSCanPlay && videoForiOSisPlay && !videoForiOSisEnded) {
        if (((render.currentTime() - videoForiOS.currentTime) > 1) ||
            ((videoForiOS.currentTime - render.currentTime()) > 1)) {
            if (videoForiOS.currentTime >= 0 &&
                videoForiOS.currentTime <= render.duration())
                render.currentTime(videoForiOS.currentTime);
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
function adjustAspectRatio() {
    // Get project size
    var prvWidth = timeline.width();
    var prvHeight = timeline.height();

    // For HD
    if (prvWidth > 854) {
        prvWidth = 854;
        prvHeight = 480;
    }

    videoCanvasWidth = prvWidth;
    videoCanvasHeight = prvHeight;

    // Set the size of canvas and view
    $('#standardView').css('width', videoCanvasWidth + 'px').css('height', videoCanvasHeight + 70 + 'px');
    $('#videoCanvas').attr('width', videoCanvasWidth + 'px').attr('height', videoCanvasHeight + 'px');

    if (isiOSSafari) {
        videoForiOS.width = videoCanvasWidth;
        videoForiOS.height = videoCanvasHeight;
        adjustVideoPositionForiOS();
    }
        
    // Calculate the scale retio for hit-test
    aspectRatioX = parseFloat(videoCanvasWidth / timeline.width());
    aspectRatioY = parseFloat(videoCanvasHeight / timeline.height());
}

///////////////////////////////////////////////////////////////////////////////
// change cursor and draw the hint rect of Link-Object
var URLHitTest = function() {
    hitResult = render.hitTest(hitPosX, hitPosY);
    
    var needDrawHint = false;
    if(hitResult != null){
        var strURL = "";
        if (hitResult.child != undefined) {
            var resultClild;
            for (var key in hitResult.child) {
                resultClild = hitResult.child[key];
                while (resultClild.child != undefined) {
                    resultClild = resultClild.child[0];
                    // draw hint if link or seeking time exists
                    strURL = resultClild.object._$props.BindURL;
                    if (strURL !== undefined && strURL !== "") {
                        needDrawHint = true;
                        hitResult = resultClild;
                        break;
                    }
                }
                if (needDrawHint)
                    break;                
            }
        }
    }
        
    if (needDrawHint) {
        // Set draw
        drawHint = true;
        // change cursor to "hand-shape" for URL if existed
        $("#videoCanvas").css("cursor","pointer");    
    }
    else {
        // Set not to draw
        drawHint = false;
        // change cursor to narmal
        $("#videoCanvas").css("cursor","default");    
    }
}

///////////////////////////////////////////////////////////////////////////////
// draw the hint rect of Link-Object
var drawBox = function(obj) {
    if(obj.child) {
        for(var index = 0; index < obj.child.length; ++ index) {
            drawBox(obj.child[index]);
            return;
        }
    }
    else {
        if(obj.box) {
            target.strokeStyle = 'rgba(88,88,88,0.6)';
            target.lineWidth = 2;
            // round-rect
            drawRoundRect(obj.box.a.x * aspectRatioX,
                          obj.box.a.y * aspectRatioY,
                          (obj.box.c.x - obj.box.a.x) * aspectRatioX,
                          (obj.box.c.y - obj.box.a.y) * aspectRatioY, 5);
        }
    }
    //return obj;
}

///////////////////////////////////////////////////////////////////////////////
// round the hint rect of Link-Object
var drawRoundRect = function(x, y, width, height, radius) {
    if (radius == undefined) {
        radius = 5;
    }

    target.beginPath();
    target.moveTo(x + radius, y);
    target.lineTo(x + width - radius, y);
    target.quadraticCurveTo(x + width, y, x + width, y + radius);
    target.lineTo(x + width, y + height - radius);
    target.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    target.lineTo(x + radius, y + height);
    target.quadraticCurveTo(x, y + height, x, y + height - radius);
    target.lineTo(x, y + radius);
    target.quadraticCurveTo(x, y, x + radius, y);
    target.closePath();
    target.stroke();
}

///////////////////////////////////////////////////////////////////////////////
$(document).ready(function () {
    createProject();

    // Update tooltips
    updateTooltips();

    // create engine
    render = new JVRE.Render();
    render.replay(true);

    initUI(render);
    preLoadProject();

    // Scale the preview window for better visual quality
    adjustAspectRatio();
    showSeekbar(render);
    if (!browserNotSupportVideo) {
        durationChanged();
        
        if (isiOSSafari) {
            iOSVideoSourceBindEvent();
            $("#videoCanvas").css('background-color', 'rgba(0, 0, 0, 0)');
            
            // Hide buttons for iOS Safari
            $("#controlBar .volumeBtn").hide();
            $("#controlBar .muteBtn").hide();
            $("#controlBar .volumeSlider").hide();
        }
        else {
            // Not for iOSSafari, remove the video element
            $("#videoDIVForiOS").remove();
        }
    }
    else {
        $("#videoCanvas").replaceWith('<div id="videoCanvas" style="background-color:Black;"></div>');
        $("#videoCanvas").css('width', videoCanvasWidth + 'px').css('height', videoCanvasHeight + 'px');
        $(window).resize(function() {
            // adjust the position of notSupportString
            var posX = $('#videoCanvas').offset().left;
            var posY = $('#videoCanvas').offset().top + $('#videoCanvas').height() - $('#notSupportString').height();
            $('#notSupportString').css('left', posX +2);
            $('#notSupportString').css('top',  posY -2);
        }).resize();
        // Not for iOSSafari, remove the video element
        $("#videoDIVForiOS").remove();        
    }

    window.requestAnimationFrame = (function() {
    //Check for each browser
    return	window.requestAnimationFrame 		||
            window.webkitRequestAnimationFrame 	||
            window.mozRequestAnimationFrame 	||
            window.msRequestAnimationFrame 		||
            window.oRequestAnimationFrame 		||
            
            function(callback, element) {
                window.setTimeout(callback, 10);
            }
    })();

    // run-loop 
    {
        var canvas = $("#videoCanvas");
        if (!browserNotSupportVideo)
            target = canvas[0].getContext('2d');

        run = function (event) {
            if (render.isPlay()) {
                window.requestAnimationFrame(run);
            }
            else {
                setTimeout(run, 250);
            }
            
            // Sync timing between video element and render engine
            if (isiOSSafari) {
                syncTimingForiOS();
            }
            
            // scheduling
            render.run();
            
            // output result
            var result = render.result();
            if (result !== null) {
                target.clearRect(0, 0, canvas.width(), canvas.height());
                target.drawImage(result, 0, 0, canvas.width(), canvas.height());
            }

            // change cursor and draw the hint rect of Link-Object
            if (ptInCanvas && drawHint) {
                URLHitTest();
                if (hitResult)
                    drawBox(hitResult);
            }
        }
        window.requestAnimationFrame(run);
    }

    // mouseEnter and mouseLeave
    $("#videoPreviewContainer").mouseenter(function () {
        ptInCanvas = true;
    }).mouseout(function () {
        ptInCanvas = false;
    });

    // click on URL-Object
    if (isiOSSafari) {
        //$("#videoCanvas").bind('touchstart', function (event) {
        document.getElementById('videoCanvas').addEventListener('touchstart', function(event) {
            event.preventDefault();
            hitPosX = (event.touches[0].pageX - $('#videoCanvas').offset().left) / aspectRatioX;
            hitPosY = (event.touches[0].pageY - $('#videoCanvas').offset().top) / aspectRatioY;
            if (render.source()) {
                var result = render.hitTest(hitPosX, hitPosY);
                var hadFoundURL = false;
                var strURL = "";
                if (result != null) {
                    if (result.child != undefined) {
                        var resultClild;
                        for (var key in result.child) {
                            resultClild = result.child[key];
                            while (resultClild.child != undefined) {
                                resultClild = resultClild.child[0];
                                // open link or jump to seeking time if they exist
                                strURL = resultClild.object._$props.BindURL;
                                if (strURL !== undefined && strURL !== "") {
                                    hadFoundURL = true;
                                    break;
                                }
                            }
                            if (hadFoundURL)
                                break;
                        }
                    }
                }
                
                if (hadFoundURL) {
                    if (strURL.indexOf("seek://") == 1) {
                        var seekTime = parseFloat(strURL.substring(8, strURL.indexOf("|")));
                        if (seekTime > videoForiOS.duration) {
                            $("#videoCanvas").css('background-color', 'black');
                            videoForiOSisEnded = true;
                            videoForiOS.currentTime = videoForiOS.duration;
                            render.currentTime(seekTime);
                        }
                        else {
                            $("#videoCanvas").css('background-color', 'rgba(0, 0, 0, 0)');
                            videoForiOSisEnded = false;
                            videoForiOS.currentTime = seekTime;
                            render.currentTime(videoForiOS.currentTime);
                        }
                    }
                    else {
                        controlBar.pause();
                        window.open(strURL);
                    }
                }
            }
        }, false);
    }
    else {
        $("#videoCanvas").click(function (event) {
            event.preventDefault();
            if (render.source()) {
                var result = render.hitTest(hitPosX, hitPosY);
                var hadFoundURL = false;
                var strURL = "";
                if (result != null) {
                    if (result.child != undefined) {
                        var resultClild;
                        for (var key in result.child) {
                            resultClild = result.child[key];
                            while (resultClild.child != undefined) {
                                resultClild = resultClild.child[0];
                                // open link or jump to seeking time if they exist
                                strURL = resultClild.object._$props.BindURL;
                                if (strURL !== undefined && strURL !== "") {
                                    hadFoundURL = true;
                                    break;
                                }
                            }
                            if (hadFoundURL)
                                break;
                        }
                    }
                }

                if (hadFoundURL) {
                    if (strURL.indexOf("seek://") == 1) {
                        render.currentTime(parseFloat(strURL.substring(8, strURL.indexOf("|"))));
                    }
                    else {
                        controlBar.pause();
                        window.open(strURL);
                    }
                }
            }
        });
    }

    // mousemove on Link-Object
    if (isiOSSafari) {
        ; // do nothing
    }
    else {
        $("#videoCanvas").mousemove(function (event) {
            event.preventDefault();
            if (render.source()) {
                if (isFirefox) {
                    hitPosX = (event.layerX - $(event.target).position().left) / aspectRatioX;
                    hitPosY = (event.layerY - $(event.target).position().top) / aspectRatioY;
                }
                else {
                    hitPosX = event.offsetX / aspectRatioX;
                    hitPosY = event.offsetY / aspectRatioY;
                }
                URLHitTest();
            }
        });
    }
});
///////////////////////////////////////////////////////////////////////////////