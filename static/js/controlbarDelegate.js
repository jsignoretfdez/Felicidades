controlbarDelegate = new Class(function () {
    return {
        Implements: Events,
        initialize: function (element, controlbar, render) {
            var secondstotime = function (totalSec) {
                hours = parseInt(totalSec / 3600) % 24;
                minutes = parseInt(totalSec / 60) % 60;
                seconds = Math.floor(totalSec % 60);

                result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
                result = result.replace(/^00:0/i, "");
                result = result.replace(/^00:/i, "");
                return result;
            };

            this._element = element;
            this._controlbar = controlbar;
            this._render = render;

            this._durationOffset = 0;
            this._rangeDuration = 0;
            this._isMute = false;
            this._volume = this._render.volume();
            this._isFullscreen = false;

            var that = this;
            if (render) {
                render.addEvent("progress", function (progress) {
                    if (!isNaN(progress)) {
                        that._element.find(".timeCodeTime").text(secondstotime(progress - that._durationOffset));
                        that._element.find(".timeCodeDuration").text(" / " + secondstotime(that._rangeDuration));
                    }
                });

                this._render.addEvent("sourceEnd", function (event) {
                    if(!that._render.replay())
                        that._controlbar.pause();
                    else {
                        if (isiOSSafari) {
                            if (videoForiOSCanPlay) {
                                $("#videoCanvas").css('background-color', 'rgba(0, 0, 0, 0)');
                                videoForiOS.currentTime = 0.0;
                                videoForiOS.play();
                                videoForiOSisPlay = true;
                                videoForiOSisEnded = false;
                            }
                        }
                    }
                });
            }
        },
        play: function () {
            if (this._render.duration() > 0) {
                if (isiOSSafari) {
                    if (videoForiOSCanPlay) {
                        if (!videoForiOSisEnded) {
                            $("#videoCanvas").css('background-color', 'rgba(0, 0, 0, 0)');
                            videoForiOS.play();
                            videoForiOSisPlay = true;
                        }
                        this._render.play();
                    }
                    else {
                        // Special call, iOS can load video/audio without user interaction (click)
                        videoForiOS.load();
                    }
                }
                else
                    this._render.play();
            }
            return this._render.isPlay();			
        },
        pause: function () {
            if (isiOSSafari) {
                if (videoForiOSCanPlay) {
                    videoForiOSisPlay = false;
                    videoForiOS.pause();
                    this._render.pause();
                }
                else {
                    ; 	// do nothing
                }
            }
            else        
                this._render.pause();
            return this._render.isPlay();
        },
        playPause: function () {
            if (this._render.isPlay()) {
                this.pause();
            }
            else {
                this.play();
            }
            return this._render.isPlay();
        },
        prevFrame: function () {
            this.pause();
            if (isiOSSafari) {
                if (videoForiOSCanPlay) {
                    if (this._render.currentTime() < videoForiOS.duration) {
                        $("#videoCanvas").css('background-color', 'rgba(0, 0, 0, 0)');
                        videoForiOSisEnded = false;
                        if (videoForiOS.currentTime - frameInterval >= videoForiOS.startTime) {
                            videoForiOS.currentTime -= frameInterval;
                        }
                        this._render.currentTime(videoForiOS.currentTime - frameInterval);
                    }
                    else {
                        $("#videoCanvas").css('background-color', 'black');
                        videoForiOSisEnded = true;
                        videoForiOS.currentTime = videoForiOS.duration;
                        if (this._render.currentTime() - frameInterval >= this._durationOffset)
                            this._render.currentTime(this._render.currentTime() - frameInterval);			
                    }
                }
                else {
                    ; 	// do nothing
                }
            }
            else {
                if (this._render.currentTime() - frameInterval >= this._durationOffset)
                    this._render.currentTime(this._render.currentTime() - frameInterval);
            }
        },
        nextFrame: function () {
            this.pause();
            if (isiOSSafari) {
                if (videoForiOSCanPlay) {
                    if (this._render.currentTime() < videoForiOS.duration) {
                        $("#videoCanvas").css('background-color', 'rgba(0, 0, 0, 0)');
                        videoForiOSisEnded = false;
                        if (videoForiOS.currentTime + frameInterval <= videoForiOS.duration) {
                            videoForiOS.currentTime += frameInterval;
                        }
                        this._render.currentTime(videoForiOS.currentTime + frameInterval);
                    }
                    else {
                        $("#videoCanvas").css('background-color', 'black');
                        videoForiOSisEnded = true;
                        videoForiOS.currentTime = videoForiOS.duration;
                        if (this._render.currentTime() + frameInterval <= this._rangeDuration)
                            this._render.currentTime(this._render.currentTime() + frameInterval);						
                    }
                }
                else {
                    ; 	// do nothing
                }
            }
            else {
                if (this._render.currentTime() + frameInterval <= this._rangeDuration)
                    this._render.currentTime(this._render.currentTime() + frameInterval);
            }
        },
        toggleMute: function () {
            if (this._isMute) {
                this._isMute = false;
                this._render.volume(this._volume);
            }
            else {
                this._isMute = true;
                this._render.volume(0);
            }

            return this._isMute;
        },
        volume: function (volume) {
            if (volume !== undefined) {
                if (this._isMute)
                    this.toggleMute();
                this._volume = volume;
                this._render.volume(volume);
            }

            return this._render.volume();
        },
        toggleFullscreen: function () {
            this._isFullscreen = !this._isFullscreen;
            this.fireEvent("requestToggleFullscreen");
            return this._isFullscreen;
        },

        durationOffset: function (durationOffset) {
            if (durationOffset !== undefined)
                this._durationOffset = durationOffset;
            else
                return this._durationOffset;
        },

        rangeDuration: function (rangeDuration) {
            if (rangeDuration !== undefined)
                this._rangeDuration = rangeDuration;
            else
                return this._rangeDuration;
        }
    };
} ());