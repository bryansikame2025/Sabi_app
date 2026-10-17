# Icones alternatives pour l'app Android : l'utilisateur choisit l'icone de Sabi dans le menu
# (rubrique "Icone de l'appli"). Techniquement, Android ne permet pas de remplacer l'icone a la
# volee : on declare plusieurs "alias" de l'ecran de demarrage (un par icone), un seul est actif a
# la fois, et un petit plugin natif (IconSwitcher) active celui choisi.
#
# Ce script s'execute dans le workflow GitHub, APRES "cap add android" et le choix de MainActivity.
# Il est volontairement prudent : si quelque chose manque ou echoue, il l'affiche et laisse le
# build continuer normalement (l'app garde alors son icone habituelle, sans changement possible).
#   1) genere les icones colorees (a partir de icon-512.png / icon-512-maskable.png)
#   2) ecrit le plugin natif IconSwitcherPlugin.java et l'enregistre dans MainActivity
#   3) declare les alias dans AndroidManifest.xml
import math, os, re, sys

RES = "android/app/src/main/res"
MANIFEST = "android/app/src/main/AndroidManifest.xml"
JAVA_DIR = "android/app/src/main/java/com/sabi/app"
PKG = "com.sabi.app"

# id (sans accent), changement de teinte en degres (meme formule que le CSS hue-rotate de l'apercu
# dans le menu), saturation (0 = gris). L'icone d'origine (or) reste l'icone par defaut.
ICONES = [
    ("defaut",   0,   1.0),
    ("violet",   215, 1.0),
    ("emeraude", 95,  1.0),
    ("ocean",    165, 1.0),
    ("corail",   -45, 1.0),
    ("graphite", 0,   0.0),
]
CLASSES = {i: "Icon" + i.capitalize() for i, _, _ in ICONES}

DENSITES_LEGACY = {"mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96, "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192}
DENSITES_ADAPTATIF = {"mipmap-mdpi": 108, "mipmap-hdpi": 162, "mipmap-xhdpi": 216, "mipmap-xxhdpi": 324, "mipmap-xxxhdpi": 432}


def matrice(deg, sat):
    """Teinte (comme le CSS hue-rotate) puis saturation (comme le CSS saturate), en une matrice 3x3."""
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    h = [[0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928],
         [0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283],
         [0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072]]
    k = [[0.213 + 0.787 * sat, 0.715 - 0.715 * sat, 0.072 - 0.072 * sat],
         [0.213 - 0.213 * sat, 0.715 + 0.285 * sat, 0.072 - 0.072 * sat],
         [0.213 - 0.213 * sat, 0.715 - 0.715 * sat, 0.072 + 0.928 * sat]]
    return [[sum(k[i][m] * h[m][j] for m in range(3)) for j in range(3)] for i in range(3)]


def teinter(img, deg, sat):
    from PIL import Image
    m = matrice(deg, sat)
    img = img.convert("RGBA")
    r, g, b, a = img.split()
    rgb = Image.merge("RGB", (r, g, b)).convert("RGB", tuple(m[0]) + (0,) + tuple(m[1]) + (0,) + tuple(m[2]) + (0,))
    out = rgb.convert("RGBA")
    out.putalpha(a)
    return out


def rond(img):
    from PIL import Image, ImageDraw
    masque = Image.new("L", img.size, 0)
    ImageDraw.Draw(masque).ellipse([0, 0, img.size[0], img.size[1]], fill=255)
    res = Image.new("RGBA", img.size, (0, 0, 0, 0))
    res.paste(img, (0, 0), masque)
    return res


def premier(noms):
    for n in noms:
        if os.path.exists(n):
            return n
    return None


