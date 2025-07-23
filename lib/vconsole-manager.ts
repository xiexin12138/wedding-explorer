/**
 * vConsole 管理器 - 提供全局单例和日志持久化功能
 * 
 * 功能特性：
 * 1. 真正的单例模式，确保全局唯一实例
 * 2. 日志持久化，确保调试信息不丢失
 * 3. 全局挂载，可在任何地方访问
 * 4. 自动管理生命周期
 * 5. 提供丰富的调试工具接口
 */

// 定义 vConsole 接口
export interface VConsoleInstance {
  destroy: () => void;
  show: () => void;
  hide: () => void;
  showSwitch: () => void;
  hideSwitch: () => void;
}

// 扩展 Window 接口
declare global {
  interface Window {
    vConsole?: VConsoleInstance;
    clearDebugMode?: () => void;
    enableDebugMode?: () => void;
    toggleDebugMode?: () => void;
    getDebugStatus?: () => boolean;
    showVConsole?: () => void;
    hideVConsole?: () => void;
    updateVConsoleTheme?: (theme: 'light' | 'dark') => void;
  }
}

// 调试模式的 sessionStorage key
const DEBUG_MODE_KEY = 'debug_mode_enabled';

/**
 * vConsole 单例管理器
 */
export class VConsoleManager {
  private static instance: VConsoleManager;
  private vConsoleInstance: VConsoleInstance | null = null;
  private isInitializing = false;
  private initPromise: Promise<VConsoleInstance | null> | null = null;
  private logBuffer: Array<{ type: string; message: string; timestamp: number }> = [];
  private hasInitialized = false; // 标记是否已经初始化过
  private hasSetupGlobalTools = false; // 标记是否已经设置过全局工具
  private currentTheme: 'light' | 'dark' = 'dark'; // 当前主题

  private constructor() {
    // 初始化时开始收集日志
    this.startLogCollection();
  }

  public static getInstance(): VConsoleManager {
    if (!VConsoleManager.instance) {
      VConsoleManager.instance = new VConsoleManager();
    }
    return VConsoleManager.instance;
  }

