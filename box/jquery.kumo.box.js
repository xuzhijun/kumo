/*
版本号：1.0
描述：box组件，作为KUMO的一部分
*/
var kumoBox = function (options) {
	this._initialize(options);
}
kumoBox.prototype = {
	/*
	* 初始化
	*/
	_initialize: function(options) {
		this.cloneBoxes = [];
		//setOptions
		this._setOptions(options);
		//getOptions
		this.trigger = $(this.options.trigger);//触发器，待统一优化
		if(!this.trigger) {
			return false;
		}
		//style
		this.isFixed = !!this.options.isFixed;
		this.isCenter = !!this.options.isCenter;
		this.isModal = !!this.options.isModal;
		this.zIndex = this.options.zIndex;
		//bind
		this.bind(this.trigger);
		//附加方法
		this.onShow = this.options.onShow;
		this.onClose = this.options.onClose;
	},
	//设置默认属性
	_setOptions: function(options) {
		this.options = {//默认值
			isFixed:false,//固定定位
			isCenter:false,//居中
			isModal:false,//模态
			zIndex:1000,//层高
			trigger:'',
			onShow: function() {},
			onClose: function() {}
		};
		$.extend(this.options, options || {});
	},
	create: function () {
		this.createBox();
		this.isModal && this.fnCreateOverlay();
	},
	dispose: function () {
		this.fnDisposeBox();
		this.isModal && this.fnDisposeOverlay();
	},
	show: function () {
		this.fnShowBox();
		this.isModal && this.fnShowOverlay();
	},
	hide: function () {
	},
	/*
	* 	触发器类
	*/
	//初始化触发器
	initTrigger: function () {
	},
	//检查触发器
	checkTrigger: function () {
	},
	//设置触发器
	setTrigger: function () {
	},
	//绑定触发器
	bind: function (trigger, url) {
		var self = this;
		this.objTrigger = trigger.filter(function(index) {
			var _this = $(this);
			return _this.attr('box') && _this.attr('box')!="";
        });
		if(this.objTrigger.length>0) {
			this.objTrigger.on('click', function (event) {
				var _this = $(this);
				self.box = $(_this.attr('box'));
				self.fnCurrentBox(event.target);
			});
		}
	},
	//event
	bindClose: function () {
		var self = this;
		self.objClose = (self.currentCloneBox.find('.close').length && this.currentCloneBox.find('.close')) || this.currentCloneBox;
		self.objClose.css({'cursor':'pointer'});
		self.objClose.on('click',{'self':self}, self.fnDisposeBox);
	},
	bindBtn: function () {
		//console.log(this.currentCloneBox.attr('id'));
		
	},
	bindPrevBox: function () {
		var self = this;
		if(!self.currentCloneBox) {
			return false;
		}
		self.currentCloneBox.delegate('.prev','click',self.fnShowBox);
	},
	bindNextBox: function () {

	},
	//class-content
	fnContent: function (content) {
		this.objContent = this.currentCloneBox.find('.content');
		this.objContent.length>0 ? this.fnSetContent(content) : this.fnCreateContent(content);
		
		return this;
	},
	fnSetContent: function (content) {
		this.objContent.html(content);
	},
	fnCreateContent: function (content) {
		$('<div>').addClass('content').html(content).appendTo(this.currentCloneBox);
		
	},
	//class-box
	fnInitBox: function () {
	},
	fnCurrentBox: function (target) {
		this.objCurrentTrigger = $(target);
		this.fnRemoveBox();
		var _index;
		//console.log(this.objCurrentTrigger.data('jquery_box'));
		if(this.objCurrentTrigger.data('jquery_box')) {//已初始化过
			_index = $.inArray(this.objCurrentTrigger.data('jquery_box'), this.cloneBoxes);
			if(_index<0) {
				this.fnCreateBox();
			}else {
				this.currentCloneBox = this.cloneBoxes[_index];
			}
		}else {//未初始化过
			this.fnCreateBox();
		}
		
		this.fnShowBox();
	},
	fnNextBox: function () {
	},
	fnPrevBox: function () {
	},
	fnCreateBox: function () {//create boxs
		this.currentCloneBox = this.box.clone().attr('id',this.box.attr('id')+'_clone_'+new Date().valueOf());
		this.currentCloneBox.css({
			'z-index':this.zIndex,
			'width':this.box.css('width'),
			'height':this.box.css('height'),
			'margin':this.box.css('margin'),
			'padding':this.box.css('padding')
			
		});
		
		this.bind(this.currentCloneBox.find('*[box]'));
		this.bindClose();
		this.cloneBoxes.push(this.currentCloneBox);
		this.objCurrentTrigger.data('jquery_box',this.currentCloneBox);
		
		return this;
	},
	fnDisposeBox: function(event) {//dispose box
		var self = event.data.self;
		self.fnRemoveBox();
		self.currentCloneBox = null;
		self.isModal && self.fnRemoveOverlay();
		self.onClose();
		
		return self;
	},
	fnShowBox: function() {//show box
		if(this.currentCloneBox.is(':visible')) {
			return false;
		}
		this.bindBtn();
		this.fnFixed();
		this.isCenter && this.fnCenter();
		this.isModal && this.fnOverlay();
		this.currentCloneBox.appendTo($('body')).show();
		this.onShow();
		
		return this;
	},
	fnRemoveBox: function () {//remove box
		this.currentCloneBox && this.currentCloneBox.detach();
	},
	//fix box style
	fnFixed: function () {
		this.currentCloneBox.css("position",this.isFixed ? "fixed" : "absolute");
	},
	fnCenter: function () {
		var top = this.isFixed ? 0-this.currentCloneBox.outerHeight()/2 : $('body').scrollTop();
		var left = this.isFixed ? 0-this.currentCloneBox.outerWidth()/2 : 0-this.currentCloneBox.outerWidth()/2+$('body').scrollLeft();
		this.currentCloneBox.css({
			'left':'50%',
			'top':'50%',
			'margin-left':left+'px',
			'margin-top':top+'px'
		});
	},
	fnOverlay: function () {
		!this.objOverlay && this.fnCreateOverlay();
		if(this.objOverlay.is(':visible')) {
			return false;
		}
		this.objOverlay.appendTo($('body'));
		//self.objClose.on('click', self.fnDisposeOverlay);
	},
	fnCreateOverlay: function () {
		if(this.objOverlay) {
			return false;
		}
		this.objOverlay = $('<div>').addClass('overlay').css({
			'width':'100%',
			'height':'100%',
			'background-image':'about:blank',
			'z-index':this.zIndex-1
		});
	},
	fnRemoveOverlay: function () {
		this.objOverlay.detach();
		//this.objOverlay = null;
	}
}