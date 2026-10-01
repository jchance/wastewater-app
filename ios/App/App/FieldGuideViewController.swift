import Foundation
import Capacitor

/// The bundled site is a multi-page Astro build where every page lives at
/// `some/path/index.html` and links point at `some/path/`. Capacitor's default
/// router treats any extensionless path as a single-page-app route and serves
/// the root `index.html`, which would turn every link into the home page.
struct FieldGuideRouter: Router {
    var basePath: String = ""

    func route(for path: String) -> String {
        guard URL(fileURLWithPath: path).pathExtension.isEmpty else {
            return basePath + path
        }

        let trimmed = path.hasSuffix("/") ? String(path.dropLast()) : path
        let page = basePath + trimmed + "/index.html"
        if FileManager.default.fileExists(atPath: page) {
            return page
        }

        let notFound = basePath + "/404.html"
        return FileManager.default.fileExists(atPath: notFound) ? notFound : basePath + "/index.html"
    }
}

class FieldGuideViewController: CAPBridgeViewController {
    override func router() -> Router {
        return FieldGuideRouter()
    }

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(FieldGuideChromePlugin())
    }
}

/// Lets each page match the strip behind the status bar to its header color
/// and pick status bar icons that suit the site's current light or dark theme.
@objc(FieldGuideChromePlugin)
public class FieldGuideChromePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FieldGuideChromePlugin"
    public let jsName = "FieldGuideChrome"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise)
    ]

    @objc func set(_ call: CAPPluginCall) {
        guard let color = UIColor(hex: call.getString("color") ?? "") else {
            call.reject("color must be #rrggbb")
            return
        }
        let dark = call.getBool("dark") ?? false
        DispatchQueue.main.async {
            if let webView = self.bridge?.webView {
                webView.backgroundColor = color
                webView.scrollView.backgroundColor = color
            }
            self.bridge?.viewController?.view.backgroundColor = color
            (self.bridge?.viewController as? CAPBridgeViewController)?
                .setStatusBarStyle(dark ? .lightContent : .darkContent)
            call.resolve()
        }
    }
}

private extension UIColor {
    convenience init?(hex: String) {
        let digits = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        guard digits.count == 6, let value = UInt32(digits, radix: 16) else { return nil }
        self.init(
            red: CGFloat((value >> 16) & 0xff) / 255,
            green: CGFloat((value >> 8) & 0xff) / 255,
            blue: CGFloat(value & 0xff) / 255,
            alpha: 1
        )
    }
}
