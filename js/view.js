DSR.Chess.View = (function () {
	var view = {};

	var updateBoardView = function (e) {
		var fromId = e.from,
			toId = e.piece.square;

		if (fromId) {
			$('#'+fromId).empty();
		}

		$('#'+toId).html(e.piece.html);
	}

	view.init = function () {
		var x = 8,
			y,
			html = '<ul class="board">';

		for (; x; x--) {
			html += '<li class="row"><ul>';
			for (y = 1; y <= 8; y++) {
				color = ((y + x % 2) % 2) ? 'white' : 'black';
				html += '<li id="' + DSR.Chess.getColumn(y) + x + '" class="' + color + '"></li>'
			}
			html += '</ul></li>';
		}

		html += '</ul>';

		$('body').append(html);
	};

	DSR.Chess.subscribeMovePiece(updateBoardView);

	return view;
})();