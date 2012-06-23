var Editor = (function() {
  var iframe,
      currentTypist,
      previewTimeout,
      otherUserTypingTimeout,
      previewArea,
      socket,
      codeMirror,
      users,
      lastState = {};

  function refreshPreview() {
    var x = 0,
        y = 0,
        doc, wind,
        sourceCode = codeMirror.getValue();
    
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
  
  function setEditorProperty(data) {
    var user = users.get(data.source);
    if (user) {
      clearTimeout(otherUserTypingTimeout);
      otherUserTypingTimeout = setTimeout(function() {
        codeMirror.setOption("readOnly", false);
        currentTypist.addClass("nobody-typing");
      }, 2000);
      $(".username", currentTypist).text(user.get("username"));
      codeMirror.setOption("readOnly", true);
      currentTypist.removeClass("nobody-typing");
    }
    if (data.property == 'content')
      codeMirror.setValue(data.value);
    if (data.property == 'cursor')
      codeMirror.setSelection(data.value.start, data.value.end);
    lastState[data.property] = data.value;
    codeMirror.focus();
  }
  
  setInterval(function resync() {
    if (!socket)
      return;
    
    if (!currentTypist.hasClass("nobody-typing"))
      return;
    
    var newState = {
      content: codeMirror.getValue(),
      cursor: {
        start: codeMirror.getCursor(true),
        end: codeMirror.getCursor(false)
      }
    };
    Object.keys(newState).forEach(function(property) {
      if (property == "cursor" &&
          _.isEqual(newState[property], {
            start: {line: 0, ch: 0},
            end: {line: 0, ch: 0}
          }))
        // Weird phantom cursor change, ignore it.
        return;
      if (!_.isEqual(lastState[property], newState[property])) {
        socket.emit('set-editor-property', {
          property: property,
          value: newState[property]
        });
        lastState[property] = newState[property];
      }
    });
  }, 500);
  
  var self = {
    init: function(options) {
      currentTypist = options.currentTypist;
      previewArea = options.preview;
      users = options.users;
      socket = options.socket;
      socket.on("set-editor-property", setEditorProperty);
      codeMirror = CodeMirror(options.source[0], {
        mode: "text/html",
        theme: "default",
        tabMode: "indent",
        lineWrapping: true,
        lineNumbers: true,
        onChange: function() {
          clearTimeout(previewTimeout);
          previewTimeout = setTimeout(refreshPreview, 300);
        }
      });
      Object.keys(options.state).forEach(function(property) {
        setEditorProperty({
          property: property,
          value: options.state[property]
        });
      });
    }
  };
  
  return self;
})();
