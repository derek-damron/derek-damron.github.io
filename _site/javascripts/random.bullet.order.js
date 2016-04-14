var list = document.getElementById("website things");
function shuffleNodes() {
	var nodes = list.children, i = 0;
	nodes = Array.prototype.sort.call(nodes);
	while(i < nodes.length) {
	   list.appendChild(nodes[i]);
	   ++i;
	}
}
shuffleNodes();