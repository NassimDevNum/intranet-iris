crée un user enseignant : 


Invoke-RestMethod -Uri "http://localhost:3000/api/users/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"prof@iris.fr","password":"123456","role":"enseignant","nom":"Dupont","prenom":"Jean"}'


crée un user etudiant : 

Invoke-RestMethod -Uri "http://localhost:3000/api/users/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"etudiant@iris.fr","password":"123456","role":"etudiant","nom":"Martin","prenom":"Sophie"}'


crée un examen : 

Invoke-RestMethod -Uri "http://localhost:3000/api/exams" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{
  "userId": "TON_ID_ENSEIGNANT_ICI",
  "titre": "Examen de Mathématiques",
  "description": "Examen final du semestre",
  "duree": 120,
  "questions": [
    {
      "numero": 1,
      "texte": "Quelle est la valeur de Pi ?",
      "type": "qcm",
      "points": 2,
      "options": ["3.14", "2.71", "1.41", "1.73"],
      "reponseCorrecte": "3.14"
    },
    {
      "numero": 2,
      "texte": "Résolvez: 2x + 5 = 15",
      "type": "text",
      "points": 3,
      "reponseCorrecte": "x = 5"
    }
  ],
  "etudiantsAssignes": ["TON_ID_ETUDIANT_ICI"]
}'