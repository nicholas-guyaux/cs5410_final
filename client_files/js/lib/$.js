// bling and bling bling selectors inspired by Paul Irish
// do it jquery style where it returns an empty array selection
// if nothing was found. This way an can just do nothing instead of erroring.
const $ = Object.assign((selector, startEl=document) => {
  var res = Array.from([startEl.querySelector(selector)]).filter(x => !!x);
  if(res.length === 0) {
    console.warn(new Error(`Empty selection with selector '${selector}'.`))
  }
  return res;
}, {
  text (textVal) {
    return document.createTextNode();
  }
});
const $$ = (selector, startEl=document) => {
  var res = Array.from(startEl.querySelectorAll(selector)).filter(x => !!x);
  if(res.length === 0) {
    console.warn(new Error(`Empty selection with selector '${selector}'.`))
  }
  return res;
};
