var SeekBar = {
    options: {
        offset: 0,
        duration: 0,
        sliding: false,
        lastValue: 0,
        _wasPlaying: false,
        _seekbarColor: "#f60263",
        renderEngine: null,
        timerID: null
    },

    setTimer: function (bStart) {
        if (this.options.timerID == null) {
            if (bStart) {
                //this.options.timerID = setInterval("updateSlidePos('false');", 500);
            }
        } else {
            if (!bStart) {
                clearInterval(this.options.timerID);
                this.options.timerID = null;
            }
        }
    },

    _create: function () {
        $.ui.slider.prototype._create.call(this);
        this.element.addClass("ui-seekbar");

        // layout
        var table = $("<table class='ui-seekbar-layout' cellspacing='0'></table>");
        var tr = $("<tr></tr>")
        table.append(tr);
        table.appendTo(this.element);

        // left
        var td = $("<td class='ui-seekbar-layout-left'></td>");
        var leftPadding = $("<div>");
        leftPadding.addClass("ui-seekbar-leftPadding").appendTo(td);
        tr.append(td);
        this.leftPaddingWidth = parseInt(leftPadding.css("width"));

        // bar
        td = $("<td class='ui-seekbar-layout-bar'></td>");
        var barContainer = $("<div class='ui-seekbar-bar'></div");
        this.element.find(".ui-slider-range").appendTo(barContainer);
        this.element.find(".ui-slider-handle").appendTo(barContainer);
        // buffer
        this.buffer = $("<canvas class='ui-slider-buffer'></canvas>").appendTo(barContainer)[0];
        barContainer.appendTo(td);
        tr.append(td);

        // right
        td = $("<td class='ui-seekbar-layout-right'></td>");
        var rightPadding = $("<div>");
        rightPadding.addClass("ui-seekbar-rightPadding").appendTo(td);
        tr.append(td);
        this.rightPaddingWidth = parseInt(rightPadding.css("width"));
    },

    destroy: function () {
        this.options.renderEngine = null;
        $.ui.slider.prototype.destroy.call(this);
    },

    _mouseUp: function (event) {
        $.ui.slider.prototype._mouseUp.apply(this, arguments);
        var seekElement = this.element;
        var that = this;
        //block the last progress notification
        setTimeout(function () {
            seekElement.seekbar("option", "sliding", false);
            var bPlay = seekElement.seekbar("option", "_wasPlaying");
            if (bPlay) {
                that.element.trigger("requestPlay");
            }
        }, 300);
    },

    _mouseDown: function (event) {
        $.ui.slider.prototype._mouseDown.apply(this, arguments);
        this.options.sliding = true;
        this.options._wasPlaying = this.options.renderEngine.isPlay();  //_playing
        this.element.trigger("requestPause");
    },

    _normValueFromMouse: function (position) {
        var pixelTotal,
            pixelMouse,
            percentMouse,
            valueTotal,
            valueMouse;

        if (this.orientation === "horizontal") {
            pixelTotal = this.elementSize.width - (this.leftPaddingWidth + this.rightPaddingWidth);
            pixelMouse = position.x - this.leftPaddingWidth - this.elementOffset.left - (this._clickOffset ? this._clickOffset.left : 0);
        } else {
            pixelTotal = this.elementSize.height;
            pixelMouse = position.y - this.elementOffset.top - (this._clickOffset ? this._clickOffset.top : 0);
        }

        percentMouse = (pixelMouse / pixelTotal);
        if (percentMouse > 1) {
            percentMouse = 1;
        }
        if (percentMouse < 0) {
            percentMouse = 0;
        }
        if (this.orientation === "vertical") {
            percentMouse = 1 - percentMouse;
        }

        valueTotal = this._valueMax() - this._valueMin();
        valueMouse = this._valueMin() + percentMouse * valueTotal;

        return this._trimAlignValue(valueMouse);
    },

    setRange: function (duration, offset) {
        this.options.duration = duration;
        if (duration == 0) {
            this.disable();
            this.element.find(".ui-seekbar-leftPadding").css("background", "transparent");
            this._setOption("value", 0);
            this.element.hide();
            return;
        }

        if (offset != null) {
            this.options.offset = offset;
        }

        this.element.find(".ui-seekbar-leftPadding").css("background", this.options._seekbarColor);
        this.element.show();
        this.enable();
    },

    updateHandle: function (progress) {
        if (this.options.sliding)
            return;
        var duration = this.options.duration; //this.options.renderEngine.duration();
        if (duration == 0)
            return;

        var formatPos = Math.floor((progress - this.options.offset) * this.options.max / duration);
        if (formatPos < 0 || formatPos > this.options.max) {
            //reset renderEngine to the begining
            if (isiOSSafari) {
                videoForiOS.currentTime = this.options.offset;
                this.options.renderEngine.currentTime(videoForiOS.currentTime);
            }
            else
                this.options.renderEngine.currentTime(this.options.offset);
        }

        var curPos = this.options.value;
        if (curPos != formatPos)
            this._setOption("value", formatPos);
    },

    updateBuffer: function (currentProject) {
    /*
        var context = this.buffer.getContext('2d');

        context.fillStyle = "#5d5d5d";
        this.buffer.width = this.buffer.clientWidth;
        var factor = Math.floor(this.buffer.width / 100) + 1;

        var last = false;
        for (var i = 0; i < this.buffer.width / factor; ++i) {
            var time = i / this.buffer.width * factor * this.options.duration + this.options.offset;
            if (currentProject.buffered(time)) {
                context.fillStyle = "#373737";
                context.fillRect(i * factor, 0, factor, this.buffer.height);
                last = true;
            }
            else last = false;
        }


        if (last) $(".ui-seekbar-rightPadding").css("background-color", "#373737");
        else $(".ui-seekbar-rightPadding").css("background-color", "#5d5d5d");
        */
    },

    updateSlidingPos: function (newV) {
        var lastV = this.options.lastValue;
        if (lastV == newV) {
            var curProgress = this.options.duration * lastV / this.options.max + this.options.offset;
            if (isiOSSafari) {
                if (curProgress > videoForiOS.duration) {
                    $("#videoCanvas").css('background-color', 'black');
                    videoForiOSisEnded = true;
                    videoForiOS.currentTime = videoForiOS.duration;
                    this.options.renderEngine.currentTime(curProgress);
                }
                else {
                    $("#videoCanvas").css('background-color', 'rgba(0, 0, 0, 0)');
                    videoForiOSisEnded = false;
                    videoForiOS.currentTime = curProgress;
                    this.options.renderEngine.currentTime(videoForiOS.currentTime);
                }
            }
            else			
                this.options.renderEngine.currentTime(curProgress);
        }
    }
};

$.widget("ui.seekbar", $.ui.slider, SeekBar);


function showSeekbar(rdEgine) {
    $("#mySeekbar").seekbar({
        range: "min",
        value: 0,
        min: 0,
        max: 10000,
        renderEngine: rdEgine,
        slide: function (event, ui) {
            $(this).seekbar("option", "lastValue", ui.value);
            var seekElement = $(this);
            setTimeout(function () {
                seekElement.seekbar("updateSlidingPos", ui.value);
            }, 300);
        }
    });
    $("#mySeekbar").find(".ui-slider-handle").removeAttr("href");

    // play callback
    var updateTime = new Date();
    render.addEvent("progress", function (progress) {
        $("#mySeekbar").seekbar("updateHandle", progress);

        var time = new Date();
        if (time - updateTime > 500) {
            $("#mySeekbar").seekbar("updateBuffer", currentProject);
            updateTime = time;
        }
    });

    //vm
    ko.applyBindings(seekbarViewModel, $("#seekbarSection")[0]);

    //init seekbar
    $("#mySeekbar").seekbar("setRange", 0, 0);
}

// seekbar viewmodel
var seekbarViewModel = {
    curWidth: ko.observable(640)
};


