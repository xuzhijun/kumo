/*
版本号：alpha
描述：p2aMap组件，作为P2A-JavaScript-Library的一部分
options:

*/
var p2aMap = function (id, options) {
	this._initialize(id, options);
}
p2aMap.prototype = {
	//初始化
	_initialize: function(id, options) {
		this.container = $("#"+id);
		if(!this.container) {
			return false;
		}
		//setOptions
		this._setOptions(options);
		//getOptions
		this.isLocal = this.options.isLocal;
		this.range = this.options.range;
		this.isPoint = this.options.isPoint;
		this.pointUrl = this.options.pointUrl;
		
		this.viewer = this.container.find('.map-view');//可见层，功能块。
		this.entity = this.container.find('.map-entity');//实体层，放置联动元素。
		//功能区域
		this.wheel = this.container.find('.map-wheel');//方向键容器
		this.button = this.container.find('.map-button');//按钮
		this.button.hide();
		this.icon = null;//标点层
		this.select = this.container.find('.map-select');//下拉选项
		this.barList = this.container.find('.map-barList');//系容器
		
		this.mapPositionX = this.entity.position().left;
		this.mapPositionY = this.entity.position().top;

		this.minX = this.container.width() - this.entity.width();
		this.minY = this.container.height() - this.entity.height();
		
		this.isMouseDown = false;
		this.initDrag();
		if(this.isPoint) {
			this.initPoint();
		}
		this.bindWheel();
		this.moveTarget();
	},
	//设置默认属性
	_setOptions: function(options) {
		this.options = {//默认值
			isLocal: false,
			isPoint: false,
			isPointUrl: "",
			range: 100
		};
		$.extend(this.options, options || {});
	},
	//drag
	initDrag: function () {
		var self = this;
		//table
		self.viewer.on('mousedown',{"self": self}, self.moveStart);

	},
	moveStart: function (e) {
		var self = e.data.self;
		self.isMouseDown = true;
		
		
		self.updateAllPosition(e);
		self.viewer.on('mousemove',{"self": self}, self.mapDrag);
		self.viewer.on('mouseup',{"self": self}, self.moveEnd);
		window.getSelection && window.getSelection().removeAllRanges();
		window.blur && window.blur(self.moveEnd());
		//e.preventDefault();
		self.viewer.get(0).setCapture && self.viewer.get(0).setCapture();
		//self.viewer.get(0).losecapture && self.viewer.get(0).losecapture(self.moveEnd(e));
	},
	moveCheck: function (x,y) {
		x = x > 0 ? 0 : x;
		y = y > 0 ? 0 : y;

		x = x < this.minX ? this.minX : x;
		y = y < this.minY ? this.minY : y;
		
		return {"x":x,"y":y}
	},
	moveEnd: function (e) {
		console.log('end');
		var self = e.data.self;
		self.viewer.setCapture && self.viewer.releaseCapture();
		self.updateAllPosition(e);
		self.viewer.off('mousemove');
		self.viewer.off('mouseup');
	},
	moveTarget: function (target) {
		target = target || this.entity;
		var x = Math.floor(this.container.width() / 2 - (target.position().left + target.width() / 2));
		var y = Math.floor(this.container.height() / 2 - (target.position().top + target.height() / 2));
		//console.log(x+":"+y);
		var point = this.moveCheck(x,y);
		this.mapAnimateMove(point.x,point.y);
	},
	mapDrag: function (e) {//移动地图，包含边界控制
		var self = e.data.self;
		//if (!this.isMouseDown) return false;
		var x = e.clientX - self.mousePositionX + self.mapPositionX;
		var y = e.clientY - self.mousePositionY + self.mapPositionY;
		var point = self.moveCheck(x,y);
		self.mapMove(point.x,point.y);
	},
	mapMove: function (x,y) {
		this.entity.css({
			'top': y + "px",
			'left': x + "px"
			/*'-moz-transform': 'translate('+x+'px,'+y+'px)',
			'-webkit-transform': 'translate('+x+'px,'+y+'px)',
			'-o-transform': 'translate('+x+'px,'+y+'px)',
			'-ms-transform': 'translate('+x+'px,'+y+'px)'*/
		});
	},
	//wheel
	bindWheel: function () {
		var self = this;
		//table
		self.wheel.find('div[wheel-to]').on('mousedown',function (e) {
			self.isMouseDown = true;
		});
		self.wheel.find('div[wheel-to]').on('mouseup',function (e) {
			self.mapWheel($(this).attr("wheel-to"));
			self.isMouseDown = false;
		});
	},
	unbindWheel: function () {
		this.wheel.find('div[wheel-to]').off('mousedown');
		this.wheel.find('div[wheel-to]').off('mouseup');
	},
	//map
	mapAnimateMove: function (x,y,before,callback) {
		var self = this;
		before && before.call(self);
		this.entity.animate({
			'top': y + "px",
			'left': x + "px"
		},500,function () {
			self.updateMapPosition();
			callback && callback.call(self);
			
		});
	},
	mapWheel: function (to) {
		var self = this;
		switch(to) {
			case "up":
				self.mapPositionY+=self.range;
				break;
			case "down":
				self.mapPositionY-=self.range;
				break;
			case "left":
				self.mapPositionX+=self.range;
				break;
			case "right":
				self.mapPositionX-=self.range;
				break;
		}
		//this.unbindWheel();
		var point = self.moveCheck(self.mapPositionX,self.mapPositionY);
		self.mapAnimateMove(point.x, point.y, self.unbindWheel, self.bindWheel);
		/*setTimeout(function() {
			
			//self._showMapPosition();
			if(self.isMouseDown) {
				setTimeout(arguments.callee, 5);
			}
		}, 10)*/
	},
	//point
	initPoint: function () {
		this.getPoint();
	},
	getPoint: function () {
		var self = this;
		var jqxhr = $.ajax({
			url: this.pointUrl,
			dataType : "xml"
		}).done(function(data) {
			self.setPoint(data);
			self.initSelect();
			self.initBar();
			self.initButton();
		}).fail(function() {
		});
	},
	setPoint: function (data) {
		var self = this;
		var root = $(data).children('root');
		var icons = root.children('icon');
		for(i=0;i<icons.length;i++) {
			var icon = $(icons[i]);
			var points = icon.children('point');
			var domDiv = $("<div>",{
				'id': icon.attr('name'),
				'class': 'icon'
			});
			for(j=0;j<points.length;j++) {
				var point = $(points[j]);
				var domPoint = $('<div>',{
					'class':'point',
					'name':point.attr('name')
					}).css({
					'left': point.attr('x')+'px',
					'top':point.attr('y')+'px'
				});
				point.attr('text') && domPoint.text(point.attr('text'));
				
				if(point.children('tip').length) {
					var tip = point.children('tip');
					var domTip = $('<div>',{
						'class':'tips'
					});
					if(tip.attr('src') && tip.attr('src')!="") {
						var domImg = $('<img>',{
							'src' : self.isLocal ? tip.attr('src'):'/'+tip.attr('src')
						});
						if(tip.attr('link') && tip.attr('link')!="") {
							var domLink = $('<a>',{
								'href': tip.attr('link'),
								'target': '_blank'
							}).append(domImg).appendTo(domTip);
						}else {
							domTip.append(domImg);
						}
					}
					
					tip.attr('class') && domTip.addClass(tip.attr('class'));
					domPoint.on('click',function () {
						var _this = $(this);
						var _allIcons = self.entity.find('.icon');
						var _allPoints = self.entity.find('.point');
						//icon
						_allIcons.removeClass('show');
						_this.parent('.icon').addClass('show');
						//point
						_allPoints.not(_this).removeClass('show');
						//tips
						_this.hasClass('show') ? _this.removeClass('show') : _this.addClass('show');
						self.moveTarget(_this);
					});
					domPoint.append(domTip);
										
				}
				
				domDiv.append(domPoint);
			}
			this.entity.append(domDiv);
			this.icon = this.container.find('.icon');
		}
	},
	//select
	initSelect: function () {
		this.select.show();
		this.bindSelect();
	},
	bindSelect: function () {
		var self = this;
		var _select = this.select.find('.select');
		var _options = this.select.find('ul');
		_select.on('click', function () {
			$(this).next('ul').toggle();
		});
		_options.on('mouseleave', function () {
			$(this).removeClass();
		}).on('mouseenter','li', function () {
			_options.removeClass();
			_options.addClass($(this).attr('name'));
		}).on('click',"a[icon='all']", function () {
			var _this = $(this);
			self.icon.show();
			self.wheel.show();
			self.barList.hide();
			_select.text(_this.text());
			_options.hide();
		}).on('click','a[bar]', function () {
			var _this = $(this);
			self.wheel.hide();
			$('.barItem').hide();
			$('.bar-'+_this.attr('bar')).show().find('.point-list:first a:first').click();
			self.barList.show();
			_select.text(_this.text());
			_options.hide();
		});
	},
	//bar
	initBar: function () {
		this.bindBar();
	},
	bindBar: function() {
		var self = this;
		this.barList.on('click','.point-list a[move]',function () {
			var _this = $(this);
			var _point = self.icon.find("div[name='"+_this.attr('move')+"']");
			self.icon.hide();
			_point.parent('.icon').show().end().click();
		});
	},
	//button
	initButton: function () {
		this.bindButton();
	},
	bindButton: function () {
		var self = this;
		self.button.show().on('click','a[icon]',function () {
			if(!self.icon) {
				return false;
			}
			self.icon.hide();
			$("#"+$(this).attr('icon')).show().children('.point:first').click();
		});
	},
	//function
	_showMapPosition: function () {
		$(".map-position").length && $(".map-position").text("mapPositionX="+this.mapPositionX+",mapPositionY="+this.mapPositionY);
	},
	updateAllPosition: function (e) {
		this.updateTargetPosition(e);
		this.updateMapPosition();
	},
	updateTargetPosition: function (target) {
		this.mousePositionX = target.clientX;
		this.mousePositionY = target.clientY;
	},
	updateMapPosition: function () {
		this.mapPositionX = this.entity.position().left;
		this.mapPositionY = this.entity.position().top;
		this._showMapPosition();
	}
}