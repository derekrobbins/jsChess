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

	squareToPosition: function (name) {
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

	model.dumpBoard = function () {
		var x = 0,
			y = 0,
			board = [];

		for (; y < 8; y++) {
			board.push([]);
			for (x = 0; x < 8; x++) {
				board[y].push(DSR.Chess.Model.board[x][y].piece.type || 0);
			}
		}

		return board;
	};

	model.Player = function (color) {
		this.color = color;

		this.init();
		console.log(model);
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
					square: DSR.Chess.getColumn(column) + row
				});
			}

			// Create pawns
			row = this.color == 'w' ? 2 : 7
			for (column = 1; column <= 8; column++) {
				new Piece({
					color: this.color,
					type: 'p',
					square: DSR.Chess.getColumn(column) + row
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
			from = piece.square;
			from.piece = 0;
			this.piece = piece;
			piece.square = this.name;
			piece.position = DSR.Chess.squareToPosition(this.name);

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
		this.square = oArgs.square;
		this.html = '<div class="piece ' + oArgs.color + " " + oArgs.type + '"></div>';
		this.type = oArgs.type;
		this.color = oArgs.color;
		this.position = DSR.Chess.squareToPosition(this.square);

		this.validateMove = DSR.Chess.Controller.validateMove[this.type];
		this.getAttacks = DSR.Chess.Controller.getAttacks[this.type];

		this.setPosition(this.position);
	};

	Piece.prototype = {
		setPosition: function (pos) {
			model.board[pos.x][pos.y].setPiece(this);
		},
	};

	return model;
})();


