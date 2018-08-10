var plive = plive || {};

(function(pl) {
	
  // try CodeMirror for editor - or is this decoupled from view ?
  
  var textArea, codeMirror, sock;
	
	function _createGlobals() {
		window.w = window.innerWidth;
		window.h = window.innerHeight;
		window.f = 0;
		window.t = 0;
		window.a = window.b = window.c = window.d = window.e = window.g = window.i = window.j = window.k = undefined;
		for(var i = 0; i < 10; i++) {
			window['v'+i] = function() {};
		}
		window.mic = undefined;
	}
	
	function _createHelpers() {
		window.fade = function(level) {
			noStroke();
			fill(0, level);
			rectMode(CORNER);
			rect(0, 0, w, h);
		}
	}
	
	function _createSocketHelpers() {
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
	
	function _configureP5() {
		p5.disableFriendlyErrors = true;
		
		window.setup = function() {
			createCanvas(w, h);
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

			mic.start();
		}
		
		window.draw = function() {
			f = window.frameCount;
			t = performance.now() * 1000;
			for(var i = 0; i < 10; i++) {
				try {
					window['v'+i]();
				} catch(e) {
					console.log(e.message);
				}
			}
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
		_createSocketHelpers();
		_configureP5();
	}
	
	pl.evaluate = function(s) {
		// look for double newlines, only eval the current set of lines
		// lines = txtEl.value.split(/\n\s*\n/)
		try {
			eval(s);
			// also test the new vals of the global vX funcs
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