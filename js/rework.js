if (typeof(window.DSR) === 'undefined') {
  window.DSR = {};
}

DSR.Chess = function () {
  // Utility functions

  var fireViewComplete = function () {
    var e = document.createEvent("UIEvents");
    e.initEvent('view complete', true, true);
    document.body.dispatchEvent(e);
  };

  var subscribeViewComplete = function (func) {
    window.addEventListener('view complete', func, false);
  };

  var nameToPosition = function (name) {
    return {
      x: name.charCodeAt(0) - 97,
      y: name.charCodeAt(1) - 49
    };
  };

  var positionToName = function (position) {
    return String.fromCharCode(position.x + 97) + (position.y + 1);
  }

  var validateMove = function (from, to, piece) {
    from  = nameToPosition(from);
    to    = nameToPosition(to);

    if(piece.type != 'n' && !emptyBetween(to, from)) return 0;

    this.p = function (from, to) {
      var deltaX = to.x - from.x,
          deltaY = to.y - from.y,
          absX = Math.abs(deltaX),
          color = this.board[from.x][from.y].piece.color ? 1 : 0 ,
          direction = color ? -1 : 1,
          capturePiece = this.board[to.x][to.y].piece;

      // Pawn movement
      if (deltaY == direction) {
        // Standard movement
        if (!deltaX && !capturePiece) {
          return 1;
        // Capture movement
        } else if (absX == 1 && capturePiece) {
          return 1;
        // Special case: en passant
        } else if (absX == 1 && to.x == this.enpassant[color].x && to.y == this.enpassant[color].y) {
          this.board[to.x][to.y - direction].removePiece();
          return 1;
        }
      // Special case first move pawn can move two spaces
      } else if (deltaY == direction * 2 && !deltaX && to.y == Math.floor(4 - direction * .3)) {
        // Check to see if skiped square is being attacked by a pawn of the opposite color
        if ($.inArray({type: 'p', color: (color ^ 1)}, this.board[from.x][from.y + direction].attackers)) {
          this.enpassant[color ^ 1] = {x: from.x, y: from.y + direction};
        }
        this.enpassant[color ^ 1] = {x: from.x, y: (from.y + direction)};
        return 1;
      }
      return 0;
    };

    this.r = function (from, to) {
      var deltaX = to.x - from.x,
          deltaY = to.y - from.y;

      if (!deltaX || !deltaY) {
        delete this.board[from.x][from.y].castle;
        return 1;
      }
    };

    this.n = function (from, to) {
      var deltaX = to.x - from.x,
          deltaY = to.y - from.y;
      if (deltaY * deltaY + deltaX * deltaX == 5) return 1;
    };

    this.b = function (from, to) {
      var absX = Math.abs(to.x - from.x),
          absY = Math.abs(to.y - from.y);

      if (absX == absY) return 1;
    };

    this.q = function (from, to) {
      var deltaX = to.x - from.x,
          deltaY = to.y - from.y,
          absX = Math.abs(deltaX),
          absY = Math.abs(deltaY);

      if (absX == absY || (!deltaX || !deltaY)) return 1;
    };

    this.k = function (from, to) {
      var deltaX = to.x - from.x,
          deltaY = to.y - from.y,
          absX = Math.abs(deltaX),
          absY = Math.abs(deltaY),
          xDir = deltaX / absX;

      // ***ADD: test for attacked squares***
      if (absX <= 1 && absY <= 1) {
        delete this.board[from.x][from.y].castle;
        return 1;
      // Castle
      } else if (absX == 2 && !deltaY && this.board[from.x][from.y].castle) {
        var rook = {
          x: (xDir > 0) ? 7 : 0,
          y: from.y
        },
          rookSquare = positionToName(rook);
        if (this.board[rook.x][rook.y].castle && emptyBetween(from, rookSquare)) {
          // Move rook to opposite side of king;
          this.movePiece(rookSquare, positionToName({x: to.x - 1 * xDir, y: from.y}));
          return 1;
        }
      }
    };

    return this[piece.type].apply(game.Model, [from, to]);
  };

  var getAttacks = function (square) {
    var position  = nameToPosition(square.name),
        index     = 0,
        attacks   = [];

    this.p = function () {
      var direction = square.piece.color ? -1 : 1;

      if (position.x < 7) attacks.push({x: position.x + 1, y: position.y + direction});
      if (position.x > 0) attacks.push({x: position.x - 1, y: position.y + direction});
    };

    this.r = function () {
      var iterator    = 0,
          checkSquare;

      for (key in position) {
        checkSquare = {x: position.x, y: position.y};
        for (iterator = position[key] - 1; iterator >= 0; iterator--) {
          checkSquare[key] = iterator;
          attacks.push(checkSquare);
          if (game.Model.board[checkSquare.x][checkSquare.y].piece) break;
        }
        for (iterator = position[key] + 1; iterator < 8; iterator++) {
          checkSquare[key] = iterator;
          attacks.push(checkSquare);
          if (game.Model.board[checkSquare.x][checkSquare.y].piece) break;
        }
      }
    };

    this.b = function () {

    };

    this.n = function () {
      var dir       = [2, 1],
          iterator  = 1,
          negX      = -1,
          negY      = -1,
          x, y;

      for (; iterator >= 0; iterator--) {
        do {
          do {
            x = position.x + dir[iterator] * negX;
            y = position.y + dir[iterator ^ 1] * negY;

            if (x >= 0 && x < 8 && y >= 0 && y < 8) {
              attacks.push({x: x, y: y});
            }
            negY *= -1;
          } while (negY > 0)
          negX *= -1;
        } while (negX > 0)
      }
    };

    this.q = function () {

    };

    this.k = function () {

    };

    // Remove any previous attacks
    for (; index < square.attacks.length; index++) {
      delete game.Model.board[square.attacks[index].x][square.attacks[index].x].attackers[square.name];
    }

    this[square.piece.type].call();

    return setAttacks(attacks, square.name, square.piece.type);
  };

  var setAttacks = function (attacks, name, type) {
    var board = game.Model.board;
        index = 0;
    for (; index < attacks.length; index++) {
      board[attacks[index].x][attacks[index].y].attackers[name] = type;
    }

    return attacks
  };

  var emptyBetween = function (from, to) {
    var deltaX = to.x - from.x,
        deltaY = to.y - from.y,
        absX = Math.abs(deltaX),
        absY = Math.abs(deltaY),
        xDir = deltaX / absX,
        yDir = deltaY / absY,
        board = game.Model.board,
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

  var game = {
    Model: {
      enpassant:        [0, 0],
      enpassantPassed:  [0, 0],
      init: function () {
        this.board = this.createBoard();

        this.initPieces();
      },

      createBoard: function () {
        var SquareModel = function (name) {
            this.name       = name;
            this.attackers  = {};
            this.attacks    = [];
            this.piece      = 0;
        };

        SquareModel.prototype = {
          setPiece: function (piece, init) {
            var special = '',
                index   = 0;
            if (this.piece) {
              game.View.removePiece(this.name);
              special = 'capture';
            }

            // Set piece
            this.piece = piece;

            if (!init) {
              // Get new attacks
              this.attacks = getAttacks(this);
              game.View.recordMove(piece, this.name, special);
            }
            game.View.setPiece(piece, this.name);
          },
          removePiece: function () {
            var color = this.piece.color,
                type  = this.piece.type;
            this.piece = 0;
            game.View.removePiece(this.name);

            return {color: color, type: type};
          }
        };

        var x, y, board = [];

        for (x = 0; x < 8; x++) {
          board.push([]);
          for (y = 0; y < 8; y++) {
            board[x].push(new SquareModel(String.fromCharCode(x + 97) + (y + 1)));
          }
        }

        return board;
      },

      initPieces: function () {
        var pieces  = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            x, y, square,
            piece   = {};

        for (x = 0; x < 8; x++) {
          for (y = 9; y > 5; y--) {
            piece = {
              color:  (y < 8),
              type:   (y % 3) ? pieces[x] : 'p'
            };
            this.board[x][y % 8].setPiece(piece, 1);
            if (piece.type == 'k' || piece.type == 'r') {
              this.board[x][y % 8].castle = 1;
            }
          }
        }

        // After all pieces are placed, check attacks
        for (x = 0; x < 8; x++) {
          for (y = 9; y > 5; y--) {
            square = this.board[x][y % 8];
            square.attacks = getAttacks(square);
          }
        }
      },

      movePiece: function (from, to) {
        var posFrom = nameToPosition(from),
            posTo   = nameToPosition(to),
            piece = game.Model.board[posFrom.x][posFrom.y].piece;

        if(validateMove(from, to, piece)) { // Validate move
          game.Model.board[posTo.x][posTo.y].setPiece(game.Model.board[posFrom.x][posFrom.y].removePiece());
          return 1;
        } else {
          return 0;
        }
      },
    },
    View: {
      init: function () {
        var x = 8,
          y,
          html = '<ul class="board">';

        while(x--) {
          html += '<li class="row"><ul>';
          for (y = 0; y < 8; y++) {
            color = ((y + x % 2) % 2) ? 'black' : 'white';
            html += '<li id="' + positionToName({x: y, y: x}) + '"></li>';
          }
          html += '</ul></li>';
        }

        html += '</ul>';

        $('body').append(html);

        fireViewComplete();
      },

      setPiece: function (piece, square) {
        $('#' + square).addClass('piece')
          .addClass(piece.color ? 'bl' : 'w')
          .addClass(piece.type);
      },

      removePiece: function (from) {
        $('#' + from).removeClass();
      },

      recordMove: function (piece, to, special) {
        var move = (piece.type == 'p' ? '' : piece.type.toUpperCase());
        if (special == 'capture') {
          move += 'x';
        }
        move += to;
        if (special == 'check') {
          move += '!';
        }
        $(piece.color ? '#blackmoves' : '#whitemoves').append('<li>' + move + '</li>');
      },

      setActive: function (el) {
        $('#' + el).addClass('active');
      },

      unsetActive: function (el) {
        $('#' + el).removeClass('active');
      }

    },
    Controller: {
      turn: 0,
      beginTurn: function () {
        this.turn ^= 1;

        console.log(this.turn ? 'w' : 'bl');

        if (game.Model.enpassantPassed[this.turn]) {
          game.Model.enpassant[this.turn] = 0;
          game.Model.enpassantPassed[this.turn] = 0;
        } else {
          game.Model.enpassantPassed[this.turn] = 1;
        }
        
        this.resetTurn();
      },

      resetTurn: function () {
        $('.piece.' + (this.turn ? 'w' : 'bl')).one('click', game.Controller.listenClick);
      },

      listenClick: function () {
        var from    = this.id;
        $('.piece').unbind('click');

        game.View.setActive(from);
        
        $('.row li').one('click', function () {
          var color = game.Controller.turn ? 'w' : 'bl';

          game.View.unsetActive(from);

          $('.row li').unbind('click');
          // If move is invalid reset turn
          if (!$(this).hasClass(color) && game.Model.movePiece(from, this.id)) {
            game.Controller.beginTurn();
          } else {
            game.Controller.resetTurn();
          } 
          
        });
      }
    }
  };

  // Wait until view has been drawn before initiating the model
  subscribeViewComplete(game.Model.init.bind(game.Model));

  game.View.init();
  game.Controller.beginTurn();

  return game;
};

$().ready(function () {
  DSR.chess = DSR.Chess();
});
