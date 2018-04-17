// ==UserScript==
// @name         EGS tweaks
// @version      0.1
// @description  EGS bells and whistles
// @author       /u/kuilin (kuilin@gmail.com)
// @match        http://www.egscomics.com/*
// @grant        none
// @require http://code.jquery.com/jquery-1.12.4.min.js
// @updateURL https://raw.githubusercontent.com/likuilin/egs-greasemonkey-tweaks/master/script.js
// ==/UserScript==

(function() {
    'use strict';

    //feel free to edit these
    var settings = {
        //title replacement format (%asdf% = variable)
        titleReplace: true,
        titleReplaceString: "%oldTitle%<br>%superArcTitle%:<br>%arcTitle% #%comicId%",
        //extra nav buttons
        showExtraNavButtons: true,
        showPrevArc: true,
        showCurArc: true,
        showRandom: true,
        showHelp: true,
        showReddit: true,
        showFacebook: true,
        showNextArc: true,
        //"select a comic" selector modifications
        moveDefaultToCurrentLocation: true,
        prependComicId: true,
        //top bar cosmetics
        removeHeaderLogo: false,
        relinkNewReadersToMainPage: false,
        //hide the commentary section if there isn't any
        hideCommentaryIfNoneExists: true,
        //keyboard navigation
        keyboardNavigation: true,
        keyboardNavigationKeys: { //JS keycodes, use -1 to disable
            left:37, down:-1, right:39, up:-1 //arrow keys, up and down disabled (not gonna override scrolling as a default lol)
            //left:37, down:38, right:39, up:40 //arrow keys, all enabled
            //left:65, down:83, right:68, up:87 //uncomment for wasd
        }
    };

    //only run on the main site, sketchbook, or NP
    if (!location.pathname in ['/sketchbook.php', '/egsnp.php', '/', '/index.php']) return;
    //determine current comic id (num)
    var opts=$('select[name="comic"] option');
    var num=~~location.href.split("=")[1];
    if (num == 0) {
        //get the comic id using prev button, or it's 1 if there is no prev button
        if ($(".prev").length == 0) num = 1;
        else num = ~~$(".prev")[0].href.split("=")[1] + 1;
    }
    if (num == 0) {
        console.warn("EGS Tampermonkey script could not find current comic ID, please report this error and the URL to /u/kuilin");
        return;
    }
    //loop thru the selector at the bottom to determine current arc (i)
    //the problem is that id's aren't actually linear... they're mostly
    //linear in the main story but very nonlinear in EGSNP
    //so we find out which jump point is the closest before the current comic
    var i = -1;
	var score = 1e10;
    for(var j=1;j<opts.length;j++)  //skip first one because it's "select a comic"
        if(opts[j].value <= num && (num - opts[j].value < score)) {
			score = num - opts[j].value;
			i = j;
		}

    window.alertHelp = function () {
        alert(`This nav bar is added by Kui's EGS Tampermonkey script, by /u/kuilin. These buttons and more are configurable in the script.

< jumps to the 1st page of the previous arc (gray when in first arc)

= jumps to the 1st page of the current arc (gray when on 1st page of current arc)

! jumps to a random comic (this might give you "There is no comic with this ID.", just try again if it does)

? alerts this help message (the one you're reading now)

R opens Reddit to try to find the thread for the comic (button always works, only blue when the comic is deemed likely to have a thread, as the subreddit was created 3 years ago)

F tries to search Facebook for the comic (it's always blue because Facebook makes it weirdly difficult to tell when the group was created)

> jumps to the 1st page of the next arc (gray when on last arc)

Also, arrow keys can be used to navigate - left and right arrow are next and prev comics, arc skipping is configurable.`);
    };
    window.goToReddit = function (i) {
        //for the main comic, there's 4 ways the URL could have been submitted
        //for sketchbook and NP there's just two
        var searchStr = ""; //abort if can't parse date out of title
        try {
            var comicDate = document.title.split(" - ").pop();
            if (location.pathname == "/sketchbook.php" || location.pathname == "/egsnp.php") searchStr = 'url:"www.egscomics.com'+location.pathname+'?date=' + comicDate + '" OR ';
            else searchStr = 'url:"www.egscomics.com/index.php?date=' + comicDate + '" OR url:"www.egscomics.com/?date=' + comicDate + '" OR ';
        } catch (e) {}
        if (location.pathname == "/sketchbook.php" || location.pathname == "/egsnp.php") searchStr += 'url:"www.egscomics.com'+location.pathname+'?id=' + i + '"';
        else searchStr += 'url:"www.egscomics.com/index.php?id=' + i + '" OR url:"www.egscomics.com/?id=' + i + '"';
        window.open("https://www.reddit.com/r/elgoonishshive/search?restrict_sr=on&sort=relevance&t=all&syntax=lucene&q=" + encodeURIComponent(searchStr));
    };
    window.goToFacebook = function () {
        window.open('https://www.facebook.com/search/top/?q="'+encodeURIComponent(location.href)+'"');
    };
    window.jumpRandom = function () {
        location.search = '?id=' + Math.floor(1 + ($(".last").length ? parseInt($(".last").attr("href").split("=")[1]) : num) * Math.random());
    };

    var titleElem=$(".nav div:not(.navspace1):not(.firstdis):not(.prevdis)");
    var arcHop = "";
    if (settings.showExtraNavButtons) {
        arcHop = [];
        if (settings.showPrevArc) arcHop.push(i>1?('<span style="color:blue;cursor:pointer" onclick="changePage(' + opts[i-1].value + ');">&lt;</span>'):'&lt;');
        if (settings.showCurArc) arcHop.push(opts[i].value!=num?('<span style="color:blue;cursor:pointer" onclick="changePage(' + opts[i].value + ');">=</span>'):'=');
        if (settings.showRandom) arcHop.push('<span style="color:blue;cursor:pointer" onclick="jumpRandom();">!</span>');
        if (settings.showHelp) arcHop.push('<span style="color:blue;cursor:pointer" onclick="alertHelp();">?</span>');
        if (settings.showReddit) arcHop.push('<span style="'+((
            ((location.pathname=="/" || location.pathname=="/index.php") && num>=1875) ||
            (location.pathname=="/egsnp.php" && num>=180) ||
            (location.pathname=="/sketchbook.php" && num>=766)
        )?'color:blue;':'')+'cursor:pointer" onclick="goToReddit('+num+');">R</span>');
        if (settings.showFacebook) arcHop.push('<span style="color:blue;cursor:pointer" onclick="goToFacebook();">F</span>');
        if (settings.showNextArc) arcHop.push(i+1<opts.length?('<span style="color:blue;cursor:pointer" onclick="changePage(' + opts[i+1].value + ');">&gt;</span>'):'&gt;');
        arcHop = '<br>' + arcHop.join(' | ');
    }

    if (settings.titleReplace) $(titleElem[0]).html(
        settings.titleReplaceString
        .split("%oldTitle%").join(titleElem.html())
        .split("%superArcTitle%").join(opts[i].parentElement.label)
        .split("%arcTitle%").join(opts[i].innerHTML)
        .split("%comicId%").join(num)+
        arcHop
    ).css("margin",0);

    //add id numbers to select a comic
    if (settings.prependComicId) $('select[name="comic"] option').each((i,e)=>e.innerHTML="#"+e.value+" "+e.innerHTML);
    //move "select a comic" to where the current comic would be
    if (settings.moveDefaultToCurrentLocation) $($('select[name="comic"] option')[0]).insertAfter($(opts[i])).text((settings.prependComicId?'#' + num : '') + ' > Current Location < ').css("font-weight","bold");

    //hide header and make New Readers redirect to main page - primarily cosmetic
    if (settings.removeHeaderLogo) {
        $('#header').hide();
        $('#menu').css({
            display:"inline-block",
            paddingTop:10
        });
    }
    if (settings.relinkNewReadersToMainPage) $("#newreaders").attr("href", "/");
    if (settings.hideCommentaryIfNoneExists && $("#newsarea").html()=='<div id="newsheader"></div>No DVD movie style commentary yet exists for this comic. Or is it DVD TV show style commentary? It&amp;039;s some sort of commentary, anyway.<br><br>If you would like to see commentary for this specific comic, contact me and let me know. The site didn&amp;039;t always have commentary, and reader feedback helps me pick which older comics to comment on next.')
        $("#news").html("");

    //arrow key navigation
    if (settings.keyboardNavigation) {
        document.addEventListener("keyup", (function (e) {
            if (e.keyCode == this.settings.keyboardNavigationKeys.left && $(".prev")[0]) $(".prev")[0].click(); //left
            else if (e.keyCode == this.settings.keyboardNavigationKeys.right && $(".next")[0]) $(".next")[0].click(); //right
            else if (e.keyCode == this.settings.keyboardNavigationKeys.down && this.i+1<this.opts.length) changePage(opts[i+1].value); //down
            else if (e.keyCode == this.settings.keyboardNavigationKeys.up && this.num != 1) {
                //up does different things
                //if we're currently at the 1st comic in an arc, hop to the previous arc's first comic
                //otherwise hop to the 1st comic in the arc
                if (opts[i].value!=num) changePage(opts[i].value);
                else changePage(opts[i-1].value);
            }
        }).bind({opts: opts, i: i, num: num, settings: settings}));
    }
})();
