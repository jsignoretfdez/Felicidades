var library;
var trimTool;
var annotationLayer;
var currentProject;
var controlBar;
var controlBarDelegate;
var render;
var _durationOffset = 0;
var videoSourceTable = {};
var renderUtility;

var MainViewModel;

function durationChanged() {
    controlBarDelegate.durationOffset(0);
    controlBarDelegate.rangeDuration(render.duration());
    $("#mySeekbar").seekbar("setRange", render.duration(), 0);
}

/* fullscreen related */
var controlShowHideTimer = null;
function toggleFullscreen() {
    $("#fullscreenView").toggle();
    $("#standardView").toggle();

    if ($("#fullscreenView").is(':visible')) {
        $("#mainControls").addClass("fullscreenMode");

        // when entering fullscreen, the enter preview window event is not triggered
        isMouseOverPreviewWindow = true;
        var fullscreenView_videoPreviewContainerPlaceHolder = $("#fullscreenView_videoPreviewContainerPlaceHolder");
        $("#mainControls").detach().appendTo($("#fullscreenView_controlsPlaceHolder")[0]);
        $("#controlBar").css("width", "682px");
        $("#videoPreviewContainer").detach().appendTo(fullscreenView_videoPreviewContainerPlaceHolder);

        $(window).bind("resize", refreshPreviewWindowSize);
        refreshPreviewWindowSize();

        $('body').addClass('fullscreen');
        
        // add timer
        var that = this;
        if (controlShowHideTimer == null)
            controlShowHideTimer = setInterval("hideControls();", 5000);
        
        if (isiOSSafari) {
            $(document).bind('touchstart', resetHideControlsTimer);
        }
        else
            $(document).bind('mousemove', resetHideControlsTimer);

        $("body").css("overflow-y", "hidden");
    }
    else {
        $("#mainControls").removeClass("fullscreenMode");

        $(window).unbind("resize", refreshPreviewWindowSize);

        // remove timer
        if (controlShowHideTimer != null) {
            clearInterval(controlShowHideTimer);
            controlShowHideTimer = null;
        }
        
        if (isiOSSafari) {
            $(document).unbind('touchstart', resetHideControlsTimer);
        }
        else
            $(document).unbind('mousemove', resetHideControlsTimer);

        $("#mainControls").detach().appendTo($("#standardView_controlsPlaceHolder")[0]);
        $("#controlBar").css("width", "auto");
        $("#videoPreviewContainer").detach().appendTo($("#standardView_videoPreviewContainerPlaceHolder")[0]);

        $('body').removeClass('fullscreen');
        $("#videoCanvas").attr("width", videoCanvasWidth).attr("height", videoCanvasHeight);
        seekbarViewModel.curWidth(videoCanvasWidth);

        if (isiOSSafari) {
            videoForiOS.width = videoCanvasWidth;
            videoForiOS.height = videoCanvasHeight;
            adjustVideoPositionForiOS();
        }
            
        aspectRatioX = parseFloat(videoCanvasWidth / timeline.width());
        aspectRatioY = parseFloat(videoCanvasHeight / timeline.height());	
        
        $("body").css("overflow-y", "auto");
    }
}

function refreshPreviewWindowSize() {
    var fullscreenView = $("#fullscreenView");
    var canvasHeight, canvasWidth;

    if (parseFloat(timeline.width() * 3 / timeline.height()) > 4) {
        if (fullscreenView.width() / fullscreenView.height() > (16 / 9)) {
            canvasHeight = fullscreenView.height() - 10;
            canvasWidth = canvasHeight * 16 / 9;
        }
        else {
            canvasWidth = fullscreenView.width() - 10;
            canvasHeight = canvasWidth * 9 / 16;
        }
    }
    else {
        if (fullscreenView.width() / fullscreenView.height() > (4 / 3)) {
            canvasHeight = fullscreenView.height() - 10;
            canvasWidth = canvasHeight * 4 / 3;
        }
        else {
            canvasWidth = fullscreenView.width() - 10;
            canvasHeight = canvasWidth * 3 / 4;
        }
    }

    // adjust aspect ratio when re-sizing the full-screen window
    aspectRatioX = parseFloat(canvasWidth / timeline.width());
    aspectRatioY = parseFloat(canvasHeight / timeline.height());

    seekbarViewModel.curWidth(canvasWidth);
    $("#fullscreenView_videoPreviewContainerPlaceHolder").css("height", canvasHeight + "px");
    $("#videoCanvas").attr("width", canvasWidth).attr("height", canvasHeight);

    if (isiOSSafari) {
        videoForiOS.width = canvasWidth;
        videoForiOS.height = canvasHeight;
        adjustVideoPositionForiOS();
    }
}

function resetHideControlsTimer() {
    if (controlShowHideTimer != undefined) {
        clearTimeout(controlShowHideTimer);
        controlShowHideTimer = null;
    }
    controlShowHideTimer = setTimeout("hideControls();", 5000);
    showControls();
}

function hideControls() {
    if ($("#fullscreenView_controlsPlaceHolder").is(':visible')) {
        $("#fullscreenView_controlsPlaceHolder").fadeOut(500);
    }
}

function showControls() {
    if ($("#fullscreenView_controlsPlaceHolder").is(':hidden')) {
        $("#fullscreenView_controlsPlaceHolder").fadeIn(200);
    }
}


blockOverlay = function (enable) {
    if (enable == true && blockOverlay.ui === undefined) {
        blockOverlay.ui = $('<div class="ui-widget-overlay" style=' +
                    '"width: ' + document.width + 'px;' +
                    'height: ' + document.height + 'px; z-index: 1001; ">' +
                    '<div style="opacity: 1; position: absolute; top: 50%; left: 50%"><img src="/' + kg_version + '/frontend/static/img/busy_fullscreen.gif"></div></div>');
        blockOverlay.ui.appendTo(document.body);
    }

    if (enable == false && blockOverlay.ui !== undefined) {
        blockOverlay.ui.remove();
        blockOverlay.ui = undefined;
    }

    $(window).resize(function () {
        if (blockOverlay.ui !== undefined) {
            blockOverlay.ui.css("width", document.width + 'px');
            blockOverlay.ui.css("height", document.height + 'px');
        }
    });
};


function initUI(render) {
    // Display the main preview window and playback controls
    $("#standardView").show();

    controlBar = new kg.ui.controlbar($("#controlBar"), false);
    controlBarDelegate = new controlbarDelegate($("#controlBar"), controlBar, render);
    controlBar.setDelegate(controlBarDelegate);
    controlBarDelegate.addEvent("requestToggleFullscreen", toggleFullscreen);

    // Set default volume
    controlBar.volume(0.5);

    $("#mySeekbar").seekbar("setRange", 0, 0);
    $("#mySeekbar").bind("requestPlay", function () {
        controlBar.play();
    });
    $("#mySeekbar").bind("requestPause", function () {
        controlBar.pause();
    });
}

function getQueryString(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null)
        return undefined;
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}
