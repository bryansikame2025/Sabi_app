# Branche le plugin Google Services dans le projet Android genere par Capacitor, uniquement si
# un fichier "google-services.json" (telecharge depuis la Console Firebase) est present a la
# racine du depot. Sans lui, les notifications push natives ne peuvent pas s'enregistrer aupres
# de Firebase Cloud Messaging. Voir le fichier NOTIFICATIONS.md pour comment l'obtenir.
import os
import shutil

if not os.path.exists("google-services.json"):
    print("google-services.json absent a la racine — notifications push natives non configurees, etape ignoree.")
    raise SystemExit(0)

shutil.copy("google-services.json", "android/app/google-services.json")

# android/build.gradle : ajoute le plugin Google Services aux dependances du buildscript
chemin_build = "android/build.gradle"
with open(chemin_build) as f:
    contenu = f.read()
if "com.google.gms:google-services" not in contenu:
    contenu = contenu.replace(
        "dependencies {",
        "dependencies {\n        classpath 'com.google.gms:google-services:4.4.2'",
        1
    )
    with open(chemin_build, "w") as f:
        f.write(contenu)

# android/app/build.gradle : applique le plugin en fin de fichier
chemin_app = "android/app/build.gradle"
with open(chemin_app) as f:
    contenu_app = f.read()
if "com.google.gms.google-services" not in contenu_app:
    with open(chemin_app, "a") as f:
        f.write("\napply plugin: 'com.google.gms.google-services'\n")

print("google-services.json installe, plugin Google Services active.")
