package com.wastewaterfieldguide.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(FieldGuideChromePlugin.class);
        super.onCreate(savedInstanceState);
        bridge.setWebViewClient(new FieldGuideWebViewClient(bridge));
    }
}
