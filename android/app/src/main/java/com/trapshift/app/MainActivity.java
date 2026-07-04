package com.trapshift.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity — enables true fullscreen on Android:
 *   1. Edge-to-edge: WindowCompat.setDecorFitsSystemWindows(false)
 *      makes the WebView paint under the status + navigation bars instead of
 *      being inset by them, which eliminates the white borders that appear
 *      around the game canvas on devices with translucent-system-bar defaults.
 *   2. Sticky immersive: system bars are hidden by default, and briefly revealed
 *      via a transient swipe-from-edge gesture (does not steal input). This
 *      keeps the game in fullscreen during play but still lets users access
 *      Android navigation when they need it.
 *
 * The activity itself is locked to landscape via AndroidManifest.xml.
 * Horizontal safe-area insets (for gesture-nav / cutout devices) are handled
 * on the web side via env(safe-area-inset-left/right) in the CSS root.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Edge-to-edge: let the WebView paint under system bars.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Sticky immersive: hide status + navigation bars until user swipes from edge.
        WindowInsetsControllerCompat controller =
            new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
