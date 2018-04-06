const HTML = (function () {
  // https://stackoverflow.com/a/12034334/2066736
  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  // https://stackoverflow.com/a/12034334/2066736
  function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
      return entityMap[s];
    });
  }
  
  return {
    escape: escapeHtml,
  };
})();
