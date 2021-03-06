/*
| -------------------------------------------------------------------
|  MTGNode Playground Hand Module
| -------------------------------------------------------------------
|
|
| Author : Yomguithereal
| Version : 1.0
*/

;(function($, w, undefined){
  'use strict';

  // Deck Module
  //=============
  function HandModule(_side) {
    domino.module.call(this);
    var _this = this;

    var _area = Helpers.getArea(_side),
        _cardSelector = Helpers.getCardSelectorFunc(_side),
        _template = new CardTemplate(_side);

    // Selectors
    var $game_area = $('#game_block'),
        $emplacement = $('#'+_area+'_hand'),
        $deck = $('#'+_area+'_deck'),
        $menu = $('#hand_context_menu');

    // Properties
    //------------

    // Status
    this.revealed = false;

    // Position info
    this.baseOffset = 77;
    this.offset = this.baseOffset;
    this.cards = '.card-min.in-hand.'+_side;
    this.width = $emplacement.width();
    this.left = $emplacement.position().left;
    this.top = (_area === 'top') ? 0 : $game_area.height() - $deck.height();

    // Emettor
    //---------
    if (_side === 'my') {

      // Droppable
      $emplacement.droppable({
        tolerance: 'intersect',
        drop: function(e, ui) {
          var $card = $(ui.draggable);

          // False alarm
          if ($card.hasClass('in-hand')) {
            _this.reorganize();
            _this.dispatchEvent('sendRealtimeMessage', {
              head: 'opReorganizeHand'
            });
          }

          // Standard Events
          Helpers.dropEvents({
            card: $card,
            domino: _this,
            interactions: [
              {
                class: 'in-game',
                event: 'myBackCard'
              },
              {
                class: 'in-graveyard',
                event: 'myLootCard'
              },
              {
                class: 'in-exile',
                event: 'myWishCard'
              }
            ]
          });
        }
      });

      // Contextual Menu
      $menu.contextualize({
        selector: this.cards + ', #'+_area+'_hand',
        position: 'top',
        actions: {
          revealHand: function() {
            _this.dispatchEvent('sendRealtimeMessage', {
              head: 'opRevealHand'
            });
          }
        }
      });
    }

    // Receptor
    //----------

    // Drawing card
    this.triggers.events[_side+'CardDrawn'] = function(d, e) {
      var card = e.data;

      // Adding card in dom
      $game_area.append(card.html);
      var $card = _cardSelector(card.id);

      // Position
      $card.css({
        left: $deck.position().left,
        top: _this.top
      });

      // Animating cards
      _this.reorganize();

      // Flipping card if mine and make draggable
      if (_side === 'my') {
        $card.removeClass('flipped');
        Helpers.registerDraggable($card, function(e, ui) {
          var $card = $(ui.helper);

          // Updating z index
          Helpers.updateZ($card);

          // Retrieving position and sending to opponent
          var pos = {
            left: ui.position.left,
            top: ui.position.top,
            zindex: $card.css('z-index'),
            id: $card.attr('number')
          };

          _this.dispatchEvent('sendRealtimeMessage', {
            head: 'opCardDragged',
            body: pos
          });
        });
      }
      else {

        // If hand is revealed
        if (_this.revealed)
          $card.removeClass('flipped');
      }
    }

    // Opponent reorganizes his hand
    this.triggers.events[_side+'ReorganizeHand'] = function(d, e) {
      _this.reorganize();
    }

    // Backing a card or Looting a card
    function translatingCard(d, e) {
      var $card = _cardSelector(e.data.id);

      $card.removeClass('in-game in-graveyard in-exile tapped');
      $card.addClass('in-hand');

      if (_side === 'op') {
        $card.addClass('flipped');
      }

      _this.reorganize();
    }

    this.triggers.events[_side+'BackCard'] = translatingCard;
    this.triggers.events[_side+'LootCard'] = translatingCard;
    this.triggers.events[_side+'WishCard'] = translatingCard;

    // Revealing Hand
    this.triggers.events[_side+'RevealHand'] = function(d, e) {

      // State
      _this.revealed = !_this.revealed;

      // Contextual
      var $action = $menu.find('[data-action="revealHand"]');
      if (_this.revealed)
        $action.text('Conceal hand');
      else
        $action.text('Reveal hand');

      // Actually Revealing cards
      $(_this.cards).toggleClass('flipped');
    }

    // Helpers
    //---------
    this.reorganize = function() {
      var $cards = $(this.cards);
      $cards.show();

      // Checking place in hand
      if($cards.length * this.offset > this.width-this.baseOffset){
        this.offset -= 10;
      }

      $($cards.get().reverse()).each(function(i){

        // Getting to position
        var to_position = _this.left + (_this.offset*i);

        // Updating z-index
        Helpers.updateZ($(this));

        // Animating the card
        $(this).animate({
          left: to_position,
          top: _this.top
        }, 'fast');
      });
    }
  }


  // Deck Hacks
  //============

  var _hacks = [
    {
      triggers: [
        'myReorganizeHand',
        'opReorganizeHand',
        'myRevealHand',
        'opRevealHand'
      ]
    }
  ];

  _hacks = _hacks
    .concat(Helpers.fromToHacks(
      'Battlefield',
      'Hand',
      'BackCard'
    ))
    .concat(Helpers.fromToHacks(
      'Graveyard',
      'Hand',
      'LootCard'
    ))
    .concat(Helpers.fromToHacks(
      'Exile',
      'Hand',
      'WishCard'
    ));

  // Exporting
  //===========
  window.HandModule = HandModule;
  window.handHacks = _hacks;
})(jQuery, window);
