/*/////////////////////////////////////////////*/
/*// File name : iOSVideoSourceEventHandler.js */
/*// Purpose   : Special for iOS Safari 	   */
/*// Implement : Event handler                 */
/*/////////////////////////////////////////////*/

///////////////////////////////////////////////////////////////////////////////
// Bind Event
function iOSVideoSourceBindEvent() {
    if (videoForiOS === undefined)
        return undefined;

    // videoForiOS.addEventListener('loadedmetadata', iOSVidemetadataLoadedCallback, false);
    videoForiOS.addEventListener('canplaythrough', iOSVideoLoadedCallback, false);
    videoForiOS.addEventListener('canplay', iOSVideoLoadedCallback, false);
    videoForiOS.addEventListener('playing', iOSVideoReadyCallback, false);
    videoForiOS.addEventListener('seeked', iOSVideoReadyCallback, false);
    videoForiOS.addEventListener('seeking', iOSVideoNotReadyCallback, false);
    videoForiOS.addEventListener('waiting', iOSVideoNotReadyCallback, false);
    videoForiOS.addEventListener('error', iOSVideoErrorCallback, false);
    videoForiOS.addEventListener('ended', iOSVideoEndCallback, false);
}

///////////////////////////////////////////////////////////////////////////////
// Event Handlers
iOSVideoLoadedCallback = function(e) {
    videoForiOSCanPlay = true;
}

iOSVideoReadyCallback = function(e) {
    videoForiOSCanPlay = true;
}

iOSVideoNotReadyCallback = function(e) {
    videoForiOSCanPlay = false;
}

iOSVideoErrorCallback = function(e) {
    videoForiOSCanPlay = false;
}

iOSVideoEndCallback = function(e) {
    $("#videoCanvas").css('background-color', 'black');
    videoForiOSisPlay = false;
    videoForiOSisEnded = true;
    videoForiOSCanPlay = true;
}

// iOSVidemetadataLoadedCallback = function(e) {
// that._duration = that._$._video.duration;
// that._width = that._$._video.videoWidth;
// that._height = that._$._video.videoHeight;
// }

///////////////////////////////////////////////////////////////////////////////
// Adjust the video element position for iOS
function adjustVideoPositionForiOS() {
    var posX = $('#videoCanvas').offset().left;
    var posY = $('#videoCanvas').offset().top
    $("#videoDIVForiOS").css('left', posX);
    $("#videoDIVForiOS").css('top',  posY);
}