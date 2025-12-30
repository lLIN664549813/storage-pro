// 创建DevTools面板
chrome.devtools.panels.create(
  'Storage Pro',
  'assets/icon-48.png',
  'index.html',
  (panel) => {
    // 面板显示时的回调
    panel.onShown.addListener((window) => {
      // 可以在这里添加面板显示时的逻辑
    });

    // 面板隐藏时的回调
    panel.onHidden.addListener(() => {
      // 可以在这里添加面板隐藏时的逻辑
    });
  }
);
