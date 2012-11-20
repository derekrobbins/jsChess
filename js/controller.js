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

	controller.getAttacks = {
		p: function () {
			var direction = this.color == 'w' ? 1 : -1,
				list = [];

			if (this.position.x + 1 < 8) {
				list.push({x: this.position.x + 1, y: this.position.y + direction});
			}
			if (this.position.x - 1 >= 0) {
				list.push({x: this.position.x - 1, y: this.position.y + direction});
			}

			return list;
		},

		r: function () {
			var list = [],
				index = 1,
				flags = {
							xr: 1,
							xl: 1,
							yu: 1,
							yd: 1
						},
				board = DSR.Chess.Model.board,
				x = this.position.x,
				y = this.position.y;

			for (; index < 8; index++) {
				if (flags.xr) {
					if (x + index < 8) {
						if (board[x + index][y].piece) {
							flags.xr = 0;
						}
						list.push({x: x + index, y: y});
					} else {
						flags.xr = 0;
					}
				}
				if (flags.xl) {
					if (x - index >= 0) {
						if (board[x - index][y].piece) {
							flags.xl = 0;
						}
						list.push({x: x - index, y: y});
					} else {
						flags.xl = 0;
					}
				}
				if (flags.yu) {
					if (y + index < 8) {
						if (board[x][y + index].piece) {
							flags.yu = 0;
						}
						list.push({x: x, y: y + index});
					} else {
						flags.yu = 0;
					}
				}
				if (flags.yd) {
					if (y - index >= 0) {
						if (board[x][y - index].piece) {
							flags.yd = 0;
						}
						list.push({x: x, y: y - index});
					} else {
						flags.yd = 0;
					}
				}
			}
			return list;
		},
	};

	controller.validateMove = {
		p: function (to) {
			if(this.type != 'n' && !emptyBetween(to, this.position)) return 0;

			var deltaX = to.x - this.position.x,
				deltaY = to.y - this.position.y,
				absX = Math.abs(deltaX),
				direction = this.color == 'w' ? 1 : -1,
				board = DSR.Chess.Model.board,
				capturePiece = board[to.x][to.y].piece;

			// Pawn movement
			if (deltaY == direction) {
				// Standard movement
				if (!deltaX && !capturePiece) {
					this.moved += 1;
					if (this.moved == 6) {
						// ***ADD: Fire event for promotion***
					}
					return 1;
				// Capture movement
				} else if (absX == 1 && capturePiece) {
					this.moved += 1;
					return 1;
				// Special case: en passant
				} else if (this.moved == 3 && board[to.x][from.y].piece.enpassant && !board[to.x][to.y].piece) {
					board[to.x][from.y].clearPiece();
					return 1;
				}
			// Special case first move pawn can move two spaces
			} else if (deltaY == direction * 2 && !deltaX && !this.moved) {
				this.moved = 2;
				this.enpassant = 1;
				return 1;
			}
		},

		r: function (to) {
			if(this.type != 'n' && !emptyBetween(to, this.position)) return 0;

			var deltaX = to.x - this.position.x,
				deltaY = to.y - this.position.y;

			if (!deltaX || !deltaY) {
				this.moved = 1;
				return 1;
			}
		},

		n: function (to) {
			var deltaX = to.x - this.position.x,
				deltaY = to.y - this.position.y;
			if (deltaY * deltaY + deltaX * deltaX == 5) return 1;
		},

		b: function (to) {
			if(this.type != 'n' && !emptyBetween(to, this.position)) return 0;

			var absX = Math.abs(to.x - this.position.x),
				absY = Math.abs(to.y - this.position.y);

			if (absX == absY) return 1;
		},

		q: function (to) {
			if(this.type != 'n' && !emptyBetween(to, this.position)) return 0;

			var deltaX = to.x - this.position.x,
				deltaY = to.y - this.position.y,
				absX = Math.abs(deltaX),
				absY = Math.abs(deltaY);

			if (absX == absY || (!deltaX || !deltaY)) return 1;
		},

		k: function (to) {
			var deltaX = to.x - this.position.x,
				deltaY = to.y - this.position.y,
				absX = Math.abs(deltaX),
				absY = Math.abs(deltaY),
				xDir = deltaX / absX;

			// ***ADD: test for attacked squares***
			if (absX <= 1 && absY <= 1) {
				this.moved = 1;
				return 1;
			// Castle
			} else if (!deltaY && !this.moved && absX == 2) {
				var rook = (xDir > 0) ? 7 : 0;
				if (!board[rook][from.y].piece.moved && emptyBetween(from,{x:rook, y:this.position.y})) {
					// Move rook to opposite side of king
					board[to.x - 1 * xDir][this.position.y].setPiece(board[rook][this.position.y].piece);
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
			var to = DSR.Chess.squareToPosition(name);
				dest = board[to.x][to.y];

			if (dest.piece.color != controller.piece.color && controller.piece.validateMove(to)) {
				board[to.x][to.y].setPiece(controller.piece);
				board[controller.from.x][controller.from.y].clearPiece();
			}
			
			controller.piece = 0;
		} else {
			controller.from = DSR.Chess.squareToPosition(name);
			controller.piece = board[controller.from.x][controller.from.y].piece;
		}
	};

	/*
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
	*/

	return controller;
})();

$().ready(function () {
	DSR.Chess.init();
});