# Genere l'ecran de demarrage (splash screen) natif Android : fond sombre de l'app + le
# logo Sabi centre (logo-icon.png), a toutes les densites/orientations attendues par
# Capacitor. Sans ca, Android affiche un ecran vide ou generique pendant que l'app charge.
import os
from PIL import Image

BG = (19, 19, 19, 255)  # #131313 - fond sombre de l'app
RES_DIR = "android/app/src/main/res"
LOGO_SOURCES = ["logo-icon.png", "icon-source.png", "icon-512.png"]

# largeur x hauteur, par dossier
TAILLES = {
    "drawable-port-mdpi": (320, 480), "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280), "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
    "drawable-land-mdpi": (480, 320), "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720), "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
    "drawable": (480, 800),  # repli universel
}

def charger_logo():
    for nom in LOGO_SOURCES:
        if os.path.exists(nom):
            return Image.open(nom).convert("RGBA")
    return None

def generer_image(largeur, hauteur, logo):
    fond = Image.new("RGBA", (largeur, hauteur), BG)
    if logo is not None:
        cote_cible = int(min(largeur, hauteur) * 0.38)
        ratio = cote_cible / max(logo.size)
        logo_redim = logo.resize((int(logo.size[0] * ratio), int(logo.size[1] * ratio)), Image.LANCZOS)
        pos = ((largeur - logo_redim.size[0]) // 2, (hauteur - logo_redim.size[1]) // 2)
        fond.paste(logo_redim, pos, logo_redim)
    return fond.convert("RGB")

def main():
    if not os.path.isdir(RES_DIR):
        print("Dossier Android introuvable — etape ignoree.")
        return
    logo = charger_logo()
    for dossier, (w, h) in TAILLES.items():
        chemin_dossier = os.path.join(RES_DIR, dossier)
        os.makedirs(chemin_dossier, exist_ok=True)
        img = generer_image(w, h, logo)
        img.save(os.path.join(chemin_dossier, "splash.png"))
    print("Splash screen installe dans", len(TAILLES), "dossiers.")

if __name__ == "__main__":
    main()