  /**
   * 初始化 vConsole（单例模式）
   */
  public async initVConsole(): Promise<VConsoleInstance | null> {
    // 如果正在初始化，返回现有的 Promise
    if (this.initPromise) {
      return this.initPromise;
    }

    // 如果已经初始化，直接返回实例
    if (this.vConsoleInstance) {
      return this.vConsoleInstance;
    }

    // 防止重复初始化
    if (this.isInitializing) {
      return null;
    }

    this.isInitializing = true;
    this.initPromise = this._createVConsoleInstance();
    
    try {
      this.vConsoleInstance = await this.initPromise;
      this.hasInitialized = true;
      return this.vConsoleInstance;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  /**
   * 创建 vConsole 实例
   */
  private async _createVConsoleInstance(): Promise<VConsoleInstance | null> {
    try {
      // 只在第一次初始化时打印信息
      if (!this.hasInitialized) {
        console.log("🔧 正在初始化 vConsole...");
      }
      
      const VConsole = await import("vconsole");
      const vConsole = new VConsole.default({
        theme: this.currentTheme, // 使用当前主题
        defaultPlugins: ["system", "network", "element", "storage"], // 默认插件
        maxLogNumber: 10000, // 增加最大日志数量，确保日志持久化
        onReady: () => {
          // 只在第一次初始化时打印信息
          if (!this.hasInitialized) {
            console.log("✅ vConsole 已准备就绪");
            console.log("💡 调试工具命令:");
            console.log("   - window.enableDebugMode() - 启用调试模式");
            console.log("   - window.clearDebugMode() - 清除调试模式");
            console.log("   - window.toggleDebugMode() - 切换调试模式");
            console.log("   - window.getDebugStatus() - 获取调试状态");
            console.log("   - window.showVConsole() - 显示 vConsole");
            console.log("   - window.hideVConsole() - 隐藏 vConsole");
            console.log("   - window.updateVConsoleTheme('light'|'dark') - 更新主题");
          }
          
          // 初始化完成后，输出缓存的日志
          this.outputBufferedLogs();
        },
        onClearLog: () => {
          console.log("🧹 日志已清除");
          this.clearLogBuffer();
        },
      });

      // 只在第一次初始化时打印信息
      if (!this.hasInitialized) {
        console.log("🎉 vConsole 调试工具已加载完成");
        console.log("📱 在移动设备上点击右下角的 vConsole 图标来打开调试面板");
        console.log("💻 在桌面设备上按 F12 或右键检查元素来查看调试信息");
      }
      
      return vConsole;
    } catch (error) {
      console.error("❌ 加载 vConsole 失败:", error);
      return null;
    }
  }

  /**
   * 销毁 vConsole 实例
   */
  public destroyVConsole(): void {
    if (this.vConsoleInstance) {
      try {
        this.vConsoleInstance.destroy();
        console.log("🔧 vConsole 实例已销毁");
      } catch (error) {
        console.error("❌ 销毁 vConsole 失败:", error);
      } finally {
        this.vConsoleInstance = null;
      }
    }
  }

  /**
   * 获取 vConsole 实例
   */
  public getVConsoleInstance(): VConsoleInstance | null {
    return this.vConsoleInstance;
  }

  /**
   * 检查是否已初始化
   */
  public isInitialized(): boolean {
    return this.vConsoleInstance !== null;
  }

  /**
   * 检查是否已经初始化过（用于控制日志输出）
   */
  public hasBeenInitialized(): boolean {
    return this.hasInitialized;
  }

  /**
   * 检查是否已经设置过全局工具
   */
  public isGlobalToolsSetup(): boolean {
    return this.hasSetupGlobalTools;
  }

  /**
   * 标记已设置全局工具
   */
  public markGlobalToolsSetup(): void {
    this.hasSetupGlobalTools = true;
  }

  /**
   * 显示 vConsole
   */
  public showVConsole(): void {
    if (this.vConsoleInstance) {
      this.vConsoleInstance.show();
    }
  }

  /**
   * 隐藏 vConsole
   */
  public hideVConsole(): void {
    if (this.vConsoleInstance) {
      this.vConsoleInstance.hide();
    }
  }

  /**
   * 更新 vConsole 主题
   */
  public updateTheme(theme: 'light' | 'dark'): void {
    this.currentTheme = theme;
    
    // 如果 vConsole 已经初始化，需要重新创建实例
    if (this.vConsoleInstance) {
      console.log(`🎨 正在更新 vConsole 主题为: ${theme}`);
      
      // 销毁当前实例
      this.destroyVConsole();
      
      // 重新初始化
      this.initVConsole().catch((error) => {
        console.error("❌ 重新初始化 vConsole 失败:", error);
      });
    }
  }

  /**
   * 获取当前主题
   */
  public getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  /**
   * 开始收集日志
   */
  private startLogCollection(): void {
    if (typeof window === 'undefined') return;

    // 重写 console 方法以收集日志
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    // 收集日志到缓冲区
    const addToBuffer = (type: string, ...args: unknown[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      this.logBuffer.push({
        type,
        message,
        timestamp: Date.now(),
      });

      // 限制缓冲区大小
      if (this.logBuffer.length > 1000) {
        this.logBuffer = this.logBuffer.slice(-500);
      }
    };

    // 重写 console 方法
    console.log = (...args: unknown[]) => {
      addToBuffer('log', ...args);
      originalConsole.log(...args);
    };

    console.warn = (...args: unknown[]) => {
      addToBuffer('warn', ...args);
      originalConsole.warn(...args);
    };

    console.error = (...args: unknown[]) => {
      addToBuffer('error', ...args);
      originalConsole.error(...args);
    };

    console.info = (...args: unknown[]) => {
      addToBuffer('info', ...args);
      originalConsole.info(...args);
    };
  }

  /**
   * 输出缓存的日志
   */
  private outputBufferedLogs(): void {
    if (this.logBuffer.length > 0) {
      console.log(`📋 输出 ${this.logBuffer.length} 条缓存的日志:`);
      this.logBuffer.forEach(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        console.log(`[${time}] ${log.type.toUpperCase()}: ${log.message}`);
      });
    }
  }

  /**
   * 清除日志缓冲区
   */
  private clearLogBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * 获取日志缓冲区
   */
  public getLogBuffer(): Array<{ type: string; message: string; timestamp: number }> {
    return [...this.logBuffer];
  }
}

/**
 * 全局调试模式管理器
 */
export class DebugModeManager {
  private static instance: DebugModeManager;
  private vConsoleManager: VConsoleManager;

  private constructor() {
    this.vConsoleManager = VConsoleManager.getInstance();
  }

  public static getInstance(): DebugModeManager {
    if (!DebugModeManager.instance) {
      DebugModeManager.instance = new DebugModeManager();
    }
    return DebugModeManager.instance;
  }

  /**
   * 启用调试模式
   */
  public async enableDebugMode(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // 只在第一次启用时打印信息
      if (!this.vConsoleManager.hasBeenInitialized()) {
        console.log("🔧 正在启用调试模式...");
      }
      
      // 设置 sessionStorage
      sessionStorage.setItem(DEBUG_MODE_KEY, 'true');
      
      // 获取当前主题（如果可用）
      this.updateThemeFromSystem();
      
      // 初始化 vConsole
      await this.vConsoleManager.initVConsole();
      
      // 只在第一次启用时打印信息
      if (!this.vConsoleManager.hasBeenInitialized()) {
        console.log("✅ 调试模式已启用");
      }
    } catch (error) {
      console.error("❌ 启用调试模式失败:", error);
    }
  }

  /**
   * 清除调试模式
   */
  public clearDebugMode(): void {
    if (typeof window === 'undefined') return;

    try {
      console.log("🔧 正在清除调试模式...");
      
      // 销毁 vConsole 实例
      this.vConsoleManager.destroyVConsole();
      
      // 清除 sessionStorage
      sessionStorage.removeItem(DEBUG_MODE_KEY);
      
      console.log("✅ 调试模式已清除");
      
      // 刷新页面以完全清除调试状态
      window.location.reload();
    } catch (error) {
      console.error("❌ 清除调试模式失败:", error);
    }
  }

  /**
   * 切换调试模式
   */
  public async toggleDebugMode(): Promise<void> {
    if (this.isDebugModeEnabled()) {
      this.clearDebugMode();
    } else {
      await this.enableDebugMode();
    }
  }

  /**
   * 检查调试模式是否启用
   */
  public isDebugModeEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(DEBUG_MODE_KEY) === 'true';
  }

