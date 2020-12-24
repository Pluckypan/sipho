/**
 * bookshelf.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2014, Codrops
 * http://www.codrops.com
 */
(function() {

	var supportAnimations = 'WebkitAnimation' in document.body.style ||
		'MozAnimation' in document.body.style ||
		'msAnimation' in document.body.style ||
		'OAnimation' in document.body.style ||
		'animation' in document.body.style,
		animEndEventNames = {
			'WebkitAnimation': 'webkitAnimationEnd',
			'OAnimation': 'oAnimationEnd',
			'msAnimation': 'MSAnimationEnd',
			'animation': 'animationend'
		},
		// animation end event name
		animEndEventName = animEndEventNames[Modernizr.prefixed('animation')],
		scrollWrap = document.getElementById('scroll-wrap'),
		docscroll = 0,
		books = document.querySelectorAll('#bookshelf > figure');

	function scrollY() {
		return window.pageYOffset || window.document.documentElement.scrollTop;
	}

	function hasClass(ele, cls) {
		cls = cls || '';
		if (cls.replace(/\s/g, '').length == 0) return false;
		return new RegExp(' ' + cls + ' ').test(' ' + ele.className + ' ');
	}

	function addClass(ele, cls) {
		if (!hasClass(ele, cls)) {
			ele.className = ele.className == '' ? cls : ele.className + ' ' + cls;
		}
	}

	function removeClass(ele, cls) {
		if (hasClass(ele, cls)) {
			var newClass = ' ' + ele.className.replace(/[\t\r\n]/g, '') + ' ';
			while (newClass.indexOf(' ' + cls + ' ') >= 0) {
				newClass = newClass.replace(' ' + cls + ' ', ' ');
			}
			ele.className = newClass.replace(/^\s+|\s+$/g, '');
		}
	}

	function getQueryString(name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
		var r = window.location.search.substr(1).match(reg);
		if (r != null && r.length > 2) {
			return unescape(r[2]);
		}
		return null;
	};

	function updateQueryStringParameter(uri, key, value) {
		if (!value) {
			return uri;
		}
		var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
		var separator = uri.indexOf('?') !== -1 ? "&" : "?";
		if (uri.match(re)) {
			return uri.replace(re, '$1' + key + "=" + value + '$2');
		} else {
			return uri + separator + key + "=" + value;
		}
	}

	function replaceParamVal(paramName, replaceWith) {
		var newurl = updateQueryStringParameter(window.location.href, paramName, replaceWith);
		window.history.replaceState({
			path: newurl
		}, '', newurl);
	}

	function Book(el) {
		this.el = el;
		this.book = this.el.querySelector('.book');
		this.ctrls = this.el.querySelector('.buttons');
		this.details = this.el.querySelector('.details');
		// create the necessary structure for the books to rotate in 3d
		this._layout();

		this.bbWrapper = document.getElementById(this.book.getAttribute('data-book'));
		if (this.bbWrapper) {
			this._initBookBlock();
		}
		this._initEvents();
	}

	Book.prototype._layout = function() {
		if (Modernizr.csstransforms3d) {
			this.book.innerHTML =
				'<div class="cover"><div class="front"></div><div class="inner inner-left"></div></div><div class="inner inner-right"></div>';
			var perspective = document.createElement('div');
			perspective.className = 'perspective';
			perspective.appendChild(this.book);
			this.el.insertBefore(perspective, this.ctrls);
		}
		if (this.details) {
			this.closeDetailsCtrl = document.createElement('span')
			this.closeDetailsCtrl.className = 'close-details';
			this.details.appendChild(this.closeDetailsCtrl);
		}
	}

	Book.prototype._initBookBlock = function() {
		// initialize bookblock instance
		this.bb = new BookBlock(this.bbWrapper.querySelector('.bb-bookblock'), {
			speed: 700,
			shadowSides: 0.8,
			shadowFlip: 0.4
		});
		// boobkblock controls
		this.ctrlBBClose = this.bbWrapper.querySelector('.bb-nav-close');
		this.ctrlBBNext = this.bbWrapper.querySelector('.bb-nav-next');
		this.ctrlBBPrev = this.bbWrapper.querySelector('.bb-nav-prev');
	}

	Book.prototype._initEvents = function() {
		var self = this;
		if (!this.ctrls) return;

		if (this.bb) {
			var u = navigator.userAgent;
			var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
			var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
			var dtlBtn = this.ctrls.querySelector('a:nth-child(1)');
			dtlBtn.addEventListener('click', function(ev) {
				if ((isAndroid || isiOS) && dtlBtn.href) {
					return;//window.open(dtlBtn.href)
				}
				ev.preventDefault();
				self._open();
			});
			this.ctrlBBClose.addEventListener('click', function(ev) {
				ev.preventDefault();
				self._close();
			});
			this.ctrlBBNext.addEventListener('click', function(ev) {
				ev.preventDefault();
				self._nextPage();
			});
			this.ctrlBBPrev.addEventListener('click', function(ev) {
				ev.preventDefault();
				self._prevPage();
			});
		}

		if (this.details) {
			this.ctrls.querySelector('a:nth-child(2)').addEventListener('click', function(ev) {
				ev.preventDefault();
				self._showDetails();
			});
			this.closeDetailsCtrl.addEventListener('click', function() {
				self._hideDetails();
			});
		}
	}

	Book.prototype._open = function() {
		docscroll = scrollY();

		classie.add(this.el, 'open');
		classie.add(this.bbWrapper, 'show');

		var self = this,
			onOpenBookEndFn = function(ev) {
				this.removeEventListener(animEndEventName, onOpenBookEndFn);
				document.body.scrollTop = document.documentElement.scrollTop = 0;
				classie.add(scrollWrap, 'hide-overflow');
			};

		if (supportAnimations) {
			this.bbWrapper.addEventListener(animEndEventName, onOpenBookEndFn);
		} else {
			onOpenBookEndFn.call();
		}

		if (this.bbWrapper.id) {
			replaceParamVal("bid", this.bbWrapper.id);
		}
	}

	Book.prototype._close = function() {
		classie.remove(scrollWrap, 'hide-overflow');
		setTimeout(function() {
			document.body.scrollTop = document.documentElement.scrollTop = docscroll;
		}, 25);
		classie.remove(this.el, 'open');
		classie.add(this.el, 'close');
		classie.remove(this.bbWrapper, 'show');
		classie.add(this.bbWrapper, 'hide');

		var self = this,
			onCloseBookEndFn = function(ev) {
				this.removeEventListener(animEndEventName, onCloseBookEndFn);
				// reset bookblock starting page
				self.bb.jump(1);
				classie.remove(self.el, 'close');
				classie.remove(self.bbWrapper, 'hide');
			};

		if (supportAnimations) {
			this.bbWrapper.addEventListener(animEndEventName, onCloseBookEndFn);
		} else {
			onCloseBookEndFn.call();
		}
		replaceParamVal("bid", '0');
		replaceParamVal("page", '1');
	}

	Book.prototype._nextPage = function() {
		this.bb.next();
		var cur = this.bb.currentIdx;
		replaceParamVal("page", cur + 1);
	}

	Book.prototype._prevPage = function() {
		this.bb.prev();
		var cur = this.bb.currentIdx;
		replaceParamVal("page", cur + 1);
	}

	Book.prototype._showDetails = function() {
		classie.add(this.el, 'details-open');
	}

	Book.prototype._hideDetails = function() {
		classie.remove(this.el, 'details-open');
	}

	function init() {
		window.bookdata = {};
		[].slice.call(books).forEach(function(el, i) {
			var book = new Book(el);
			var _id = el.querySelector(".book").getAttribute('data-book');
			window.bookdata[_id] = book;
			book;
		});
		var eleYear = document.getElementsByClassName('year');
		if (eleYear && eleYear.length > 0) {
			eleYear[eleYear.length - 1].innerHTML = new Date().getFullYear();
		}
		var bid = getQueryString("bid");
		if (bid && bid != '0') {
			var page = getQueryString("page");
			var cbook = document.getElementById(bid);
			console.log('bid=' + bid + ' page=' + page);
			if (cbook) {
				addClass(cbook, 'show');
				if (page && page != '0') {
					window.bookdata[bid].bb.jump(page);
				}
			}
		}
		// image lazyload 
		window.lazySizesConfig = window.lazySizesConfig || {};
		// use .lazy instead of .lazyload
		window.lazySizesConfig.lazyClass = 'lazyload';
		// use data-original instead of data-src
		lazySizesConfig.srcAttr = 'data-src';
		//page is optimized for fast onload event
		lazySizesConfig.loadMode = 1;
	}

	init();
	document.onkeydown = function(ev) {
		var ev = ev || window.event;
		var prev = document.querySelector(".show .bb-nav-prev");
		var next = document.querySelector(".show .bb-nav-next");
		var close = document.querySelector('.show .bb-nav-close');
		var vc = document.querySelectorAll('.viewer-in');
		var vcShow = vc != null && vc.length > 0
		console.log(vcShow);
		if (!next || !prev || !close || vcShow) {
			return;
		}

		switch (ev.keyCode) {
			case 27:
				close.click();
				break;
			case 37:
			case 100:
				prev.click();
				break;
			case 32:
			case 39:
			case 102:
				next.click();
				break;
		}
	}
})();
