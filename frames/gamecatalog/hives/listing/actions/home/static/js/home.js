console.log('home loaded');

$giantbomb.games({filter: 'name:Doom'}, function (data) {

    console.log('games:', data);

});