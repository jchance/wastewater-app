package com.wastewaterfieldguide.app;

import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

/**
 * The bundled site is a multi-page Astro build where every page lives at
 * some/path/index.html and links point at some/path/. Capacitor's local server
 * treats any extensionless path as a single-page-app route and serves the root
 * index.html, which would turn every link into the home page. This rewrites
 * those requests to the real page before Capacitor serves them.
 */
public class FieldGuideWebViewClient extends BridgeWebViewClient {

    private static final String ASSET_ROOT = "public";

    private final Bridge bridge;

    public FieldGuideWebViewClient(Bridge bridge) {
        super(bridge);
        this.bridge = bridge;
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        Uri url = request.getUrl();
        String path = url.getPath();
        String last = url.getLastPathSegment();

        if (bridge.getHost().equals(url.getHost()) && path != null && !path.equals("/") && (last == null || !last.contains("."))) {
            String trimmed = path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
            String page = assetExists(trimmed + "/index.html") ? trimmed + "/index.html" : "/404.html";
            Uri rewritten = url.buildUpon().path(page).build();
            return super.shouldInterceptRequest(view, new RewrittenRequest(request, rewritten));
        }

        return super.shouldInterceptRequest(view, request);
    }

    private boolean assetExists(String path) {
        try (InputStream ignored = bridge.getContext().getAssets().open(ASSET_ROOT + path)) {
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    private static final class RewrittenRequest implements WebResourceRequest {

        private final WebResourceRequest original;
        private final Uri url;

        RewrittenRequest(WebResourceRequest original, Uri url) {
            this.original = original;
            this.url = url;
        }

        @Override
        public Uri getUrl() {
            return url;
        }

        @Override
        public boolean isForMainFrame() {
            return original.isForMainFrame();
        }

        @Override
        public boolean isRedirect() {
            return original.isRedirect();
        }

        @Override
        public boolean hasGesture() {
            return original.hasGesture();
        }

        @Override
        public String getMethod() {
            return original.getMethod();
        }

        @Override
        public Map<String, String> getRequestHeaders() {
            return original.getRequestHeaders();
        }
    }
}
