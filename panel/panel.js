Editor.registerPanel( 'remote-debugging.panel', {
  // expose your properties
  properties: {
    // EXAMPLE:
    // foobar: {
    //   type: String, // can be Boolean, Date, Number, String, Array or Object
    //   value: '', // default value
    //   reflectToAttribute: false, // optional
    //   readOnly: false, // optional
    //   notify: false, // optional
    //   computed: '_computeFoobar( foo, bar )', // optional
    //   observer: '_foobarChanged', // optional
    // }

    scripts: {
      type: Object,
      value: {}
    }
  },

  listeners: {
    // EXAMPLE:
    // 'foobar': '_onFoobar',
  },

  ready: function () {
    Editor.test = this;

    this.connect();
  },

  connect: function () {
    var Chrome = require('chrome-remote-interface');
    var self = this;

    var params = {
      host: 'localhost',
      port: '9222',

      chooseTab: function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
          if (tabs[i].title.endsWith("index.html")) {
            return i;
          }
        }
        return 0;
      }
    };

    Chrome(params, function (chrome) {
      self.chrome = chrome;

      chrome.Debugger.enable();

      chrome.on('event', self.onEvent.bind(self));
      chrome.ws.on('close', function () {
          Editor.log('ChromeConnect disconnect');
      });
    })
    .on('error', function (err) {
      Editor.error('Cannot connect to Chrome: ', err);
    });
  },

  onEvent: function (message) {
    var Fs = require('fire-fs');

    var params = message.params;
    var method = message.method;

    if(method === 'Debugger.scriptParsed') {
      var fullPath = params.url;

      if (!Fs.existsSync(params.url)) {
        if (fullPath.indexOf('http://') >= 0) {

        }
        else if (fullPath.indexOf('file:///') >= 0) {
          fullPath = fullPath.replace("file:///", "/")
        }
        else {
          fullPath = Editor.url(fullPath);
        }
      }

      this.scripts[fullPath] = params;
    }
  },

  setDebugPoint: function () {
    var path = Editor.url('packages://scene/panel/webview/scene-view.js');
    var script = this.scripts[path];
    var self = this;

    var params = {
      location: {
        lineNumber: 403,//373,
        scriptId: script.scriptId
      }
    };

    this.chrome.Debugger.setBreakpoint(params, function (err, res) {
      console.log('err : ', err);
      console.log('res : ', res);

      if (!err)
        self.breakpointId = res.breakpointId;
    });

    // or

    // var params = {
    //   url: script.url,
    //   lineNumber: 403,//373
    // };

    // this.chrome.Debugger.setBreakpointByUrl(params, this.callback);
  },

  removeDebugPoint: function () {
    var params = {
      breakpointId: this.breakpointId
    };

    this.chrome.Debugger.removeBreakpoint(params, function (err, res) {
      console.log('err : ', err);
      console.log('res : ', res);
    });
  },

  pause: function () {
    this.chrome.Debugger.pause();
  },

  resume: function () {
    this.chrome.Debugger.resume();
  }
});
