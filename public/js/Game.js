(function (exports) {
    let Game = function () {
        this.updateCount = 0;
        this.UPDATE_INTERVAL = Math.round(1000/60);
        this.MAX_LATENCY = 1000;
        this.width = 600;
        this.height = 600;
        this.isStart = false;
        this.joueurs = [];
        this.timer = null;
        this.id = '';
        this.colors = ["#2ecc71", "#3498db", "#9b59b6", "#e74c3c", "#f1c40f", "#ecf0f1", "#95a5a6"];
        this.nextColor = 0;
        this.callbacks = {};
        this.timeStamp = (new Date()).valueOf();
    };

    /**
     * Create a new player
     * @param id id of the new player
     * @returns {Joueur} return the player created
     */
    Game.prototype.createPlayer = function (id) {
        const x = Math.random() * 380;
        const y = Math.random() * 280;

        const isHost = this.joueurs.length === 0;
        const color = this.colors[this.nextColor];

        let angle = Math.random() * (Math.PI * 2);

        this.nextColor += 1;

        let joueur = new Joueur(x, y, angle, color, id, isHost, "Joueur " + this.joueurs.length);

        this.joueurs.push(joueur);

        return joueur;
    };

    /**
     * Add a player to the game
     * @param j j added to the game
     */
    Game.prototype.join = function (j) {
        let joueur = new Joueur(0, 0, 0, 0, 'color', 0, false, '');
        joueur.init(j);
        joueur.isPlayer = this.id == joueur.id;


        this.joueurs.push(joueur);
    };

    /**
     * Delete a player of the game
     * @param id Id of the player
     * @returns {*} return the pseudo of player that leave the game
     */
    Game.prototype.leave = function (id) {
        console.log('Joueur ' + id + ' quitte le jeu');
        let j = this.getPlayer(id);

        this.joueurs = this.joueurs.filter(item => item.id !== id);

        if (this.joueurs.length > 0) {
            this.joueurs[0].isHost = true;
        }

        return j.pseudo;
    };

    /**
     * Rename a player
     * @param id id of the player to be renamed
     * @param pseudo New pseudo of the player
     * @returns {string}
     */
    Game.prototype.rename = function (id, pseudo) {
        let j = this.getPlayer(id);

        if (!j) {
            console.log('Impossible de renommer');
            return;
        }

        let t = j.pseudo + '(' + j.id + ') rennomé en ' + pseudo;

        console.log(t);
        j.pseudo = pseudo;

        return t;
    };

    /**
     * A player start or end turning left
     * @param id Id of the player
     * @param val true if the player start turning left, false if the player end turning left
     */
    Game.prototype.left = function (id, val) {
        let j = this.getPlayer(id);

        if (!j) { return; }

        j.leftPress = val
    };

    /**
     * A player start or end turning left
     * @param id Id of the player
     * @param val true if the player start turning right, false if the player end turning right
     */
    Game.prototype.right = function (id, val) {
        let j = this.getPlayer(id);

        if (!j) { return; }

        j.rightPress = val
    };

    /**
     * Kill a player
     * @param id id of the player
     */
    Game.prototype.die = function (id) {
      let j = this.getPlayer(id);

      if (j) {
          console.log('Le joueur ' + j.pseudo + ' est mort');
          j.isDead = true;
      }
    };

    /**
     * Return a player with a specific id
     * @param id Id of the player
     * @returns {*} null is no player has this id, the player if a player if found
     */
    Game.prototype.getPlayer = function (id) {
        for(let i = 0; i < this.joueurs.length; i++) {
            if (this.joueurs[i].id == id) return this.joueurs[i];
        }
    };

    /**
     * Update the game every interval
     * @param interval interval between each update
     */
    Game.prototype.updateEvery = function(interval){
        let lastUpdate = (new Date()).valueOf();
        let ctx = this;
        this.timer = setInterval(function() {
            let date = (new Date()).valueOf();
            if (date - lastUpdate >= interval) {
                lastUpdate += interval;
                let delta = date - this.timeStamp;
                this.timeStamp += delta;
                ctx.update(date);


            }
        }, 1);
    };

    /**
     * Update the position of all players
     */
    Game.prototype.update = function () {

        this.updateCount ++;
        this.joueurs.forEach((j) => {
            if (j.isDead) { return; }

            j.update();
            if (this.collision(j)) {
                this.die(j.id);
                this.callback_('die', { id: j.id});

                if (this.playerAlive() === 1) {
                    let winnerId = this.winner();
                    this.callback_('victory', { winner:  winnerId});
                }
            }
        });
    };

    /**
     * Detect a collision with a specific player
     * @param j Player
     * @returns {boolean} true is a collision is detected, false if no collision are detected
     */
    Game.prototype.collision = function (j) {
        if  (j.x < 0 || j.y < 0 || j.x + j.width > this.width || j.y + j.height > this.height) {
            return true;
        }

        for (let i = 0; i < this.joueurs.length; i++) {
            let j2 = this.joueurs[i];

            let delta = (j2.pseudo == j.pseudo) ? '60' : 0;

            for (let k = 0; k < j2.trace.length - delta; k++) {
                let t = j2.trace[k];

                let d = (j.x - t.x) * (j.x - t.x) + (j.y - t.y) * (j.y - t.y);

                if (d < (t.width / 2) * (t.width / 2)) {
                    console.log('Collision de ' + j.pseudo + ' avec ' + j2.pseudo);
                    return true;
                }
            }
        }

        return false;


    };

    /**
     * Return the number of player alive
     * @returns {number} Number of player alive
     */
    Game.prototype.playerAlive = function () {
        let count = 0;

        this.joueurs.forEach((j) => {
            if (!j.isDead) {
                count++;
            }
        });

        return count;
    };

    /**
     * Update the score of a specific player
     * @param id id of the player
     */
    Game.prototype.win = function (id) {
        this.joueurs.forEach(function (j) {
            j.lastwinner = false;
        });

        let j = this.getPlayer(id);

        if (j) {
            j.lastwinner = true;
            j.score += 1;
            console.log(j.pseudo + ' a gagné la partie');
        }
    };

    /**
     * Create a new game
     */
    Game.prototype.newGame = function () {
        this.isStart = false;

        clearInterval(this.timer);

        this.joueurs.forEach((j) => {
            let x = Math.random() * 380;
            let y = Math.random() * 280;

            j.x = x;
            j.y = y;
            j.vY = 1;
            j.isDead = false;
            j.vX = 1;
            j.trace = [];
            j.trace.push({ x: x, y: y, width: j.width });
        });
    };

    /**
     * Search the player that won the game
     */
    Game.prototype.winner = function () {
        for (let i = 0; i < this.joueurs.length; i++) {
            if (!this.joueurs[i].isDead) {
                return this.joueurs[i].id;
            }
        }
    };

    /**
     * Save the game
     * @returns {{isStart: *, joueurs: Array}} state of the game
     */
    Game.prototype.save = function () {
      let serialized = {
         isStart: this.isStart,
          timeStamp: this.timeStamp,
          joueurs: []
      };

      this.joueurs.forEach((j) => {
          serialized.joueurs.push(j.toJSON());
      });

      return serialized;
    };

    /**
     * Load the game
     * @param data state of the game
     */
    Game.prototype.load = function (data) {
        console.log(data);

        clearInterval(this.timer);

        this.isStart = data.isStart;
        this.timeStamp = data.timeStamp;
        this.joueurs = [];
        data.joueurs.forEach((j) => {
              this.join(j)
        });

        if (this.isStart) {
            this.updateEvery(this.UPDATE_INTERVAL);
        }

        console.log(this.joueurs);

    };

    Game.prototype.callback_ = function (event, data) {
        let callback = this.callbacks[event];

        if (callback) {
            callback(data);
        } else {
            console.log('Aucun callback pour l\'evenement ' + event);
        }
    };

    Game.prototype.on = function (event, callback) {
        this.callbacks[event] = callback;
    };


   let Joueur = class Joueur {
       constructor(x, y, angle, couleur, id, isHost, pseudo) {
           this.x = x;
           this.y = y;
           this.vX = Math.cos(angle);
           this.vY = Math.sin(angle);
           this.couleur = couleur;
           this.id = id;
           this.isHost = isHost;
           this.pseudo = pseudo;
           this.isPlayer = false;
           this.height = 10;
           this.width = 10;
           this.leftPress = false;
           this.rightPress = false;
           this.accX = 0;
           this.accY = 0;
           this.angle = angle;
           this.trace = [];
           this.score = 0;
           this.isDead = false;
           this.trace.push({ x: this.x, y: this.y });
           this.lastwinner = false;
       }

       /**
        * Update the position of the player
        */
       update() {
           if (this.isDead) { return; }

           this.trace.push({ x: this.x, y: this.y + this.width / 2, width: this.width });


           if (this.leftPress) {

               this.vX = Math.cos(this.angle);
               this.vY = Math.sin(this.angle);

               this.angle += 0.025;
           } else if (this.rightPress) {
               this.vX = Math.cos(this.angle);
               this.vY = Math.sin(this.angle);

               this.angle -= 0.025;
           }

           this.x += this.vX;
           this.y += this.vY;
       }


       /**
        * Return the html text for the #listeJoueur table
        * @returns {string} html text
        */
       getHtmlText() {
           return `<tr>
                    <th>${this.isPlayer ? "&#9733;" : ""}</th>
                    <th>${this.isHost ? "Host" : ""}</th>
                    <th>${this.pseudo}</th>
                    <th><span class="color-joueur" style="background-color: ${this.couleur}">   </span></th>
                    <th>${this.score}</th>
                    <th>${this.isDead ? "&#x2620;" : ""}</th>
                    <th>${this.lastwinner ? "&#x263A;" : ""}</th>
                </tr>`;
       }

       /**
        * Update the player from a json object J
        * @param j JSON Object
        */
       init(j) {
           this.x = j.x;
           this.y = j.y;
           this.vX = j.vX;
           this.vY = j.vY;
           this.couleur = j.couleur;
           this.id = j.id;
           this.isHost = j.isHost;
           this.pseudo = j.pseudo;
           this.width = j.width;
           this.height = j.height;
           this.leftPress = j.leftPress;
           this.rightPress = j.rightPress;
           this.accX = j.accX;
           this.accY = j.accY;
           this.angle = j.angle;
           this.trace = j.trace;
           this.score = j.score;
           this.angle = j.angle;
           this.isDead = j.isDead;
           this.lastwinner = j.lastwinner;
       }

       /**
        *
        * @returns {{}}
        */
       toJSON() {
           var obj = {};
           for (var prop in this) {
               if (this.hasOwnProperty(prop)) {
                   obj[prop] = this[prop];
               }
           }
           return obj;
       }

   };

   let Point = class Point {
       constructor(x, y) {
           this.x = x;
           this.y = y;
       }

   };

   exports.Joueur = Joueur;
   exports.Game = Game;
   exports.Point = Point;

})(typeof global === "undefined" ? window : exports);