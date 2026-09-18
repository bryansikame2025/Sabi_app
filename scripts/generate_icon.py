# Genere l'icone de lancement Android a partir des vrais logos Sabi :
# - icon-512.png (fond sombre deja integre) -> icone "historique" (utilisee sur Android < 8,
#   et comme repli si le systeme ne gere pas les icones adaptatives)
# - icon-512-maskable.png (marge de securite deja integree) -> calque "foreground" de l'icone
#   adaptative moderne (Android 8+), qui s'adapte automatiquement en cercle, carre arrondi,
#   etc. selon le launcher du telephone
# A remplacer facilement : deposer de nouveaux fichiers du meme nom a la racine du depot.
import os
from PIL import Image, ImageDraw, ImageFont

BG = (19, 19, 19)       # #131313 - fond sombre de l'app
GOLD = (242, 202, 80)   # #f2ca50 - accent dore de l'app
RES_DIR = "android/app/src/main/res"

SOURCES_LEGACY = ["icon-source.png", "icon-512.png"]
SOURCES_ADAPTATIF = ["icon-512-maskable.png", "icon-512.png", "icon-source.png"]

TAILLES_LEGACY = {
    "mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192,
}
# L'icone adaptative a un canevas plus grand (108dp logique contre 48dp pour l'icone
# classique) car le systeme masque une partie des bords selon la forme du launcher.
TAILLES_ADAPTATIF = {
    "mipmap-mdpi": 108, "mipmap-hdpi": 162, "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324, "mipmap-xxxhdpi": 432,
}

def generer_S():
    img = Image.new("RGBA", (1024, 1024), BG)
    d = ImageDraw.Draw(img)
    police = None
    for chemin in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]:
        if os.path.exists(chemin):
            police = ImageFont.truetype(chemin, 620)
            break
    if police is None:
        police = ImageFont.load_default()
    bbox = d.textbbox((0, 0), "S", font=police)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((1024 - w) / 2 - bbox[0], (1024 - h) / 2 - bbox[1]), "S", font=police, fill=GOLD)
    return img

def charger(sources, repli):
    for nom in sources:
        if os.path.exists(nom):
            return Image.open(nom).convert("RGBA").resize((1024, 1024))
    return repli

def round_version(img):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).ellipse([0, 0, img.size[0], img.size[1]], fill=255)
    rond = Image.new("RGBA", img.size, (0, 0, 0, 0))
    rond.paste(img, (0, 0), mask)
    return rond

def main():
    if not os.path.isdir(RES_DIR):
        print("Dossier Android introuvable (" + RES_DIR + ") — etape ignoree.")
        return

    repli = generer_S()
    legacy = charger(SOURCES_LEGACY, repli)
    legacy_ronde = round_version(legacy)
    adaptatif_fg = charger(SOURCES_ADAPTATIF, repli)

    for dossier, taille in TAILLES_LEGACY.items():
        chemin = os.path.join(RES_DIR, dossier)
        os.makedirs(chemin, exist_ok=True)
        legacy.resize((taille, taille), Image.LANCZOS).save(os.path.join(chemin, "ic_launcher.png"))
        legacy_ronde.resize((taille, taille), Image.LANCZOS).save(os.path.join(chemin, "ic_launcher_round.png"))

    for dossier, taille in TAILLES_ADAPTATIF.items():
        chemin = os.path.join(RES_DIR, dossier)
        os.makedirs(chemin, exist_ok=True)
        adaptatif_fg.resize((taille, taille), Image.LANCZOS).save(os.path.join(chemin, "ic_launcher_foreground.png"))

    # Couleur de fond du calque "background" de l'icone adaptative — le XML par defaut de
    # Capacitor (mipmap-anydpi-v26/ic_launcher.xml) reference deja cette couleur, on la
    # remplace juste par le fond sombre de l'app.
    couleurs_dir = os.path.join(RES_DIR, "values")
    os.makedirs(couleurs_dir, exist_ok=True)
    with open(os.path.join(couleurs_dir, "ic_launcher_background.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
                '    <color name="ic_launcher_background">#131313</color>\n</resources>\n')

    print("Icone (classique + adaptative) installee.")

if __name__ == "__main__":
    main()
