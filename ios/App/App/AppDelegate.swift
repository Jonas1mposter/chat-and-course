import UIKit
import Capacitor
import WebKit

class SuperbrainBridgeViewController: CAPBridgeViewController {

    override func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let configuration = super.webViewConfiguration(for: instanceConfiguration)
        // 视频相关：允许内联播放、允许自动播放（不要求用户手势）、允许画中画
        configuration.allowsInlineMediaPlayback = true
        configuration.allowsPictureInPictureMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.allowsAirPlayForMediaPlayback = true
        let script = WKUserScript(
            source: Self.chineseFontInjectionScript(),
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        configuration.userContentController.addUserScript(script)
        return configuration
    }

    private static func chineseFontInjectionScript() -> String {
        // 不再用 !important 强制覆盖字体：如果设备/模拟器缺少列表里的字体，
        // 强制覆盖会让 WebKit 无法回退到任何可用字体，整页变成 "?" 方块。
        // 这里只提供一个温和的默认值，最终交给 WebKit 自己回退。
        let css = """
        html, body {
          font-family: system-ui, -apple-system, 'PingFang SC', 'Heiti SC', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        html { -webkit-text-size-adjust: 100%; }
        """

        return """
        (function () {
          document.documentElement.setAttribute('lang', 'zh-CN');
          var meta = document.querySelector('meta[charset]');
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('charset', 'UTF-8');
            (document.head || document.documentElement).prepend(meta);
          }

          function installSuperbrainChineseFont() {
            if (document.querySelector('style[data-superbrain-chinese-font]')) return;
            var style = document.createElement('style');
            style.setAttribute('data-superbrain-chinese-font', 'true');
            style.textContent = `\(css)`;
            (document.head || document.documentElement).appendChild(style);
          }

          installSuperbrainChineseFont();
          document.addEventListener('DOMContentLoaded', installSuperbrainChineseFont, { once: true });
        })();
        """
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// MARK: - UIScene lifecycle

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = UIStoryboard(name: "Main", bundle: nil).instantiateInitialViewController()
        self.window = window
        window.makeKeyAndVisible()

        for context in connectionOptions.urlContexts {
            _ = ApplicationDelegateProxy.shared.application(
                UIApplication.shared,
                open: context.url,
                options: [
                    .sourceApplication: context.options.sourceApplication as Any,
                    .annotation: context.options.annotation as Any,
                ]
            )
        }

        if let userActivity = connectionOptions.userActivities.first {
            _ = ApplicationDelegateProxy.shared.application(
                UIApplication.shared,
                continue: userActivity,
                restorationHandler: { _ in }
            )
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            _ = ApplicationDelegateProxy.shared.application(
                UIApplication.shared,
                open: context.url,
                options: [
                    .sourceApplication: context.options.sourceApplication as Any,
                    .annotation: context.options.annotation as Any,
                ]
            )
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(
            UIApplication.shared,
            continue: userActivity,
            restorationHandler: { _ in }
        )
    }
}
