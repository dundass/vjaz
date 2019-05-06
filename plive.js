var plive = plive || {};

(function(pl) {
	
  /* 
  
  v0.push().translate(i/20).rotate(f).stroke(255, i, 20).point(i%8, i/8).pop()
  
  var v0 = {}
  
  v0.push = function () {
	  push();
	  return this;
  }
  
  iterate thru p5 global api copying each key over to the wrapper func on the (p)layer objects:
  
  for(func in plive) {
	  v0[func] = function() {
		  if(typeof window[func] === function) v0[func](); // else console.warn(). hang on, what about the arguments ??
		  return this;
	  }
  }
  
  */
  
  var textArea, codeMirror, sock;
  
  var codeString = '';
	
	function _createGlobals() {
		window.w = window.innerWidth;
		window.h = window.innerHeight;
		window.f = 0;
		window.t = 0;
		window.a = window.b = window.c = window.d = window.e = window.g = window.i = window.j = window.k = undefined;
		for(var i = 0; i < 10; i++) {
			window['d'+i] = function() {};
			window['v'+i] = { id: i, pipe: [] };
		}
		window.mic = undefined;
	}
	
	function _createHelpers() {
		
		// p5
		
		window.bg = function() {
			background(...arguments);
		};
		
		window.fade = function(level) {
			push();
			noStroke();
			fill(0, level);
			rectMode(CORNER);
			rect(0, 0, w, h);
			pop();
		}
		
		// utility
		
		window.iter = function(numTimes, action) {
			for(var i = 0; i < numTimes; i++) action(i);
		}
		
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
		
		var p5funcs = [
			'background', 'bg', 'fade', 'blendMode',
			'stroke', 'noStroke', 'fill', 'noFill', 'tint', 'noTint',
			'strokeWeight', 'strokeCap', 'strokeJoin',
			'push', 'pop', 'translate', 'rotate', 'scale',
			'point', 'line', 'triangle', 'rect', 'square', 'quad', 'ellipse', 'circle', 'arc', 'bezier', 'curve', 'beginShape', 'vertex', 'endShape', 
			'image', 'text', 
			'loadPixels', 'updatePixels', 'get', 'set', 'filter',
			'rectMode', 'ellipseMode', 'imageMode',
		];
		
		for(var i = 0; i < 10; i++) {
			for(var f = 0; f < p5funcs.length; f++) {
				//if(typeof window[p5funcs[f]] === 'function') {
					(function(func) {
						window['v'+i][func] = function () {
							window[func](...arguments);
							/*this.pipe.push({
								func: func,
								args: arguments
							});*/
							return this;
						}.bind(window['v'+i]);
					})(p5funcs[f]);
				//}
				//else {
				//	console.warn('couldnt add ' + p5funcs[f] + ' to chainable objects !');
				//}
			}
		}
		
	}
	
	function _configureP5() {
		p5.disableFriendlyErrors = true;
		
		window.setup = function() {
			var renderer = createCanvas(w, h);
			window.mainCanvas = renderer;
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

			mic = new p5.AudioIn();

			//mic.start();
		}
		
		window.draw = function() {
			var i, j, funcName, funcArgs;
			
			f = window.frameCount;
			t = performance.now() * 1000;
			for(i = 0; i < 10; i++) {
				
				try {
					window['d'+i]();
				} catch(e) {
					console.log(e.message);
				}
				
				/*push();
				
				for(j = 0; j < window['v'+i].pipe.length; j++) {
					funcName = window['v'+i].pipe[j].func;
					funcArgs = window['v'+i].pipe[j].args;
					window[funcName](...funcArgs);
				}
				
				pop();*/
			}
			
			eval(codeString);
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
		codeString = s;
		return;
		for(var i = 0; i < 10; i++) while(window['v'+i].pipe.length) window['v'+i].pipe.pop();
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