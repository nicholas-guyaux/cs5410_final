const Async = (function () {
  // logs errors but doesn't reject.
  function all (arr) {
    return Promise.all(arr.map(el => el.catch(e => {console.error(e);})));
  }
  return {
    all: all,
  };
})();
