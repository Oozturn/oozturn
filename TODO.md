## TODO :

---

### Release 2.1

- [x] tournoi verrouiller / déverrouiller inversé
- [x] joueurs lambdas ne peuvent pas se déclarer forfait
- [x] matchs dispos -> timestamps mis à jour au cours du temps apparement. Trouver où et fixer
- [x] empêcher size d'avoir une valeur trop basse lors de l'enchainement de tournois (size défini le nb de joueurs sélectionnés pour la phase suivante. Réécrire la description lors du setup du tournoi)
- [x] Empêcher de cliquer sur "SUIVANT" si le tournoi est mal configuré (en plus d'une indication s'il y a une erreur de config)
- [x] ajouter un scroll auto pour le plan de la LAN (ou permettre de cliquer pour ouvrir l'image)
- [x] meilleur log des erreurs et des actions (option verbosity avec différents niveaux ?): pour voir quand il y a des erreurs, actuellement, c'est compliqué (surtout en environnement docker)
- [x] tournoi modifiable (légèrement) même en validation
- [x] quand on ff un player ayant déjà 0, erreur serveur qui refuse de mettre 0,NaN en score. résultat, le joueur FF passe au round suivant (score interne : 2) et le joueur adverse qui aurait dû passer fini en LB (score : 0)
- [x] activer le downmix
- [x] Dans un match, trier les opposants par ordre alphabétique
- [x] quand on arrive sur un tournoi via un click sur un lien, arriver directement sur le match concerné

### Next release (Certainement 3.0 avec la nouvelle lib)

- [ ] algo en sortie de poule : mauvais opposant sélectionné. Si on sélectionne 4 opposants sur 3 poules, revoir la sélection du meilleur second. Attention, bien trier par match pour éviter que les gens se re-rencontrent
- [ ] changer l'indicateur quand un joueur n'a plus de match de prévu dans un tournoi (même picto mais fond background-primary-level)
      -> track les joueurs ayant terminé leurs matchs dans un tournoi, et remonter l'info au client > affichage grisé de ces joueurs dans la liste latérale (en mode RUNNING) et impossibilité de les ff (puisque fini de jouer)
- [ ] si l'enchainement foire, revenir à l'état précédent (par exemple size trop petit)
- [ ] Si un tournoi plante au redémarrage, log une erreur et ignorer le tournoi (attention à la perte de données, faire un backup de tournaments.json)

#### Nouvelle lib `Tournament.ts` :

Réécrire la lib tournament.js en typescript : classes abstraites Match, Bracket, Tournament. Classes spécifiques Duel, FFA, RoundRobin, FinaleBracket, QualificationBracket, SimplePhaseTournament, DualPhasesTournament

- Duel, FFA, Round Robin, autre ?
- Scores liés à des userId plutôt que des nombres
- manches, avec options de winner : addition scores ou best of X
- gestion des teams ?
- gestion des abandons
- Enchainement 2 brackets (pour alléger le middleware) :
  - Matchaking en sortie de poule
  - Sécurité à la création du tournoi
  - paramètres explicites
- tracking du nombre de matchs joués / restants (max possible) pour chaque joueur / team (permet d'afficher "7 matchs avant la victoire !" ou "2 matchs joués" et de track les joueurs encore en lice)
- stats plus générales directement bas niveau ?