def generer_icones():
    from PIL import Image
    # Cherche les images source a la racine, dans www/, puis dans l'icone deja generee par le build.
    legacy_src = premier(["icon-source.png", "icon-512.png", "www/icon-512.png", "www/icons/icon-512.png",
                          "www/icon-source.png", RES + "/mipmap-xxxhdpi/ic_launcher.png", RES + "/mipmap-xxhdpi/ic_launcher.png"])
    adapt_src = premier(["icon-512-maskable.png", "www/icon-512-maskable.png", "www/icons/icon-512-maskable.png",
                         RES + "/mipmap-xxxhdpi/ic_launcher_foreground.png", RES + "/mipmap-xxhdpi/ic_launcher_foreground.png"]) or legacy_src
    if not legacy_src or not adapt_src:
        raise RuntimeError("aucune image d'icone source trouvee")
    print("Icone source : " + legacy_src + " / adaptative : " + adapt_src)
    legacy = Image.open(legacy_src).convert("RGBA").resize((1024, 1024))
    adapt = Image.open(adapt_src).convert("RGBA").resize((1024, 1024))
    adaptatif_dir = os.path.join(RES, "mipmap-anydpi-v26")
    os.makedirs(adaptatif_dir, exist_ok=True)
    for ident, deg, sat in ICONES:
        if ident == "defaut":
            continue  # l'icone par defaut reste celle deja installee par le build (ic_launcher)
        nom = "ic_launcher_" + ident
        leg, ada = teinter(legacy, deg, sat), teinter(adapt, deg, sat)
        leg_rond = rond(leg)
        for dossier, t in DENSITES_LEGACY.items():
            d = os.path.join(RES, dossier); os.makedirs(d, exist_ok=True)
            leg.resize((t, t), Image.LANCZOS).save(os.path.join(d, nom + ".png"))
            leg_rond.resize((t, t), Image.LANCZOS).save(os.path.join(d, nom + "_round.png"))
        for dossier, t in DENSITES_ADAPTATIF.items():
            d = os.path.join(RES, dossier); os.makedirs(d, exist_ok=True)
            ada.resize((t, t), Image.LANCZOS).save(os.path.join(d, nom + "_foreground.png"))
        xml = ('<?xml version="1.0" encoding="utf-8"?>\n'
               '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
               '    <background android:drawable="@color/ic_launcher_background"/>\n'
               '    <foreground android:drawable="@mipmap/' + nom + '_foreground"/>\n'
               '</adaptive-icon>\n')
        for suffixe in ("", "_round"):
            with open(os.path.join(adaptatif_dir, nom + suffixe + ".xml"), "w") as f:
                f.write(xml)
    print("Icones alternatives generees : " + ", ".join(i for i, _, _ in ICONES if i != "defaut"))


JAVA_PLUGIN = '''package com.sabi.app;

import android.content.ComponentName;
import android.content.pm.PackageManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Change l'icone de l'app : active l'alias choisi et desactive les autres. */
@CapacitorPlugin(name = "IconSwitcher")
public class IconSwitcherPlugin extends Plugin {
  private static final String[] NOMS = {%NOMS%};

  private ComponentName alias(String nom) {
    return new ComponentName(getContext().getPackageName(), "%PKG%.Icon" + Character.toUpperCase(nom.charAt(0)) + nom.substring(1));
  }

  @PluginMethod
  public void setIcon(PluginCall call) {
    String choisi = call.getString("name");
    boolean connu = false;
    for (String n : NOMS) { if (n.equals(choisi)) { connu = true; } }
    if (!connu) { call.reject("Icone inconnue"); return; }
    try {
      PackageManager pm = getContext().getPackageManager();
      // On active d'abord la nouvelle, puis on desactive les autres : l'app a toujours une icone.
      pm.setComponentEnabledSetting(alias(choisi), PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
      for (String n : NOMS) {
        if (!n.equals(choisi)) {
          pm.setComponentEnabledSetting(alias(n), PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
        }
      }
      JSObject res = new JSObject();
      res.put("name", choisi);
      call.resolve(res);
    } catch (Exception e) {
      call.reject("Changement d'icone impossible : " + e.getMessage());
    }
  }

  @PluginMethod
  public void getIcon(PluginCall call) {
    String actuel = "defaut";
    try {
      PackageManager pm = getContext().getPackageManager();
      for (String n : NOMS) {
        int etat = pm.getComponentEnabledSetting(alias(n));
        boolean actif = etat == PackageManager.COMPONENT_ENABLED_STATE_ENABLED
          || (etat == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT && n.equals("defaut"));
        if (actif) { actuel = n; break; }
      }
    } catch (Exception e) { /* on garde "defaut" */ }
    JSObject res = new JSObject();
    res.put("name", actuel);
    call.resolve(res);
  }
}
'''


