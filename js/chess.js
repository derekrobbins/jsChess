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

	fireMovePiece: function (piece, from) {
		var e = document.createEvent("UIEvents");
		e.initEvent('piece moved', true, true);
		e.piece = piece;
		e.from = from || 0;
		document.body.dispatchEvent(e);
	},

	subscribeMovePiece: function (func) {
		window.addEventListener('piece moved', func, false);
	},
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
	};

	model.Player = function (color) {
		this.color = color;

		this.init();
	};


	model.Player.prototype.init = function () {
			var pieces = ['r','n','b','q','k','b','n','r'],
				row = this.color == 'w' ? 1 : 8,
				column = 1;

			// Create power pieces
			for (; column <= 8; column++) {
				new Piece({
					color: this.color,
					type: pieces[column-1],
					position: DSR.Chess.getColumn(column) + row
				});
			}

			// Create pawns
			row = this.color == 'w' ? 2 : 7
			for (column = 1; column <= 8; column++) {
				new Piece({
					color: this.color,
					type: 'p',
					position: DSR.Chess.getColumn(column) + row
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
			this.piece.position = this.name;

			DSR.Chess.fireMovePiece(piece, from);
		},

		clearPiece: function () {
			// ***ADD: event to clear view square on clearPiece, needed for en passant ***
			this.piece = 0;
		},

		getAttackers: function () {
			return properties.attackers;
		},
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
			model.board[pos.charCodeAt(0) - 97][pos.charCodeAt(1) - 49].setPiece(this);
		},
	};

	return model;
})();

DSR.Chess.View = (function () {
	var view = {};

	var updateBoardView = function (e) {
		var fromId = e.from,
			toId = e.piece.position;

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
		var model = DSR.Chess.Model;
		// Set up players
		$('button').click(function () {
			$('.modalShade, .window').hide();
			model.players = [];
			model.players.push(new model.Player('w'));
			model.players.push(new model.Player('bl'));
		});

		$('li.row li').click(listenClick);
	};

	var emptyBetween = function (from, to) {
		var deltaX = to.x - from.x,
			deltaY = to.y - from.y,
			absX = Math.abs(deltaX),
			absY = Math.abs(deltaY),
			xDir = deltaX / absX,
			yDir = deltaY / absY,
			board = DSR.Chess.Model.board,
			index = 1;

		if (absX == absY) {
			for (index = 1; index < absX; index++) {
				if (board[from.x+index*xDir][from.y+index*yDir].piece) return 0;
			}
			return 1;
		} else if (!deltaX || !deltaY) {
			if (deltaX) {
				for (index = 1; index < absX; index++) {
					if (board[from.x+index*xDir][from.y].piece) return 0;
				}
				return 1;
			} else {
				for (index = 1; index < absY; index++) {
					if (board[from.x][from.y+index*yDir].piece) return 0;
				}
				return 1;
			}
		}
	};

	var validateMove = function (piece, from, to) {
		var deltaX = to.x - from.x,
			deltaY = to.y - from.y,
			absX = Math.abs(deltaX),
			absY = Math.abs(deltaY),
			xDir = deltaX / absX,
			yDir = deltaY / absY,
			direction = piece.color == 'w' ? 1 : -1,
			board = DSR.Chess.Model.board,
			capturePiece = board[to.x][to.y].piece,
			index = 1;

		if(piece.type != 'n' && !emptyBetween(to, from)) return 0;

		piece.moved = piece.moved || 0;

		// Pawn movement
		if (piece.type == 'p') {
			if (deltaY == direction) {
				// Standard movement
				if (!deltaX && !capturePiece) {
					piece.moved += 1;
					if (piece.moved == 6) {
						// ***ADD: Fire event for promotion***
					}
					return 1;
				// Capture movement
				} else if (absX == 1 && capturePiece) {
					piece.moved += 1;
					return 1;
				// Special case: en passant
				} else if (piece.moved == 3 && board[to.x][from.y].piece.enpassant && !board[to.x][to.y].piece) {
					board[to.x][from.y].clearPiece();
					return 1;
				}
			// Special case first move pawn can move two spaces
			} else if (deltaY == direction * 2 && !deltaX && !piece.moved) {
				piece.moved = 2;
				piece.enpassant = 1;
				return 1;
			}
		// Rook Movement
		} else if (piece.type == 'r') {
			if (!deltaX || !deltaY) {
				piece.moved = 1;
				return 1;
			}

		// Knight Movement
		} else if (piece.type == 'n') {
			if (deltaY * deltaY + deltaX * deltaX == 5) return 1;
		
		// Bishop Movement
		} else if (piece.type == 'b') {
			if (absX == absY) return 1;

		// Queen Movement
		} else if (piece.type == 'q') {
			if (absX == absY || (!deltaX || !deltaY)) return 1;

		// King Movement
		} else if (piece.type == 'k') {
			// ***ADD: test for attacked squares***
			if (absX <= 1 && absY <= 1) {
				piece.moved = 1;
				return 1;
			// Castle
			} else if (!deltaY && !piece.moved && absX == 2) {
				var rook = (xDir > 0) ? 7 : 0;
				if (!board[rook][from.y].piece.moved && emptyBetween(from,{x:rook, y:from.y})) {
					// Move rook to opposite side of king
					board[to.x - 1 * xDir][from.y].setPiece(board[rook][from.y].piece);
					return 1;
				}
			}
		}
	};

	var listenClick = function (e) {
		if (!controller.piece && e.currentTarget.innerHTML == '') return;

		var board = DSR.Chess.Model.board,
			name = e.currentTarget.id;

		if (controller.piece) {
			var to = DSR.Chess.nameToNum(name);
				dest = board[to.x][to.y];

			if (dest.piece.color != controller.piece.color && validateMove(controller.piece, controller.from, to)) {
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
