if (typeof(window.DSR) === 'undefined') {
  window.DSR = {};
}

DSR.Chess = function () {
  // Utility functions

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
            this.attackers  = [];
            this.piece      = 0;
        };

        SquareModel.prototype = {
          setPiece: function (piece) {
            this.piece = piece;

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
            x       = 0,
            y       = 9,
            piece   = {};

        for (; x < 8; x++) {
          for (y = 9; y > 5; y--) {
            piece = {
              color:  (y < 8),
              type:   (y % 3) ? pieces[x] : 'p'
            };
            this.board[x][y % 8].setPiece(piece);
            if (piece.type == 'k' || piece.type == 'r') {
              this.board[x][y % 8].castle = 1;
            }
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

        for (; x; x--) {
          html += '<li class="row"><ul>';
          for (y = 0; y < 8; y++) {
            color = ((y + x % 2) % 2) ? 'white' : 'black';
            html += '<li id="' + String.fromCharCode(y + 97) + x + '" class="' + color + '"></li>'
          }
          html += '</ul></li>';
        }

        html += '</ul>';

        $('body').append(html);
      },

      setPiece: function (piece, square) {
        $('#' + square).addClass('piece')
          .addClass(piece.color ? 'bl' : 'w')
          .addClass(piece.type);
      },

      removePiece: function (from) {
        var el      = $('#' + from),
            classes = el.attr('class').split(/\s+/),
            index   = 0;

          classes.shift();

          for (; index < classes.length; index++) {
            el.removeClass(classes[index]);
          }

        return {type: classes.pop(), color: classes.pop()};
      },

      movePiece: function (from, to) {
        this.setPiece(this.removePiece(from), to);
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
        
        $('.row li').one('click', function () {
          var color = game.Controller.turn ? 'w' : 'bl';

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
  $(document).bind('DOMSubtreeModified',function(evt){
    game.Model.init();
  });

  game.View.init();
  game.Controller.beginTurn();

  return game;
};

$().ready(function () {
  DSR.chess = DSR.Chess();
});
