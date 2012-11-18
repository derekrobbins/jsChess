if (typeof(window.DSR) === 'undefined') {
	window.DSR = {};
}

DSR.Chess = function () {
	// Converts a numbered column (1-8) to its letter equivilent
	var getColumn = function (num) {
		return String.fromCharCode(num + 96);
	};

	var board = (function () {
		var x = 0,
			y = 0;

		var Square = function (name) {
			var properties = {
				piece: '',
				attackers: []
			};

			this.getName = function () {
				return name;
			};

			this.setPiece = function (piece) {
				updateBoardView({
					from: properties.piece ? properties.piece.getPosition() : '',
					to: piece.getPosition(),
					piece: piece.getHTML()
				});

				properties.piece = piece;
			};

			this.getPiece = function () {
				return properties.piece;
			};

			this.clearPiece = function () {
				properties.piece = '';
			};

			this.getAttackers = function () {
				return properties.attackers;
			};
		};

		// Set up board data structure
		this.squares = {};
		for (x = 0; x < 8; x++) {
			for (y = 0; y < 8; y++) {
				var name = getColumn(x + 1);
				name = name.concat(y + 1);
				this.squares[name] = new Square(name);
			}
		}

		return this;
	})();

	var Player = function (color) {
		this.getColor = function () {return color};

		this.init();
	};

	Player.prototype.init = function () {
		var pieces = ['rook', 'knight', 'bishop'],
			row = this.getColor() == 'white' ? 1 : 8,
			column = 1;

		new Piece({
			color: this.getColor(),
			type: 'queen',
			position: {
				column: 'd',
				row: row
			}
		});
		new Piece({
			color: this.getColor(),
			type: 'king',
			position: {
				column: 'e',
				row: row
			}
		});

		for (; column < 4; column++) {
			new Piece({
				color: this.getColor(),
				type: pieces[column-1],
				position: {
					column: getColumn(column),
					row: row
				}
			});

			new Piece({
				color: this.getColor(),
				type: pieces[column-1],
				position: {
					column: getColumn(9 - column),
					row: row
				}
			});
		}

		for (column = 1; column <= 8; column++) {
			new Piece({
				color: this.getColor(),
				type: 'pawn',
				position: {
					column: getColumn(column),
					row: (row - 1) ? 7 : 2
				}
			});
		}
	};

	var Piece = function (oArgs) {
		var position,
			html = '<div class="piece ' + oArgs.color + "-" + oArgs.type + '"></div>';

		this.getColor = function () {
			return oArgs.color;
		};

		this.getType = function () {
			return oArgs.type;
		};

		this.setPosition = function (pos) {
			position = pos.column  + pos.row;

			board.squares[position].setPiece(this);
		};

		this.getPosition = function () {
			return position;
		};

		this.getHTML = function () {
			return html;
		};

		this.setPosition(oArgs.position);
	};

	var setup = function () {
		drawBoard();
		var black = new Player('black');
		var white = new Player('white');
		var from = 0;

		$('li:not(.row)').live('click', function (e) {
			// must verify move is legal
			var loc = e.currentTarget.id,
				hasPiece = board.squares[loc].getPiece();

			if (from) {
				updateBoardView({from:from, to:loc});
				from = 0;
			} else if (hasPiece) {
				from = loc;
			}
			
		});
	};

	var drawBoard = function () {
		var x = 8,
			y,
			html = '<ul class="board">';

		for (; x; x--) {
			html += '<li class="row"><ul>';
			for (y = 1; y <= 8; y++) {
				color = ((y + x % 2) % 2) ? 'white' : 'black';
				html += '<li id="' + getColumn(y) + x + '" class="' + color + '"></li>'
			}
			html += '</ul></li>';
		}

		html += '</ul>';

		$('body').append(html);
	};

	var updateBoardView = function (oArgs) {
		if (oArgs.from != '') {
			$('#' + oArgs.from).empty()
		}

		$('#' + oArgs.to).html(oArgs.piece || board.squares[oArgs.from].getPiece().getHTML());
	};

	setup();
};
$().ready(function () {
	new DSR.Chess();
});
