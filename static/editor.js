var Editor = (function() {
  var state = {},
      iframe,
      previewTimeout,
      otherUserTypingTimeout,
      previewArea = $("#preview"),
      socket,
      codeMirror,
      users;

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
      state.cursor = codeMirror.getCursor();
      if (socket)
        socket.emit('set-editor-state', state);
    }
    refreshPreview(state.content);
  }
  
  var self = {
    init: function(options) {
      var currentTypist = options.currentTypist;
      users = options.users;
      socket = options.socket;
      socket.on("editor-state-change", function(state) {
        var user = users.get(state.lastChangedBy);
        if (user) {
          clearTimeout(otherUserTypingTimeout);
          otherUserTypingTimeout = setTimeout(function() {
            currentTypist.addClass("nobody-typing");
          }, 2000);
          $(".username", currentTypist).text(user.get("username"));
          currentTypist.removeClass("nobody-typing");
        }
        self.setState(state);
        codeMirror.focus();
      });
      codeMirror = CodeMirror(options.source[0], {
        mode: "text/html",
        theme: "default",
        tabMode: "indent",
        lineWrapping: true,
        lineNumbers: true,
        onChange: function() {
          clearTimeout(previewTimeout);
          previewTimeout = setTimeout(startRefreshPreview, 300);
        }
      });
      self.setState(options.state);
    },
    setState: function(newState) {
      state = newState;
      codeMirror.setValue(state.content);
      if (state.cursor)
        codeMirror.setCursor(state.cursor);
      startRefreshPreview();
    }
  };
  
  return self;
})();