def installer_plugin():
    os.makedirs(JAVA_DIR, exist_ok=True)
    noms = ", ".join('"' + i + '"' for i, _, _ in ICONES)
    with open(os.path.join(JAVA_DIR, "IconSwitcherPlugin.java"), "w") as f:
        f.write(JAVA_PLUGIN.replace("%NOMS%", noms).replace("%PKG%", PKG))
    main = os.path.join(JAVA_DIR, "MainActivity.java")
    with open(main) as f:
        src = f.read()
    if "IconSwitcherPlugin" not in src:
        marque = "super.onCreate(savedInstanceState);"
        if marque not in src:
            raise RuntimeError("MainActivity.java : super.onCreate introuvable")
        src = src.replace(marque, "registerPlugin(IconSwitcherPlugin.class);\n    " + marque, 1)
        with open(main, "w") as f:
            f.write(src)
    print("Plugin IconSwitcher installe et enregistre.")


def patcher_manifest(icones_ok=True):
    with open(MANIFEST, encoding="utf-8") as f:
        xml = f.read()
    if "activity-alias" in xml:
        print("Alias deja presents dans le manifeste, rien a faire.")
        return
    # 1) retire le filtre MAIN/LAUNCHER de MainActivity (chaque alias aura le sien)
    motif = re.compile(r"[ \t]*<intent-filter>(?:(?!</intent-filter>).)*?android\.intent\.category\.LAUNCHER(?:(?!</intent-filter>).)*?</intent-filter>[ \t]*\n?", re.S)
    xml, n = motif.subn("", xml, count=1)
    if n != 1:
        raise RuntimeError("filtre LAUNCHER introuvable dans le manifeste")
    # 2) ajoute un alias par icone (seul « defaut » est actif au depart)
    alias = ""
    for ident, _, _ in ICONES:
        nom = "ic_launcher" if (ident == "defaut" or not icones_ok) else "ic_launcher_" + ident
        alias += ('        <activity-alias\n'
                  '            android:name=".' + CLASSES[ident] + '"\n'
                  '            android:targetActivity=".MainActivity"\n'
                  '            android:enabled="' + ("true" if ident == "defaut" else "false") + '"\n'
                  '            android:exported="true"\n'
                  '            android:icon="@mipmap/' + nom + '"\n'
                  '            android:roundIcon="@mipmap/' + nom + '_round"\n'
                  '            android:label="@string/app_name">\n'
                  '            <intent-filter>\n'
                  '                <action android:name="android.intent.action.MAIN" />\n'
                  '                <category android:name="android.intent.category.LAUNCHER" />\n'
                  '            </intent-filter>\n'
                  '        </activity-alias>\n')
    if "</application>" not in xml:
        raise RuntimeError("</application> introuvable")
    xml = xml.replace("</application>", alias + "    </application>", 1)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        f.write(xml)
    print("Manifeste : " + str(len(ICONES)) + " alias d'icone declares.")


def patcher_micro():
    """Autorise le micro (assistante vocale Sabi)."""
    with open(MANIFEST, encoding="utf-8") as f:
        xml = f.read()
    ajout = ""
    for perm in ("android.permission.RECORD_AUDIO", "android.permission.MODIFY_AUDIO_SETTINGS"):
        if perm not in xml:
            ajout += '    <uses-permission android:name="' + perm + '" />\n'
    if not ajout:
        print("Permissions micro deja presentes.")
        return
    if "<application" not in xml:
        raise RuntimeError("<application introuvable")
    xml = xml.replace("<application", ajout + "    <application", 1)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        f.write(xml)
    print("Manifeste : permission micro ajoutee.")


def main():
    if not os.path.exists(MANIFEST):
        print("AndroidManifest.xml introuvable - icones alternatives ignorees.")
        return
    try:
        patcher_micro()
    except Exception as e:
        print("ATTENTION : permission micro non ajoutee (" + str(e) + ").")
    icones_ok = True
    try:
        generer_icones()
    except Exception as e:
        icones_ok = False
        print("ATTENTION : generation des icones coloree impossible (" + str(e) + "). Les alias utiliseront l'icone normale.")
    try:
        installer_plugin()
        patcher_manifest(icones_ok)
    except Exception as e:  # le build continue, l'app garde simplement son icone habituelle
        print("ATTENTION : icones alternatives non installees (" + str(e) + "). Le build continue sans elles.")


if __name__ == "__main__":
    main()
