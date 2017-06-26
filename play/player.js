var ctx = {
    $playList: null,
    $listContent: null,
    playList: null,
    player: null,
    currentSong: null,
    $needle: null,
    currentIndex: 0,
    $curTime: null,
    $totTime: null,
    $processBtn: null,
    $processBar: null,
    $rdyBar: null,
    $curBar: null,
    $playBtn: null,
    $pauseBtn: null,
    interval: 0,
    processBtnState: 0,
    originX: 0,
    diskCovers: null,
    isPlaying: false,
    songUpdated: true,
    singleLoop: 1,//single loop
    playFlag: true,
    heightActive: 38,
    lrcStr: "",
    lrcMap: {}
};

(function ($) {
    ctx.init = function () {
        ctx.initData();
        ctx.initState();
        ctx.initPlayList();
        
        if(mySong != "" && ctx.currentIndex != mySong){
            ctx.currentIndex = $(`#listContent li[data-find='${mySong}']`).index();
            ctx.currentSong = ctx.playList[ctx.currentIndex];
            $(".loop-btn").trigger("click").trigger("click");
            ctx.validatePlayList();
            mySong = "";
        }
        
        setTimeout(function (){
            ctx.updateSong();
            ctx.setInterval();
            ctx.initProcessBtn(ctx.$processBtn);
            ctx.updateCoverState(0);
            ctx.play();
            ctx.loop();
        }, 500);
    };
    
    ctx.initData = function () {
        ctx.currentIndex = + localStorage.getItem("currentSongIndex") || 0;
        ctx.currentIndex >= ctx.playList.length ? ctx.currentIndex = 0 : '';
        ctx.currentSong = ctx.playList[ctx.currentIndex];
        ctx.player = $('#player').get(0);
        ctx.$needle = $('#needle');
        ctx.$curTime = $('#currentTime');
        ctx.$totTime = $('#totalTime');
        ctx.$processBtn = $('#processBtn');
        ctx.$processBar = $('#process .process-bar');
        ctx.$rdyBar = $('#process .rdy');
        ctx.$curBar = $('#process .cur');
        ctx.$playBtn = $('#controls .play');
        ctx.$pauseBtn = $('#controls .pause');
        ctx.$playList = $('#playList');
        ctx.$listContent = $('#listContent');
        ctx.diskCovers = $('.disk-cover');
    };
    
    ctx.loop = function () {
        if(ctx.singleLoop == 0){
            //顺序
            ctx.singleLoop = 1;
            $('#controls .loop-btn').addClass('active');
        } else if (ctx.singleLoop == 1){
            //单曲
            ctx.singleLoop = -1;
            $('#controls .loop-btn').removeClass('active');
            $('#controls .loop-btn').addClass('rand');
        } else {
            //随机
            ctx.singleLoop = 0;
            $('#controls .loop-btn').removeClass('active');
            $('#controls .loop-btn').removeClass('rand');
        }
    };
    
    ctx.initPlayList = function () {
        let $li;
        ctx.$listContent.html('');
        $('#playListCount').html(ctx.playList.length);
        $.each(ctx.playList, function (i, item) {
            $li = $(`<li data-find="${item.id}">`).html(item.name).append($('<span>').html(' - ' + item.artist.join(',')));
            $li.on('click touch', function () {
                if (ctx.currentIndex !== i) {
                    ctx.isPlaying = true;
                    ctx.moveTo(i);
                }
            });
            ctx.$listContent.append($li);
        });
        ctx.validatePlayList();
        ctx.$playList.css('bottom', '-100%');
    };
    
    ctx.showPlayList = function () {
        let p = $('#play');
        if(p.is('.lists')){
            p.removeClass('lists');
        } else {
            p.addClass('lists');
        }
    };
    $("html,body").on('click touch touchstart', function (e) {
        if ($(e.target).parents('#playList').length === 0 && !$(e.target).is('.list-btn') && !$(e.target).is('#play')) {
            $('#play').removeClass('lists');
        }
    });
    
    ctx.validatePlayList = function () {
        this.h = (ctx.currentIndex + 1) * ctx.heightActive - ctx.$listContent.height() / 2;
        ctx.$listContent.children('li.active').removeClass('active').children("div.song-play").remove();
        ctx.$listContent.children('li').eq(ctx.currentIndex).addClass('active').prepend($('<div>').addClass('song-play'));
        ctx.$listContent.animate({
            scrollTop: this.h
        });
    };
    
    ctx.initState = function () {
        $('img').attr('draggable', false);
        ctx.player.addEventListener('ended', function () {
            if(ctx.singleLoop <= 0){
                //顺序 & 随机
                ctx.next();
            } else if (ctx.singleLoop == 1){
                //单曲
                ctx.moveTo(ctx.currentIndex);
            }
        });
        ctx.player.addEventListener('canplay', ctx.readyToPlay);
        window.addEventListener('resize', ctx.updateCoverState);
    };
    
    ctx.updateCoverState = function (derection, preLoad) {
        let speed = 800, defualtUrl = `${myPlay}/static/song.png`,
            updateAlbumImgs = function () {
                $.ajax({
                    url: `${myPlay}/get.php?pic=${ctx.currentSong.pic_id}`,
                    type: 'GET',
                    async: false,
                    dataType: 'json',
                    success: function (data) {
                        ctx.currentSong.picUrl = data.url;
                    },
                    error: function (msg) {
                        console.log(msg);
                    }
                });
                ctx.diskCovers.attr('src', ctx.currentSong.picUrl);
            };
        if (derection === 1) {
            ctx.songUpdated = false;
            if (preLoad) {
                ctx.diskCovers.attr('src', defualtUrl);
            }
        } else if (derection === -1) {
            ctx.songUpdated = false;
        } else {
            ctx.songUpdated = true;
            updateAlbumImgs();
        }
    
    };
    
    ctx.updateSong = function () {
        ctx.updateLyric(ctx.currentSong.id);
        $.ajax({
            url: `${myPlay}/get.php?song=${ctx.currentSong.id}`,
            type: 'GET',
            async: false,
            dataType: 'json',
            success: function (data) {
                ctx.player.src = data.url;
            },
            error: function (msg) {
                console.log(msg);
            }
        });
        setTimeout(ctx.updatePic, 10);
        ctx.updateMusicInfo();
        if (ctx.isPlaying) {
            setTimeout(ctx.play, 500);
        }
        localStorage.setItem("currentSongIndex", ctx.currentIndex);
    };
    
    ctx.updateLyric = function (songID){
        $.ajax({
            url: `${myPlay}/get.php?lrc=${songID}`,
            type: 'GET',
            success: function (data) {
                ctx.setLyric(data);
            }
        });
    }
    
    ctx.setLyric = function (lrc_text) {
        let lrc_map = {};
        let rows = lrc_text.split('\n');
        let time_reg = /\[\d*:\d*((\.|:)\d*)*]/g;

        rows.forEach(row => {
            let time_arr = row.match(time_reg);
            if (!time_arr) return;
            let text = row.replace(time_reg, '').trim();
            time_arr.forEach(time => {
                let [min, sec] = [
                    +time.match(/\[\d*/g)[0].slice(1),
                    +time.match(/:\d*/g)[0].slice(1),
                ];
                lrc_map[min * 60 + sec] = text;
            });
        });
        ctx.lrcMap = lrc_map;
        return lrc_map;
    };
    
    
    
    ctx.curLyric = function (sec) {
        let time_arr = Object.keys(ctx.lrcMap);
        time_arr.sort((pre, next) => +pre < +next ? 1 : -1);
        let ret = {};

        for (let i = 0; i < time_arr.length; i++) {
            let time = time_arr[i];
            if (sec >= time ) {
                ret = {time, lrc: ctx.lrcMap[time]};
                break;
            }
        }
        return ret;
    }
    
    ctx.putLyric = function (sec) {
        let lrc = {};
        lrc = ctx.curLyric(sec);
        if(lrc.lrc && ctx.lrcStr != lrc.lrc){
            ctx.lrcStr = lrc.lrc;
            $('.lyric').html(lrc.lrc);
        }
    }
    
    ctx.updatePic = function () {
        $("#bg").css('background-image', `url(${ctx.currentSong.picUrl})`);
    };
    
    ctx.updateMusicInfo = function () {
        $('#songName').html(ctx.currentSong.name);
        $('#artist').html(ctx.currentSong.artist.join(','));
    };
    
    ctx.play = function () {
        $(ctx.player).on("error", function (e) {
            //如果加载出错就切换下一首（有版权无法播放）
            if(ctx.playFlag){
                ctx.currentIndex = ctx.currentIndex < ctx.playList.length - 1 ? ctx.currentIndex + 1 : 0;
                setTimeout(ctx.preSwitchSong, 1000);
                ctx.playFlag = false;
            }
        });
        if(ctx.playFlag){
            ctx.player.play();
            ctx.isPlaying = true;
            ctx.moveNeedle(true);
            ctx.$playBtn.hide();
            ctx.$pauseBtn.show();
        } else {
            ctx.playFlag = true;
        }
    };
    
    ctx.pause = function () {
        ctx.player.pause();
        ctx.isPlaying = false;
        ctx.moveNeedle(false);
        ctx.$playBtn.show();
        ctx.$pauseBtn.hide();
    };
    
    ctx.moveNeedle = function (play) {
        if (play) {
            ctx.$needle.removeClass("pause-needle").addClass("resume-needle");
        } else {
            ctx.$needle.removeClass("resume-needle").addClass("pause-needle");
        }
    };
    
    ctx.preSwitchSong = function () {
        ctx.songUpdated = false;
        ctx.currentSong = ctx.playList[ctx.currentIndex];
    
        ctx.updateSong();
        ctx.updateCoverState(0);
        
        ctx.player.pause();
        ctx.moveNeedle(false);
        ctx.validatePlayList();
    };
    
    ctx.moveTo = function (index) {
        if (ctx.songUpdated) {
            ctx.currentIndex = index;
            ctx.preSwitchSong();
        }
    };
    
    ctx.next = function () {
        if (ctx.songUpdated) {
            if(ctx.singleLoop >= 0){
                ctx.currentIndex = ctx.currentIndex < ctx.playList.length - 1 ? ctx.currentIndex + 1 : 0;
            } else {
                ctx.currentIndex = Math.floor(Math.random()*(ctx.playList.length + 1));
            }
            ctx.preSwitchSong();
        }
    };
    
    ctx.prev = function () {
        if (ctx.songUpdated) {
            if(ctx.singleLoop >= 0){
                ctx.currentIndex = ctx.currentIndex > 0 ? ctx.currentIndex - 1 : ctx.playList.length - 1;
            } else {
                ctx.currentIndex = 1;
            }
            ctx.preSwitchSong();
        }
    };
    
    ctx.updateProcess = function () {
        let buffer = ctx.player.buffered,
            bufferTime = buffer.length > 0 ? buffer.end(buffer.length - 1) : 0,
            duration = ctx.player.duration,
            currentTime = ctx.player.currentTime;
        ctx.$totTime.text(validateTime(duration / 60) + ":" + validateTime(duration % 60));
        ctx.$rdyBar.width(bufferTime / duration * 100 + '%');
        if (!ctx.processBtnState) {
            ctx.$curBar.width(currentTime / duration * 100 + '%');
            ctx.$curTime.text(validateTime(currentTime / 60) + ":" + validateTime(currentTime % 60));
            ctx.putLyric(currentTime);
        }
    };
    
    ctx.setInterval = function () {
        if (!ctx.interval) {
            ctx.updateProcess();
            ctx.interval = setInterval(ctx.updateProcess, 1000);
        }
    };
    
    ctx.clearInterval = function () {
        if (ctx.interval) {
            clearInterval(ctx.interval);
        }
    
    };
    
    ctx.initProcessBtn = function ($btn) {
        let moveFun = function (ex) {
            let duration = ctx.player.duration,
                e = ex.originalEvent,
                totalWidth = ctx.$processBar.width(), percent, moveX, newWidth;
            e.preventDefault();
            if (ctx.processBtnState) {
                moveX = (e.clientX || e.touches[0].clientX) - ctx.originX;
                newWidth = ctx.$curBar.width() + moveX;
    
                if (newWidth > totalWidth || newWidth < 0) {
                    ctx.processBtnState = 0;
                } else {
                    percent = newWidth / totalWidth;
                    ctx.$curBar.width(newWidth);
                    ctx.$curTime.text(validateTime(percent * duration / 60) + ":" + validateTime(percent * duration % 60));
                }
                ctx.originX = (e.clientX || e.touches[0].clientX);
            }
        },
            startFun = function (e) {
                e = e.originalEvent;
                ctx.processBtnState = 1;
                ctx.originX = (e.clientX || e.touches[0].clientX);
            },
            endFun = function () {
                if (ctx.processBtnState) {
                    ctx.player.currentTime = ctx.$curBar.width() / ctx.$processBar.width() * ctx.player.duration;
                    ctx.processBtnState = 0;
                    ctx.updateProcess();
                }
            };
        $btn.on('mousedown touchstart', startFun);
        $("html,body").on('mouseup touchend', endFun);
        $("#process").on('mousemove touchmove', moveFun);
    }
    
    
    function validateTime(number) {
        let value = (number > 10 ? number + '' : '0' + number).substring(0, 2);
        return isNaN(value) ? '00' : value;
    }
    
    function formatArtists(artists) {
        let names = [];
        $.each(artists, function (i, item) {
            names.push(item.name);
        });
        return names.join('/');
    }
    
    ctx.initPlay = function (param) {
        let url = `${myPlay}/get.php?id=${param}`,
            nowDay = new Date().getDate();

        if(myList == ""){
            url = `${myPlay}/get.php?song=${mySong}`;
        }
        
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                if(myList != ""){
                    ctx.playList = data;
                } else {
                    ctx.playList = data.songs;
                }
                ctx.init();
            },
            complete: function() {
                $('body').removeClass('load');
            },
            error: function (msg) {
                console.log(msg);
                alert('无法加载...');
            }
        });
    };
    
    $("#tools div").on('click touch touchstart',function (){
        if ($(this).is('.share')) {
            let url = window.location.href.split('?'),
                share = `${url[0]}/?list=${myList}&song=${ctx.currentSong.id}`;
            if(myList == ""){
                share = `${url[0]}/?song=${ctx.currentSong.id}`;
            }
            if($('.share-window').length == 0){
                $('.play-board .cover').append(`<input type="text" class="share-window" value="${share}" />`);
            } else {
                $('.share-window').addClass('hide');
                setTimeout(function (){
                    $('.share-window').remove();
                }, 650);
            }
        } else if ($(this).is('.down')) {
            window.open(ctx.player.src);
        }
    });
})(jQuery);

ctx.initPlay(myList);