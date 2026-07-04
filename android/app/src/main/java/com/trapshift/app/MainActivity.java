package com.trapshift.app;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity — enables true edge-to-edge fullscreen on Android.
 *
 * The user reported "white borders on the side" persisting after the first
 * fullscreen pass. This version adds legacy-API fallbacks and explicit
 * transparent-bar / dark-window setup so devices at every API level 21+
 * paint under the system bars uniformly.
 *
 * Landscape orientation is locked via AndroidManifest.xml.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1) Ensure the Activity window paints under the status + nav bars.
        //    Modern API (androidx-core): edge-to-edge on API 21+.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // 2) Legacy fallback for older WebViews / OEM ROMs that don't fully
        //    honour WindowCompat until the WebView has actually attached —
        //    setting these flags before the WebView init guarantees the
        //    Activity window itself covers the whole screen.
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
            | WindowManager.LayoutParams.FLAG_LAYOUT_INSET_DECOR
            | WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS
            | WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION
        );

        // 3) Transparent system-bar backgrounds so the WebView content shows
        //    through if the immersive-hide toggles briefly on gesture reveal.
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        // 4) Dark window/decor background — any exposed area during layout or
        //    WebView cold-start reads as the game's dark palette (#020814),
        //    NOT the system default white. This is what actually kills the
        //    "white borders" complaint on many devices — Capacitor's default
        //    backgroundColor in capacitor.config only affects the WebView,
        //    not the underlying Activity window.
        int darkBg = Color.parseColor("#020814");
        getWindow().setBackgroundDrawable(new ColorDrawable(darkBg));
        getWindow().getDecorView().setBackgroundColor(darkBg);

        // 5) Sticky immersive: hide status + navigation bars. User swipes from
        //    edge to reveal briefly (does not steal input from the game).
        WindowInsetsControllerCompat controller =
            new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Re-assert immersive whenever the window regains focus (returning from
        // a permission dialog, ad interstitial, etc. — otherwise the system
        // bars stay visible).
        if (hasFocus) {
            WindowInsetsControllerCompat controller =
                new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
    }
}
