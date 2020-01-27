# Application "Jeux de mots" : côté serveur
---
## Résumé

Ce serveur est destiné à répondre aux requêtes de l'application en lui renvoyant les données demandées stockées en cache.   
Architecture MEAN Stack (MongoDB, Express.js, Angular, Node.js)

## Fonctionnement

1. recevoir la demande de recherche du terme
2. vérification de l'existence de terme dans le cache
3. interroger la page web du serveur `jeuxdemots.org` contenant les informations liées au terme
4. parser le DUMP pour extraire et formater les données
5. sauvegarder les données dans les fichiers **JSON** respectifs dans le cache
6. envoyer une réponse (positive ou négative avec l'erreur rencontrer) au client
7. retourner le contenu **JSON** de chacun des fichier de cache respectifs (définitions, relations entrantes et sortantes)