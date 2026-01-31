// Dans la console
const domain = '.instagram.com' // Mettre le domaine
const a = ''; // Copier la chaîne du cookie dans la requête
const s = a.split('; ')
const cookies = s.map(cookie => ({name: cookie.split('=')[0], value: cookie.split('=')[1], domain}))
// Clic droit dans la console Firefox, Copier le message pour avoir l'objet stringifyed une seule fois