  /**
   * 获取调试状态
   */
  public getDebugStatus(): boolean {
    return this.isDebugModeEnabled() && this.vConsoleManager.isInitialized();
  }

  /**
   * 获取 vConsole 管理器实例
   */
  public getVConsoleManager(): VConsoleManager {
    return this.vConsoleManager;
  }

  /**
   * 从系统获取当前主题
   */
  private updateThemeFromSystem(): void {
    if (typeof window === 'undefined') return;

    // 检查是否有主题相关的类名
    const htmlElement = document.documentElement;
    const isDark = htmlElement.classList.contains('dark');
    const theme = isDark ? 'dark' : 'light';
    
    // 更新 vConsole 主题
    this.vConsoleManager.updateTheme(theme);
  }
}

// 全局调试模式管理器实例
export const debugModeManager = DebugModeManager.getInstance();

/**
 * 设置全局调试工具
 */
export function setupGlobalDebugTools(): void {
  if (typeof window === 'undefined') return;

  // 检查是否已经设置过全局工具
  if (debugModeManager.getVConsoleManager().isGlobalToolsSetup()) {
    return; // 已经设置过，直接返回
  }

  // 清除调试模式
  window.clearDebugMode = () => {
    debugModeManager.clearDebugMode();
  };

  // 启用调试模式
  window.enableDebugMode = async () => {
    await debugModeManager.enableDebugMode();
  };

  // 切换调试模式
  window.toggleDebugMode = async () => {
    await debugModeManager.toggleDebugMode();
  };

  // 获取调试状态
  window.getDebugStatus = () => {
    return debugModeManager.getDebugStatus();
  };

  // 显示 vConsole
  window.showVConsole = () => {
    debugModeManager.getVConsoleManager().showVConsole();
  };

  // 隐藏 vConsole
  window.hideVConsole = () => {
    debugModeManager.getVConsoleManager().hideVConsole();
  };

  // 更新 vConsole 主题
  window.updateVConsoleTheme = (theme: 'light' | 'dark') => {
    debugModeManager.getVConsoleManager().updateTheme(theme);
  };

  // 将 vConsole 实例暴露到全局
  Object.defineProperty(window, 'vConsole', {
    get: () => debugModeManager.getVConsoleManager().getVConsoleInstance(),
    configurable: true,
  });

  // 标记已设置全局工具
  debugModeManager.getVConsoleManager().markGlobalToolsSetup();

  console.log("🔧 全局调试工具已设置");
  console.log("💡 可用命令:");
  console.log("   - window.enableDebugMode() - 启用调试模式");
  console.log("   - window.clearDebugMode() - 清除调试模式");
  console.log("   - window.toggleDebugMode() - 切换调试模式");
  console.log("   - window.getDebugStatus() - 获取调试状态");
  console.log("   - window.showVConsole() - 显示 vConsole");
  console.log("   - window.hideVConsole() - 隐藏 vConsole");
  console.log("   - window.updateVConsoleTheme('light'|'dark') - 更新主题");
} 