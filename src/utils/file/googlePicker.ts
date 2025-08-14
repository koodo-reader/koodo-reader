declare var window: any;
export class GooglePickerUtil {
  private accessToken: string;
  private apiKey: string;
  private appId: string;

  constructor(config: { accessToken: string; apiKey: string; appId: string }) {
    this.accessToken = config.accessToken;
    this.apiKey = config.apiKey;
    this.appId = config.appId;
  }

  // 加载Google Picker API
  private loadPickerApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi && window.gapi.load) {
        window.gapi.load("picker", {
          callback: resolve,
          onerror: reject,
        });
      } else {
        // 加载Google API库
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => {
          window.gapi.load("picker", {
            callback: resolve,
            onerror: reject,
          });
        };
        script.onerror = reject;
        document.head.appendChild(script);
      }
    });
  }

  // 创建并显示文件选择器
  async createPicker(callback: (data: any) => void): Promise<void> {
    await this.loadPickerApi();

    // 创建文档视图，显示完整的文件夹结构
    const docsView = new window.google.picker.DocsView(
      window.google.picker.ViewId.DOCS
    )
      .setIncludeFolders(true) // 启用文件夹显示
      .setSelectFolderEnabled(false) // 禁用选择文件夹（只能选择文件）
      .setMimeTypes(
        [
          "application/epub+zip", // .epub
          "application/pdf", // .pdf
          "text/plain", // .txt
          "application/x-mobipocket-ebook", // .mobi
          "application/vnd.amazon.ebook", // .azw, .azw3
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
          "text/markdown", // .md
          "application/x-fictionbook+xml", // .fb2
          "application/vnd.comicbook+zip", // .cbz
          "application/vnd.comicbook+tar", // .cbt
          "application/vnd.comicbook-rar", // .cbr
          "application/vnd.comicbook+7z", // .cb7
        ].join(",")
      );

    // 创建文件夹视图，用于更好的文件夹导航
    const folderView = new window.google.picker.DocsView(
      window.google.picker.ViewId.FOLDERS
    )
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      // 移除 NAV_HIDDEN 特性，这样可以显示导航面板
      // .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .setDeveloperKey(this.apiKey)
      .setAppId(this.appId)
      .setOAuthToken(this.accessToken)
      .addView(docsView)
      .addView(folderView)
      .setCallback(callback)
      .build();

    picker.setVisible(true);
  }

  // 创建简化版本的选择器，只显示文档视图
  async createSimplePicker(callback: (data: any) => void): Promise<void> {
    await this.loadPickerApi();

    // 使用标准的文档视图，保持文件夹结构
    const view = new window.google.picker.View(
      window.google.picker.ViewId.DOCS
    );

    // 设置支持的文件类型
    view.setMimeTypes(
      [
        "application/epub+zip", // .epub
        "application/pdf", // .pdf
        "text/plain", // .txt
        "application/x-mobipocket-ebook", // .mobi
        "application/vnd.amazon.ebook", // .azw, .azw3
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "text/markdown", // .md
        "application/x-fictionbook+xml", // .fb2
        "application/vnd.comicbook+zip", // .cbz
        "application/vnd.comicbook+tar", // .cbt
        "application/vnd.comicbook-rar", // .cbr
        "application/vnd.comicbook+7z", // .cb7
      ].join(",")
    );

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setDeveloperKey(this.apiKey)
      .setAppId(this.appId)
      .setOAuthToken(this.accessToken)
      .addView(view)
      .setCallback(callback)
      .build();

    picker.setVisible(true);
  }

  // 创建带有特定起始文件夹的选择器
  async createPickerWithStartFolder(
    startFolderId: string,
    callback: (data: any) => void
  ): Promise<void> {
    await this.loadPickerApi();

    const view = new window.google.picker.DocsView(
      window.google.picker.ViewId.DOCS
    )
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false)
      .setParent(startFolderId) // 设置起始文件夹
      .setMimeTypes(
        [
          "application/epub+zip",
          "application/pdf",
          "text/plain",
          "application/x-mobipocket-ebook",
          "application/vnd.amazon.ebook",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/markdown",
          "application/x-fictionbook+xml",
          "application/vnd.comicbook+zip",
          "application/vnd.comicbook+tar",
          "application/vnd.comicbook-rar",
          "application/vnd.comicbook+7z",
        ].join(",")
      );

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setDeveloperKey(this.apiKey)
      .setAppId(this.appId)
      .setOAuthToken(this.accessToken)
      .addView(view)
      .setCallback(callback)
      .build();

    picker.setVisible(true);
  }

  // 使用新的setFileIds方法预选文件
  async createPickerWithFileIds(
    fileIds: string[],
    callback: (data: any) => void
  ): Promise<void> {
    await this.loadPickerApi();

    const view = new window.google.picker.DocsView(
      window.google.picker.ViewId.DOCS
    )
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false)
      .setMimeTypes(
        "application/epub+zip,application/pdf,text/plain,application/x-mobipocket-ebook"
      );

    // 使用新的setFileIds方法（2025年1月新功能）
    if (view.setFileIds && fileIds.length > 0) {
      view.setFileIds(fileIds);
    }

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setDeveloperKey(this.apiKey)
      .setAppId(this.appId)
      .setOAuthToken(this.accessToken)
      .addView(view)
      .setCallback(callback)
      .build();

    picker.setVisible(true);
  }

  // 下载选中的文件
  async downloadFile(fileId: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  }

  // 获取文件元数据
  async getFileMetadata(fileId: string): Promise<any> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,mimeType,modifiedTime,parents`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get file metadata: ${response.statusText}`);
    }

    return await response.json();
  }

  // 获取文件夹信息
  async getFolderInfo(folderId: string): Promise<any> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get folder info: ${response.statusText}`);
    }

    return await response.json();
  }
}
