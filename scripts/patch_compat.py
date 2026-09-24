# Abaisse la version minimale d'Android exigee par l'app, pour couvrir le plus grand nombre de
# telephones possible (y compris les vieux/bas de gamme tres repandus). Capacitor 6 fixe par
# defaut minSdkVersion a 23 (Android 6.0, 2015) — on le redescend a 22 (Android 5.1, 2015 aussi),
# le plancher technique reel de Capacitor 6, pour ne perdre aucun appareil compatible.
import re

chemin = "android/variables.gradle"
try:
    with open(chemin) as f:
        contenu = f.read()
except FileNotFoundError:
    print("variables.gradle introuvable — etape ignoree.")
    raise SystemExit(0)

contenu = re.sub(r"minSdkVersion\s*=\s*\d+", "minSdkVersion = 22", contenu)

with open(chemin, "w") as f:
    f.write(contenu)

print("minSdkVersion abaisse a 22 (Android 5.1+) pour une compatibilite maximale.")
