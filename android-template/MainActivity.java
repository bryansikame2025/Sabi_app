package com.sabi.app;

import android.os.Bundle;
import android.view.WindowManager;
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
  }
}
