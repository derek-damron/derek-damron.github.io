var random_objective = new Array ();
	random_objective[0] = "Professional history";
	random_objective[1] = "Open source projects";
	random_objective[2] = "Presentations from Meetups, conferences, etc.";
	random_objective[3] = "Blog posts";

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 * -> http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
shuffleArray(random_objective);

document.write(
"<ul>"
  + "<li>" + random_objective[0] + "</li>" 
  + "<li>" + random_objective[1] + "</li>"
  + "<li>" + random_objective[2] + "</li>" 
  + "<li>" + random_objective[3] + "</li>"
  +
"</ul>"
);