const client = (function () {

  let user_token = window.localStorage.getItem('user-token') || null;
  let user = null;

  function formPost (url, data) {
    let d = data.data;
    delete data.data;
    return fetch(url, Object.assign({
        method: "POST",
        headers: {
          'Accept': 'application/json, text/plain, */*',
          headers: {'Content-Type':'application/x-www-form-urlencoded'}
        },
        body: d,
    }, data)).then(res => res.json());
  }

  function get (url, data) {
    let d = data.data;
    delete data.data;
    return fetch(`${url}${d ? "?" + d : ''}`, Object.assign({
        method: "GET",
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
    }, data)).then(res => res.json());
  }

  function getSearchParams (obj) {
    var searchParams = new URLSearchParams();
    for(const key of Object.keys(obj)) {
      searchParams.set(key, obj[key]);
    }
    return searchParams;
  }

  function createUser (user) {
    return formPost('/api/user/create', {
      data: getSearchParams({
        user: JSON.stringify(user)
      })
    }).then(saveToken).then(saveUser);
  }

  function loginUser (user) {
    return formPost('/api/user/login', {
      data: getSearchParams({
        user: JSON.stringify(user)
      })
    }).then(saveToken).then(saveUser);
  }

  function getUser () {
    if(!user_token) {
      return Promise.resolve({
        code: 400,
        msg: "Invalid token"
      });
    }
    return get('/api/user/', {
      data: getSearchParams({
        token: user_token
      })
    }).then(saveToken).then(saveUser)
  }

  function saveToken (data) {
    if(data.code === 200 && data.token) {
      user_token = data.token;
      window.localStorage.setItem('user-token', data.token);
    } 
    return data;
  }

  function logout () {
    localStorage.removeItem('user-token');
    user = null;
    user_token = null;
  }

  function saveUser (data) {
    if(data.code === 200 && data.user) {
      user = data.user;
    } 
    return data;
  }

  return {
    loginUser,
    createUser,
    formPost,
    get user_token () {
      return user_token;
    },
    get user () {
      return user; 
    },
    getUser,
    logout,
  }
})();
