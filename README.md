# Invitation date — version HTML statique

Projet très simple à publier sur GitHub Pages : une invitation interactive où le bouton **Non** rapetisse et bouge, puis un formulaire permet de choisir l'activité, la date et l'horaire.

## Contenu

```txt
simon-date-html/
├─ index.html
├─ style.css
├─ script.js
├─ assets/
│  └─ dance.gif
└─ README.md
```

## Important : envoi d'email

Un site HTML statique hébergé sur GitHub Pages ne peut pas envoyer un email tout seul côté serveur.

Ce projet propose donc deux options :

1. **Option recommandée : Formspree**
   - Crée un compte sur https://formspree.io avec l'adresse `skysime@gmail.com`.
   - Crée un nouveau formulaire.
   - Copie l'endpoint du type :

     ```txt
     https://formspree.io/f/abcdwxyz
     ```

   - Ouvre `script.js`.
   - Remplace :

     ```js
     formspreeEndpoint: "https://formspree.io/f/TON_ID_FORMULAIRE",
     ```

     par ton vrai endpoint.

2. **Fallback sans configuration : mailto**
   - Si tu ne configures pas Formspree, le site ouvre un email prérempli à envoyer manuellement.
   - C'est moins fluide, car cela dépend de l'application mail de la personne.

## Déploiement GitHub Pages

1. Crée un repository GitHub, par exemple `date-simon`.
2. Upload les fichiers `index.html`, `style.css`, `script.js`, `assets/dance.gif` et `README.md`.
3. Va dans :

   ```txt
   Settings > Pages
   ```

4. Dans **Build and deployment**, choisis :

   ```txt
   Deploy from a branch
   ```

5. Branche : `main`, dossier : `/root`.
6. GitHub te donnera une URL du type :

   ```txt
   https://tonpseudo.github.io/date-simon/
   ```

## Personnalisation rapide

Dans `script.js`, tu peux modifier :

```js
recipientEmail: "skysime@gmail.com",
senderName: "Simon",
```

Dans `index.html`, tu peux modifier la phrase principale :

```html
Souhaites-tu aller en date avec moi&nbsp;?
```

Dans `index.html`, tu peux modifier les activités :

```html
<button class="activity-card" type="button" data-activity="Cinéma">
```

## Tester localement

Double-clique simplement sur `index.html`.

Pour un test plus propre avec un mini-serveur local :

```bash
python3 -m http.server 8000
```

Puis ouvre :

```txt
http://localhost:8000
```
