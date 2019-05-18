var plive = plive || {};

(function(pl) {
	
	// TODO - webpack
	
	// TODO - integrate p5.SVG + make custom pattern() func based on svg.js or similar api
	
	// regex to get func params in a string - /[^(\)]+(?=\))/g
	
  /* 
  
  - how to solve issue of using eg f in func args ? currently have to eval entire codeString every frame
  
  */
  
  var textArea, codeMirror, sock;
  
  var codeString = '';
  
  var globalPipeline = [];
  
  var numBuffers = 8;
	
	function _createGlobals() {
		window.w = window.innerWidth;
		window.h = window.innerHeight;
		window.f = 0;
		window.t = 0;
		window.a = window.b = window.c = window.d = window.e = window.g = window.i = window.j = window.k = 0;
		for(var i = 0; i < 10; i++) {
			window['d'+i] = function() {};
			//window['v'+i] = { id: i, pipe: [] };
		}
		window.mic = undefined;
	}
	
	function _createHelpers() {
		
		// p5
		
		window.bg = function() {
			background(...arguments);
		};
		
		window.weight = function() {
			strokeWeight(...arguments);
		}
		
		window.blend = function() {
			blendMode(...arguments);
		}
		
		window.fade = function(level) {
			push();
			noStroke();
			fill(0, level);
			rectMode(CORNER);
			rect(0, 0, w, h);
			pop();
		}
		
		window.flipX = function() {
			//push();
			translate(width, 0);
			scale(-1, 1);
			//pop();
		}
		
		window.flipY = function() {
			//push();
			translate(0, height);
			scale(1, -1);
			//pop();
		}
		
		// utility
		
		window.many = function(numTimes, action) {
			for(var i = 0; i < numTimes; i++) action(i, numTimes);
		}
		
		window.every = function(numFrames, action) {
			// action as func ?
			// make part of chain and remove action arg (affects whole chain) ?
			if(frameCount % numFrames === 0) action();
		}
		
		window.once = (function() {
			var hasBeenCalled = false;
			return function(action) {
				if(!hasBeenCalled) action();
				hasBeenCalled = true;
			}
		})();
		
		// socket
		
		var receiveRemote = function(port) {
			document.getElementById('codearea').style.visibility = "hidden";
			sock = io.connect('http://localhost:' + port);
			sock.on('connect', function() { console.log("listening on localhost port " + port); });
			sock.on('plive', function(data) { console.log(data.s); plive(data.s); });
			sock.on('disconnect', function() { console.log("connection closed"); });
		}
		var sendRemote = function(port) {
			// TODO
		}
	}
	
	function _buildChainables() {
		
		// --- old section ---
		
		/*var p5funcs = [
			'background', 'bg', 'fade', 
			'stroke', 'noStroke', 'fill', 'noFill', 'tint', 'noTint',
			'weight', 'strokeWeight', 'strokeCap', 'strokeJoin',
			'push', 'pop', 'translate', 'rotate', 'scale', 'flipX', 'flipY',
			'point', 'line', 'triangle', 'rect', 'square', 'quad', 'ellipse', 'circle', 'arc', 'bezier', 'curve', 'beginShape', 'vertex', 'endShape', 
			'image', 'text', 
			'loadPixels', 'updatePixels', 'get', 'set', 'filter', 'blendMode', 'blend',
			'rectMode', 'ellipseMode', 'imageMode',
			'many', 'every',
		];
		
		for(var i = 0; i < 10; i++) {
			for(var f = 0; f < p5funcs.length; f++) {
				//if(typeof window[p5funcs[f]] === 'function') {
					(function(func) {
						window['v'+i][func] = function () {
							window[func](...arguments);
							//this.pipe.push({
							//	func: func,
							//	args: arguments
							//});
							return this;
						}.bind(window['v'+i]);
					})(p5funcs[f]);
				//}
				//else {
				//	console.warn('couldnt add ' + p5funcs[f] + ' to chainable objects !');
				//}
			}
		}*/
		
		// modify p5 api
		
		// set context-sensible defaults, eg image(img) same as image(img, 0, 0, w, h) 
		
		// --- end old section ---
		
		// --- begin new section --- http://zenozeng.github.io/p5.js-svg/doc/reference/rendering.js.html#line67
		
		// extend p5 funcs that aren't chainable
		// TODO - separate into simple extensions (eg tint, can loop thru) and custom eg image()
		
		var _image = p5.prototype.image;
		p5.prototype.image = function (img, x, y, w, h) {
			x = typeof x === 'undefined' ? 0 : x;
			y = typeof y === 'undefined' ? 0 : y;
			w = typeof w === 'undefined' ? window.w : w;
			h = typeof h === 'undefined' ? window.h : h;
			var image = _image.apply(this, [img, x, y, w, h]);
			return this;
		}
		
		var _tint = p5.prototype.tint;
		p5.prototype.tint = function () {
			_tint.apply(this, arguments);
			return this;
		}
		
		var _pop = p5.prototype.pop;
		p5.prototype.pop = function () {
			_pop.apply(this);
			return this;
		}
		
		var _push = p5.prototype.push;
		p5.prototype.push = function () {
			_push.apply(this);
			return this;
		}
		
		// aliases
		
		p5.prototype.bg = function () {
			p5.prototype.background.apply(this, arguments);
			return this;
		}
		
		p5.prototype.weight = function () {
			p5.prototype.strokeWeight.apply(this, arguments);
			return this;
		}
		
		p5.prototype.blend = function () {
			p5.prototype.blendMode.apply(this, arguments);
			return this;
		}
		
		// new funcs
		
		p5.prototype.fade = function (amt) {
			amt = typeof amt === 'undefined' ? 10 : amt;
			p5.prototype.push.call(this);
			p5.prototype.noStroke.call(this);
			p5.prototype.fill.call(this, 0, amt);
			p5.prototype.rectMode.call(this, CORNER);
			p5.prototype.rect.call(this, 0, 0, w, h);
			p5.prototype.pop.call(this);
			return this;
		}
		
		p5.prototype.opacity = function (amt) {
			amt = typeof amt === 'undefined' ? 0.5 : amt;
			this._renderer.drawingContext.globalAlpha = amt;
			return this;
		}
		
	}
	
	function _configureP5() {
		
		p5.disableFriendlyErrors = true;
		
		window.setup = function() {
			var renderer = createCanvas(w, h);
			window.mainCanvas = renderer;
			window.mainContext = renderer.elt.getContext('2d');
			//console.log(renderer)
			document.documentElement.style.overflow = 'hidden';
			background(0);
			textArea = document.getElementById("codearea");
			// codeMirror = CodeMirror(function(elt) {
			//   textArea.parentNode.replaceChild(elt, textArea);
			// }, {value: textArea.value});
			// var codeMirror = CodeMirror(document.body, {
			//   value: "draw_ = function() {\n background(0);\n}",
			//   mode:  "javascript"
			// });
			
			for(var i = 0; i < numBuffers; i++) {
				window['v'+i] = (function() {
					var obj = createGraphics(w, h);
					return function() {
						globalPipeline.push(obj);
						return obj;
					}
				})();
			}

			mic = new p5.AudioIn();

			//mic.start();
		}
		
		window.draw = function() {
			var i, j, funcName, funcArgs;
			
			f = window.frameCount;
			t = performance.now() * 1000;
			
			// approach 3 - 'vi' objects are now funcs, generating a pgraphics obj that is already chainable and added to global pipeline on ctrlenter. pipeline is cleared / vi obj replaced on ctlenter
			try {
				eval(codeString);
			} catch(e) {
				// warning ! accessing global obj vij from inside private closure
				vij.error = e.message;
			}
			for(i = 0; i < 4; i++) image(window['v'+i](), 0, 0, w, h);
			//for(i = 0; i < globalPipeline.length; i++) image(globalPipeline[i], 0, 0, w, h);
			
			for(i = 0; i < 10; i++) {
				
				try {
					window['d'+i]();
				} catch(e) {
					console.log(e.message);
				}
				
				// approach 1 - store each chained function call into a local pipe within each 'vi' object
				/*push();
				
				for(j = 0; j < window['v'+i].pipe.length; j++) {
					funcName = window['v'+i].pipe[j].func;
					funcArgs = window['v'+i].pipe[j].args;
					window[funcName](...funcArgs);
				}
				
				pop();*/
			}
			
			// approach 2 - store codeString on ctrlenter, then eval every frame. chained functions have internal p5 side effects
			//eval(codeString);
		}
		
		window.keyPressed = function() {
			ctlenter.keydown(keyCode);
		}
		
		window.keyReleased = function() {
			ctlenter.keyup(keyCode);
		}
	}
	
	pl.init = function() {
		_createGlobals();
		_createHelpers();
		_buildChainables();
		_configureP5();
	}
	
	pl.evaluate = function(s) {
		while(globalPipeline.length) globalPipeline.pop();
		codeString = s;
		return;
		//return;	// uncomment if returning to approach 2
		//for(var i = 0; i < 10; i++) while(window['v'+i].pipe.length) window['v'+i].pipe.pop(); // uncomment if returning to approach 1
		// look for double newlines, only eval the current set of lines
		// lines = txtEl.value.split(/\n\s*\n/)
		try {
			eval(s);
			// also test the new vals of the global dX funcs
		} catch(e) {
		  console.log(e.message);
		  return e.message;
		}
	}
	
})(plive);

  /* function loadjs(url) {
    var e = document.createElement('script');
    e.src = url;
    document.head.appendChild(e);
  } */