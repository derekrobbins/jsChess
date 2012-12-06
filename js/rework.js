if (typeof(window.DSR) === 'undefined') {
  window.DSR = {};
}

DSR.count = 0;

DSR.Chess = function () {
  var nameToPosition = function (name) {
    return {
      x: name.charCodeAt(0) - 97,
      y: name.charCodeAt(1) - 49
    };
  };

  var game = {
    Model: {
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
          }
        }
      },

      movePiece: function (from, to) {
        var posFrom = nameToPosition(from),
            posTo   = nameToPosition(to);
        game.Model.board[posTo.x][posTo.y].setPiece(game.Model.board[posFrom.x][posFrom.y].removePiece());
      },

      // A set of functions to determine which squares are attacked by a given piece
      getAttacks: {
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
      },

      // A set of functions to validate moves, one for each type of piece
      validateMove: {
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
        this.turn = this.turn ^ 1;
        $('.piece.' + (this.turn ? 'w' : 'bl')).one('click', game.Controller.listenClick);
      },

      listenClick: function () {
        var from    = this.id;
        $('.piece').unbind('click');
        
        $('.row li:not(.piece.' + (game.Controller.turn ? 'w' : 'bl') + ')').one('click', function () {
          $('.row li').unbind('click');
          game.Model.movePiece(from, this.id);
          game.Controller.beginTurn();
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

// Model

// View

// Controller
