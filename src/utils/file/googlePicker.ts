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

    const view = new window.google.picker.View(
      window.google.picker.ViewId.DOCS
    );
    view.setMimeTypes(
      "application/epub+zip,application/pdf,text/plain,application/x-mobipocket-ebook"
    );

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(this.appId)
      .setOAuthToken(this.accessToken)
      .addView(view)
      .addView(new window.google.picker.DocsUploadView())
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

    const view = new window.google.picker.View(
      window.google.picker.ViewId.DOCS
    );
    view.setMimeTypes(
      "application/epub+zip,application/pdf,text/plain,application/x-mobipocket-ebook"
    );

    // 使用新的setFileIds方法
    if (view.setFileIds && fileIds.length > 0) {
      view.setFileIds(fileIds);
    }

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
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
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,mimeType,modifiedTime`,
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
}
