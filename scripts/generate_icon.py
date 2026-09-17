# Genere une icone de lancement Android simple (fond sombre + "S" dore), aux tailles requises,
# et l'installe directement dans les dossiers mipmap-*dpi du projet Android genere par Capacitor.
# A remplacer facilement plus tard : il suffit de deposer un vrai logo carre (au moins 512x512)
# nomme "icon-source.png" a la racine du depot, ce script l'utilisera a la place du "S" genere
# s'il le trouve.
import os
from PIL import Image, ImageDraw, ImageFont

BG = (19, 19, 19)       # #131313 - fond sombre de l'app
GOLD = (242, 202, 80)   # #f2ca50 - accent dore de l'app

TAILLES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

RES_DIR = "android/app/src/main/res"
SOURCE = "icon-source.png"

def base_1024():
    if os.path.exists(SOURCE):
        img = Image.open(SOURCE).convert("RGBA").resize((1024, 1024))
        return img
    img = Image.new("RGBA", (1024, 1024), BG)
    d = ImageDraw.Draw(img)
    taille_police = 620
    police = None
    for chemin in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]:
        if os.path.exists(chemin):
            police = ImageFont.truetype(chemin, taille_police)
            break
    if police is None:
        police = ImageFont.load_default()
    texte = "S"
    bbox = d.textbbox((0, 0), texte, font=police)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((1024 - w) / 2 - bbox[0], (1024 - h) / 2 - bbox[1]), texte, font=police, fill=GOLD)
    return img

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
    grande = base_1024()
    grande_ronde = round_version(grande)
    for dossier, taille in TAILLES.items():
        chemin_dossier = os.path.join(RES_DIR, dossier)
        os.makedirs(chemin_dossier, exist_ok=True)
        grande.resize((taille, taille), Image.LANCZOS).save(os.path.join(chemin_dossier, "ic_launcher.png"))
        grande_ronde.resize((taille, taille), Image.LANCZOS).save(os.path.join(chemin_dossier, "ic_launcher_round.png"))
    # Supprime la version "adaptive icon" (XML + calques vectoriels) fournie par defaut par
    # Capacitor : sur Android 8+, ces fichiers XML ont priorite sur les PNG ci-dessus et
    # afficheraient sinon le logo Capacitor par defaut au lieu du notre.
    anydpi = os.path.join(RES_DIR, "mipmap-anydpi-v26")
    if os.path.isdir(anydpi):
        for f in os.listdir(anydpi):
            os.remove(os.path.join(anydpi, f))
        os.rmdir(anydpi)
    print("Icone installee dans les", len(TAILLES), "dossiers mipmap.")

if __name__ == "__main__":
    main()
