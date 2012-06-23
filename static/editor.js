var Editor = (function() {
  var state = {},
      iframe,
      timeout,
      previewArea = $("#preview"),
      socket;

  function refreshPreview(sourceCode) {
    var x = 0,
        y = 0,
        doc, wind;
    
    if (iframe) {
      doc = $(iframe).contents()[0];
      wind = doc.defaultView;
      x = wind.pageXOffset;
      y = wind.pageYOffset;
      $(iframe).remove();
    }

    iframe = document.createElement("iframe");
    previewArea.append(iframe);
    
    // Update the preview area with the given HTML.
    doc = $(iframe).contents()[0];
    wind = doc.defaultView;

    doc.open();
    doc.write(sourceCode);
    doc.close();

    // Insert a BASE TARGET tag so that links don't open in
    // the iframe.
    var baseTag = doc.createElement('base');
    baseTag.setAttribute('target', '_blank');
    doc.querySelector("head").appendChild(baseTag);
    
    // TODO: If the document has images that take a while to load
    // and the previous scroll position of the document depends on
    // their dimensions being set on load, we may need to refresh
    // this scroll position after the document has loaded.
    wind.scroll(x, y);
  }
  
  function startRefreshPreview() {
    var newContent = codeMirror.getValue();
    if (newContent != state.content) {
      state.content = newContent;
      if (socket)
        socket.emit('set-editor-state', state);
    }
    refreshPreview(state.content);
  }
  
  var codeMirror = CodeMirror($("#source")[0], {
    mode: "text/html",
    theme: "default",
    tabMode: "indent",
    lineWrapping: true,
    lineNumbers: true,
    onChange: function() {
      clearTimeout(timeout);
      timeout = setTimeout(startRefreshPreview, 300);
    }
  });
  
  var self = {
    setSocket: function(newSocket) {
      socket = newSocket;
      socket.on("editor-state-change", function(state) {
        self.setState(state);
      });
    },
    setState: function(newState) {
      state = newState;
      codeMirror.setValue(state.content);
      startRefreshPreview();
    }
  };
  
  return self;
})();
