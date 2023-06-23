kg.ui.controlbar = new Class(function () {
    return {
        Implements: Events,
        initialize: function (element, bShowAnnotBtns) {
            this._element = element;
            this._delegateObj = null;

            if (bShowAnnotBtns)
                this._bShowAnnotBtns = bShowAnnotBtns;
            else
                this._bShowAnnotBtns = false;

            this._initUI();
        },

        setDelegate: function (delegateObj) {
            this._delegateObj = delegateObj;
        },

        _initUI: function () {
            var that = this;

            this._element.find(".playBtn").button({ icons: { primary: "kg-ui-icon kg-ui-icon-play" }, text: false });
            this._element.find(".pauseBtn").button({ icons: { primary: "kg-ui-icon kg-ui-icon-pause" }, text: false });
            this._element.find('.pauseBtn').button().hide();
            this._element.find(".prevFrameBtn").button({ icons: { primary: "kg-ui-icon kg-ui-icon-previous" }, text: false });
            this._element.find(".nextFrameBtn").button({ icons: { primary: "kg-ui-icon kg-ui-icon-next" }, text: false });
            this._element.find(".volumeBtn").button({ icons: { primary: "kg-ui-icon kg-ui-icon-volume" }, text: false });
            this._element.find(".muteBtn").button({ icons: { primary: "kg-ui-icon kg-ui-icon-volume-active" }, text: false });
            this._element.find(".muteBtn").button().hide();
            this._element.find(".volumeSlider").slider({ range: "min", value: 50, min: 0, max: 100 });
            this._element.find(".volumeSlider").find(".ui-slider-handle").removeAttr("href");

            this._element.find(".prevMarkBtn").button({ icons: { primary: "kg-ui-icon kg-ui-icon-previousMark" }, text: false });
            this._element.find(".nextMarkBtn").button({ icons: { primary: "kg-ui-icon kg-ui-icon-nextMark" }, text: false });

            this._element.find(".hideMarkBtn").button({ icons: { primary: "kg-ui-icon kg-ui-icon-hideMark" }, text: false });
            this._element.find(".showMarkBtn").button({ icons: { primary: "kg-ui-icon kg-ui-icon-showMark" }, text: false });
            this._element.find(".showMarkBtn").button().hide();

            this._element.find(".fullscreenBtn").button({ disabled: false, icons: { primary: "kg-ui-icon kg-ui-icon-fullscreen" }, text: false });
            this._element.find(".restoreFullscreenBtn").button({ icons: { primary: "kg-ui-icon kg-ui-icon-fullscreen-active" }, text: false });
            this._element.find(".restoreFullscreenBtn").button().hide();

            if (!this._bShowAnnotBtns) {
                that._element.find(".annotationBtns > div").hide();
                this._element.find(".fullscreenBtn").button().show();
            }

            // default handler for button state change
            this._element.find(".pauseBtn").bind('click', function (event) {
                that.pause();
            });
            this._element.find(".playBtn").bind('click', function (event) {
                that.play();
            });
            this._element.find(".volumeBtn").bind('click', function (event) {
                that.toggleMute();
            });
            this._element.find(".muteBtn").bind('click', function (event) {
                that.toggleMute();
            });

            this._element.find(".prevFrameBtn").bind('click', function () {
                that.prevFrame();
            });

            this._element.find(".nextFrameBtn").bind('click', function () {
                that.nextFrame();
            });

            this._element.find(".prevMarkBtn").bind('click', function () {
                that.prevMark();
            });

            this._element.find(".nextMarkBtn").bind('click', function () {
                that.nextMark();
            });

            this._element.find(".showMarkBtn").bind('click', function () {
                that.showMark();
            });

            this._element.find(".hideMarkBtn").bind('click', function () {
                that.hideMark();
            });

            this._element.find(".volumeSlider").bind("slide", function (event, ui) {
                that.volume(ui.value / 100);
            });

            this._element.find(".fullscreenBtn").bind('click', function (event) {
                // dirty!! a workaround because when a button is disabled, div still receives the click event.
                if (!$(this).button("option", "disabled"))
                    that.toggleFullscreen();
            });

            this._element.find(".restoreFullscreenBtn").bind('click', function (event) {
                that.toggleFullscreen();
            });
        },

        toggleMute: function () {
            if (this._delegateObj) {
                var isMute = this._delegateObj.toggleMute();
                if (isMute) {
                    this._element.find('.muteBtn').show();
                    this._element.find('.volumeBtn').hide();

                    this._element.find('.volumeSlider').slider("value", 0);
                }
                else {
                    this._element.find('.muteBtn').hide();
                    this._element.find('.volumeBtn').show();
                    this._element.find('.volumeSlider').slider("value", this._delegateObj.volume() * 100);
                }
            }
        },

        volume: function (value) {
            if (value !== undefined) {
                if (this._delegateObj) {
                    if (this._delegateObj.volume(value) == 0) {
                        this._element.find('.muteBtn').show();
                        this._element.find('.volumeBtn').hide();
                    }
                    else {
                        this._element.find('.muteBtn').hide();
                        this._element.find('.volumeBtn').show();
                    }
                }
            }
            else {
                if (this._delegateObj) {
                    return this._delegateObj.volume();
                }
            }
        },

        playPause: function () {
            if (this._delegateObj) {
                this._delegateObj.playPause();
            }
        },

        play: function () {
            if (this._delegateObj) {
                if (this._delegateObj.play()) {
                    this._element.find(".playBtn").hide();
                    this._element.find(".pauseBtn").show();
                    this._element.find(".prevFrameBtn").button({ disabled: true });
                    this._element.find(".nextFrameBtn").button({ disabled: true });
                }
                else {
                    this._element.find(".playBtn").show();
                    this._element.find(".pauseBtn").hide();
                    this._element.find(".prevFrameBtn").button({ disabled: false });
                    this._element.find(".nextFrameBtn").button({ disabled: false });
                }
            }
        },

        pause: function () {
            if (this._delegateObj) {
                if (this._delegateObj.pause()) {
                    this._element.find(".playBtn").hide();
                    this._element.find(".pauseBtn").show();
                    this._element.find(".prevFrameBtn").button({ disabled: true });
                    this._element.find(".nextFrameBtn").button({ disabled: true });
                }
                else {
                    this._element.find(".playBtn").show();
                    this._element.find(".pauseBtn").hide();
                    this._element.find(".prevFrameBtn").button({ disabled: false });
                    this._element.find(".nextFrameBtn").button({ disabled: false });
                }
            }
        },

        prevFrame: function () {
            if (this._delegateObj) {
                this._delegateObj.prevFrame();
            }
        },

        nextFrame: function () {
            if (this._delegateObj) {
                this._delegateObj.nextFrame();
            }
        },

        prevMark: function () {
            if (this._delegateObj) {
                this._delegateObj.prevMark();
            }
        },

        nextMark: function () {
            if (this._delegateObj) {
                this._delegateObj.nextMark();
            }
        },

        showMark: function () {
            if (this._delegateObj) {
                if (this._delegateObj.showMark()) {
                    that._element.find(".hideMarkBtn").show();
                    that._element.find(".showMarkBtn").hide();
                } else {
                    that._element.find(".hideMarkBtn").hide();
                    that._element.find(".showMarkBtn").show();
                }
            }
        },

        hideMark: function () {
            if (this._delegateObj) {
                if (this._delegateObj.hideMark()) {
                    that._element.find(".hideMarkBtn").show();
                    that._element.find(".showMarkBtn").hide();
                } else {
                    that._element.find(".hideMarkBtn").hide();
                    that._element.find(".showMarkBtn").show();
                }
            }
        },

        toggleFullscreen: function () {
            if (this._delegateObj) {
                if (this._delegateObj.toggleFullscreen()) {
                    this._element.find(".restoreFullscreenBtn").show();
                    this._element.find(".fullscreenBtn").hide();
                    this._element.find(".fullscreenBtn").removeClass("ui-state-hover"); // to prevent from the repaint problem
                }
                else {
                    this._element.find(".restoreFullscreenBtn").hide();
                    this._element.find(".fullscreenBtn").show();
                    this._element.find(".restoreFullscreenBtn").removeClass("ui-state-hover"); // to prevent from the repaint problem
                }
            }
        }
    };
} ());