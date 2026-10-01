package com.wastewaterfieldguide.app;

import android.graphics.Color;
import android.view.View;
import android.view.Window;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Lets each page match the strip behind the status bar to its header color
 * and pick status bar icons that suit the site's current light or dark theme.
 */
@CapacitorPlugin(name = "FieldGuideChrome")
public class FieldGuideChromePlugin extends Plugin {

    @PluginMethod
    public void set(PluginCall call) {
        int color;
        try {
            color = Color.parseColor(call.getString("color", ""));
        } catch (IllegalArgumentException e) {
            call.reject("color must be #rrggbb");
            return;
        }
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));

        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            View decor = window.getDecorView();
            decor.setBackgroundColor(color);
            new WindowInsetsControllerCompat(window, decor).setAppearanceLightStatusBars(!dark);
            call.resolve();
        });
    }
}
