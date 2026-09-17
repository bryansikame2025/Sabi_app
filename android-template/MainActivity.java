package com.sabi.app;

import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import java.util.Collections;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Bloque les captures d'ecran et l'enregistrement d'ecran au niveau du systeme
    // Android : toute tentative de capture produit une image/video totalement noire.
    getWindow().setFlags(
      WindowManager.LayoutParams.FLAG_SECURE,
      WindowManager.LayoutParams.FLAG_SECURE
    );

    // Sur Android 10+ avec la navigation par gestes, le systeme intercepte tout glissement
    // demarre pres du bord de l'ecran pour son propre geste "retour" global, avant meme que la
    // page web ne recoive l'evenement tactile. On exclut donc une bande verticale sur le bord
    // gauche de la zone geree par le systeme, pour que le balayage retour de l'app (implemente
    // en JS, voir index.html) recoive bien le geste a la place.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      final View racine = getWindow().getDecorView();
      racine.post(new Runnable() {
        @Override
        public void run() {
          int hauteur = racine.getHeight();
          int largeurExclusion = (int) (32 * getResources().getDisplayMetrics().density); // ~32dp
          Rect zone = new Rect(0, 0, largeurExclusion, hauteur);
          racine.setSystemGestureExclusionRects(Collections.singletonList(zone));
        }
      });
    }
  }
}

