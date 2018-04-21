const HighScoresView = (function HighScoresView (AudioPool) {
  var buttonMenu = null;
  var totalTableHead = '<tr><th>Username</th>'
    + '<th class="highscore-hoverable" onclick="HighScoresView.orderByWins()">Wins</th>'
    + '<th class="highscore-hoverable" onclick="HighScoresView.orderByKills()">Kills</th>'
    + '<th class="highscore-hoverable" onclick="HighScoresView.orderByDamage()">Damage</th>'
    + '<th class="highscore-hoverable" onclick="HighScoresView.orderByAccuracy()">Accuracy</th></tr>';
  var averageTableHead = '<tr><th>Username</th>'
    + '<th class="highscore-hoverable" onclick="HighScoresView.orderByWinRate()">Win Rate</th>'
    + '<th class="highscore-hoverable" onclick="HighScoresView.orderByKillsPerGame()">Kills</th>'
    + '<th class="highscore-hoverable" onclick="HighScoresView.orderByDamagePerGame()">Damage</th>';

  var highScores = {}

  function render(data) {
    getHighScores().then(([sortedUsers]) => {
      highScores = sortedUsers;
      orderByKills();
    }).catch(e => { console.error(e); });
    keyboard.activate();
    buttonMenu.activate();
  }

  function unrender(data) {
    keyboard.deactivate();
    buttonMenu.deactivate();
  }

  function init() {
    keyboard = KeyboardHandler(true);
    keyboard.addOnceAction('Escape', function (e) {
      MainView.loadView(MenuView.name);
      AudioPool.playSFX('menu_click');
    });

    buttonMenu = ButtonMenu($('#highscore-menu')[0]);
  }

  function getHighScores(){
    return Promise.all(
      [
        client.get('/api/highscore/sortedUsers')
      ]
    )
  }

  function orderByWins(){
    var scores = totalTableHead;
    for(let i = 0; i < Object.keys(highScores.users.byWins).length; i++){
      scores += client.user.name === highScores.users.byWins[i].name ? '<tr id="highscore-current-user">' : '<tr>';
      scores += '<td>' + highScores.users.byWins[i].name
        + '</td><td>' + highScores.users.byWins[i].totalWins
        + '</td><td>' + highScores.users.byWins[i].totalKills
        + '</td><td>' + highScores.users.byWins[i].totalDamageDealt
        + '</td><td>' + getNumberForPercent(highScores.users.byWins[i].bullets.hit, highScores.users.byWins[i].bullets.total)
        + '</td></tr>'
    }
    $('#highscore-table')[0].innerHTML = scores;
  }

  function orderByKills(){
    var scores = totalTableHead;
    for(let i = 0; i < Object.keys(highScores.users.byKills).length; i++){
      scores += client.user.name === highScores.users.byKills[i].name ? '<tr id="highscore-current-user">' : '<tr>';
      scores += '<td>' + highScores.users.byKills[i].name
        + '</td><td>' + highScores.users.byKills[i].totalWins
        + '</td><td>' + highScores.users.byKills[i].totalKills
        + '</td><td>' + highScores.users.byKills[i].totalDamageDealt
        + '</td><td>' + getNumberForPercent(highScores.users.byKills[i].bullets.hit, highScores.users.byKills[i].bullets.total)
        + '</td></tr>'
    }
    $('#highscore-table')[0].innerHTML = scores;
  }

  function orderByDamage(){
    var scores = totalTableHead;
    for(let i = 0; i < Object.keys(highScores.users.byDamage).length; i++){
      scores += client.user.name === highScores.users.byDamage[i].name ? '<tr id="highscore-current-user">' : '<tr>';
      scores += '<td>' + highScores.users.byDamage[i].name
        + '</td><td>' + highScores.users.byDamage[i].totalWins
        + '</td><td>' + highScores.users.byDamage[i].totalKills
        + '</td><td>' + highScores.users.byDamage[i].totalDamageDealt
        + '</td><td>' + getNumberForPercent(highScores.users.byDamage[i].bullets.hit, highScores.users.byDamage[i].bullets.total)
        + '</td></tr>'
    }
    $('#highscore-table')[0].innerHTML = scores;
  }

  function orderByAccuracy(){
    var scores = totalTableHead;
    for(let i = 0; i < Object.keys(highScores.users.byAccuracy).length; i++){
      scores += client.user.name === highScores.users.byAccuracy[i].name ? '<tr id="highscore-current-user">' : '<tr>';
      scores += '<td>' + highScores.users.byAccuracy[i].name
        + '</td><td>' + highScores.users.byAccuracy[i].totalWins
        + '</td><td>' + highScores.users.byAccuracy[i].totalKills
        + '</td><td>' + highScores.users.byAccuracy[i].totalDamageDealt
        + '</td><td>' + getNumberForPercent(highScores.users.byAccuracy[i].bullets.hit, highScores.users.byAccuracy[i].bullets.total)
        + '</td></tr>'
    }
    $('#highscore-table')[0].innerHTML = scores;
  }

  function orderByWinRate(){
    var scores = averageTableHead;
    for(let i = 0; i < Object.keys(highScores.users.byWinRate).length; i++){
      scores += client.user.name === highScores.users.byWinRate[i].name ? '<tr id="highscore-current-user">' : '<tr>';
      scores += '<td>' + highScores.users.byWinRate[i].name
        + '</td><td>' + getNumberForPercent(highScores.users.byWinRate[i].totalWins, highScores.users.byWinRate[i].totalGames)
        + '</td><td>' + getNumberWithCorrectDecimal(highScores.users.byWinRate[i].totalKills, highScores.users.byWinRate[i].totalGames)
        + '</td><td>' + getNumberWithCorrectDecimal(highScores.users.byWinRate[i].totalDamageDealt, highScores.users.byWinRate[i].totalGames)
        + '</td></tr>'
    }
    $('#highscore-table')[0].innerHTML = scores;
  }

  function orderByKillsPerGame(){
    var scores = averageTableHead;
    for(let i = 0; i < Object.keys(highScores.users.byKillsPerGame).length; i++){
      scores += client.user.name === highScores.users.byKillsPerGame[i].name ? '<tr id="highscore-current-user">' : '<tr>';
      scores += '<td>' + highScores.users.byKillsPerGame[i].name
        + '</td><td>' + getNumberForPercent(highScores.users.byKillsPerGame[i].totalWins, highScores.users.byKillsPerGame[i].totalGames)
        + '</td><td>' + getNumberWithCorrectDecimal(highScores.users.byKillsPerGame[i].totalKills, highScores.users.byKillsPerGame[i].totalGames)
        + '</td><td>' + getNumberWithCorrectDecimal(highScores.users.byKillsPerGame[i].totalDamageDealt, highScores.users.byKillsPerGame[i].totalGames)
        + '</td></tr>'
    }
    $('#highscore-table')[0].innerHTML = scores;
  }

  function orderByDamagePerGame(){
    var scores = averageTableHead;
    for(let i = 0; i < Object.keys(highScores.users.byDamagePerGame).length; i++){
      scores += client.user.name === highScores.users.byDamagePerGame[i].name ? '<tr id="highscore-current-user">' : '<tr>';
      scores += '<td>' + highScores.users.byDamagePerGame[i].name
        + '</td><td>' + getNumberForPercent(highScores.users.byDamagePerGame[i].totalWins, highScores.users.byDamagePerGame[i].totalGames)
        + '</td><td>' + getNumberWithCorrectDecimal(highScores.users.byDamagePerGame[i].totalKills, highScores.users.byDamagePerGame[i].totalGames)
        + '</td><td>' + getNumberWithCorrectDecimal(highScores.users.byDamagePerGame[i].totalDamageDealt, highScores.users.byDamagePerGame[i].totalGames)
        + '</td></tr>'
    }
    $('#highscore-table')[0].innerHTML = scores;
  }

  function getNumberWithCorrectDecimal(a,b){
    return Math.round(a / b * 100)/100;
  }

  function getNumberForPercent(a,b){
    return Math.round(a / b * 100).toString() + '%';
  }

  return {
    render,
    unrender,
    init,
    name: 'HighScoresView',
    orderByWins: orderByWins,
    orderByWinRate: orderByWinRate,
    orderByKills: orderByKills,
    orderByKillsPerGame: orderByKillsPerGame,
    orderByDamage: orderByDamage,
    orderByDamagePerGame: orderByDamagePerGame,
    orderByAccuracy: orderByAccuracy
  }
})(AudioPool);
