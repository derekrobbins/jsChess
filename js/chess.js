if (typeof(window.DSR) === 'undefined') {
	window.DSR = {};
}

DSR.Chess = {
	init: function () {
		this.Model.init();
		this.View.init();
		this.Controller.init();
	},

	getColumn: function (num) {
		return String.fromCharCode(num + 96);
	},

	nameToNum: function (name) {
		return {
			x: name.charCodeAt(0) - 97,
			y: name.charCodeAt(1) - 49
		};
	},

	fireMovePiece: function (piece, to) {
		var e = document.createEvent("UIEvents");
		e.initEvent('piece moved', true, true);
		e.piece = piece;
		e.to = to || 0;
		document.body.dispatchEvent(e);
	},

	subscribeMovePiece: function (func) {
		window.addEventListener('piece moved', func, false);
	},

	Model: {},
	View: {},
	Controller: {}
};

DSR.Chess.Model = (function () {
	var model = {},
		x = 0,
		y = 0;

	model.init = function () {
		// Set up board data structure
		model.board = [];
		for (x = 0; x < 8; x++) {
			model.board.push([]);
			for (y = 0; y < 8; y++) {
				var name = DSR.Chess.getColumn(x + 1);
				name = name.concat(y + 1);
				model.board[x].push(new Square(name));
			}
		}

		// Set up players
		$('button').click(function () {
			$('.modalShade, .window').hide();
			model.players = [];
			model.players.push(new Player('w'));
			model.players.push(new Player('bl'));
		});
	};

	var Player = function (color) {
		this.color = color;
	};


	Player.prototype.init = function () {
			var pieces = ['r','n','b','q','k','b','n','r'],
				row = this.getColor() == 'w' ? 1 : 8,
				column = 1;

			// Create power pieces
			for (; column <= 8; column++) {
				new Piece({
					color: this.getColor(),
					type: pieces[column-1],
					position: {
						column: getColumn(column),
						row: row
					}
				});
			}

			// Create pawns
			for (column = 1; column <= 8; column++) {
				new Piece({
					color: this.getColor(),
					type: 'p',
					position: {
						column: getColumn(column),
						row: (row - 1) ? 7 : 2
					}
				});
			}
		};

	var Square = function (name) {
		this.name = name;
		this.attackers = [];
		this.contains = 0;
		this.piece = 0;
	};

	Square.prototype = {
		setPiece: function (piece) {
			from = piece.position;
			this.piece = piece;

			DSR.Chess.fireMovePiece(piece, this.name);
		},

		clearPiece: function () {
			this.piece = '';
		},

		getAttackers: function () {
			return properties.attackers;
		},
	};

	var Player = function (color) {
		this.color = color;

		this.init();
	};

	Player.prototype.init = function () {
		var pieces = ['r','n','b','q','k','b','n','r'],
			row = this.color == 'w' ? 1 : 8,
			column = 1;

		// Create power pieces
		for (; column <= 8; column++) {
			new Piece({
				color: this.color,
				type: pieces[column-1],
				position: {
					column: DSR.Chess.getColumn(column),
					row: row
				}
			});
		}

		// Create pawns
		for (column = 1; column <= 8; column++) {
			new Piece({
				color: this.color,
				type: 'p',
				position: {
					column: DSR.Chess.getColumn(column),
					row: (row - 1) ? 7 : 2
				}
			});
		}
	};

	var Piece = function (oArgs) {
		this.position = oArgs.position;
		this.html = '<div class="piece ' + oArgs.color + " " + oArgs.type + '"></div>';
		this.type = oArgs.type;
		this.color = oArgs.color;

		this.setPosition(this.position);
	};

	Piece.prototype = {

		setPosition: function (pos) {
			position = pos.column  + pos.row;
			model.board[pos.column.charCodeAt(0) - 97][pos.row - 1].setPiece(this);
		},

		checkMove: function (to) {
			var from = this.getPosition(),
				deltaX = Math.abs(to.charCodeAt(0) - from.charCodeAt(0)),
				deltaY = to.charCodeAt(1) - from.charCodeAt(1),
				direction = color == 'w' ? 1 : -1,
				startRow = direction ? 2 : 7;

			if (type == 'p') {
				if (deltaY == direction) {
					if (!deltaX) {
						//legal pawn move
						return 1;
					} else if (deltaX == 1 && board.squares[to].getPiece()) {
						// capture
						return 1;
					}
				// First move can be two squares
				} else if (!deltaX &&  (from.charCodeAt(1) - 53) == startRow && deltaY == 2 * direction) {
					return 1;
				}
			} else if (type = 'r') {
				if (!deltaX || !deltaY) {

				}
			}
		}
	};

	return model;
})();

DSR.Chess.View = (function () {
	var view = {};

	var updateBoardView = function (e) {
		var fromId = e.piece.position.column + e.piece.position.row,
			toId = e.to;

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

DSR.Chess.Controller = (function () {
	var controller = {};

	controller.init = function () {
		$('li.row li').click(listenClick);
	};

	var listenClick = function (e) {
		if (!controller.piece && e.currentTarget.innerHTML == '') return;

		var board = DSR.Chess.Model.board,
			name = e.currentTarget.id;

		if (controller.piece) {
			var to = DSR.Chess.nameToNum(name);
				dest = board[to.x][to.y];

			if (dest.piece.color != controller.piece.color) {
				board[to.x][to.y].setPiece(controller.piece);
				board[controller.from.x][controller.from.y].clearPiece();
			}
			
			controller.piece = 0;
		} else {
			controller.from = DSR.Chess.nameToNum(name);
			controller.piece = board[controller.from.x][controller.from.y].piece;
		}
	};

	return controller;
})();

$().ready(function () {
	DSR.Chess.init();
});