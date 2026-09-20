package com.sabi.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

// Variante SANS FLAG_SECURE, utilisee uniquement pour prendre les captures d'ecran
// destinees a la fiche Play Store (le blocage des captures empeche aussi le
// developpeur lui-meme de faire des captures, y compris via un cable/ordinateur).
// Ne JAMAIS publier une app compilee avec ce fichier — c'est la version normale
// (android-template/MainActivity.java, avec FLAG_SECURE) qui doit aller sur le Play Store.
public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
  }
}
