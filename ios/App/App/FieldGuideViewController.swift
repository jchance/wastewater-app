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
}
