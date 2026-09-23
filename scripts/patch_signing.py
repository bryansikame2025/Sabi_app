# Configure la signature de la version "release" (celle qui va sur le Play Store), a partir
# d'un fichier de cle (.keystore) et de ses mots de passe fournis par variables d'environnement.
# Si ces variables ne sont pas presentes (build de test habituel), cette etape est ignoree
# silencieusement — rien ne change pour les builds de test.
import os

KEYSTORE_BASE64 = os.environ.get("ANDROID_KEYSTORE_BASE64", "")
STORE_PASSWORD = os.environ.get("ANDROID_KEYSTORE_PASSWORD", "")
KEY_ALIAS = os.environ.get("ANDROID_KEY_ALIAS", "")
KEY_PASSWORD = os.environ.get("ANDROID_KEY_PASSWORD", "")

if not (KEYSTORE_BASE64 and STORE_PASSWORD and KEY_ALIAS and KEY_PASSWORD):
    print("Cle de signature non fournie (secrets absents) — build de test non signe, comme d'habitude.")
    raise SystemExit(0)

import base64
os.makedirs("android/app", exist_ok=True)
with open("android/app/sabi-release.keystore", "wb") as f:
    f.write(base64.b64decode(KEYSTORE_BASE64))

chemin_build = "android/app/build.gradle"
with open(chemin_build) as f:
    contenu = f.read()

bloc_signature = f"""
android {{
    signingConfigs {{
        release {{
            storeFile file("sabi-release.keystore")
            storePassword "{STORE_PASSWORD}"
            keyAlias "{KEY_ALIAS}"
            keyPassword "{KEY_PASSWORD}"
        }}
    }}
    buildTypes {{
        release {{
            signingConfig signingConfigs.release
        }}
    }}
}}
"""
with open(chemin_build, "a") as f:
    f.write(bloc_signature)

print("Configuration de signature appliquee.")
