import { expect, test } from "@playwright/test";
import { _electron as electron } from "playwright";
import path from "node:path";

test("manager -> reader -> page turn -> notes -> close", async () => {
  const app = await electron.launch({
    args: [".", "--no-sandbox"],
    cwd: path.resolve(__dirname, ".."),
    env: {
      ...process.env,
      ELECTRON_IS_DEV: "0",
    },
  });

  try {
    const manager = await app.firstWindow();
    await manager.waitForSelector(".book-item-image", { timeout: 60000 });
    await expect(manager.locator("body")).toContainText("全部图书");

    await manager.locator(".book-item-image").first().click();

    const reader = await app.waitForEvent("window", { timeout: 60000 });
    await reader.waitForSelector("#page-area, iframe", { timeout: 60000 });
    await expect(reader.locator("body")).toContainText("目录");

    await reader.keyboard.press("ArrowRight");
    await reader.waitForTimeout(800);

    const noteTab = reader.getByText("笔记", { exact: true }).first();
    if (await noteTab.count()) {
      await noteTab.dispatchEvent("click");
      await reader.waitForTimeout(500);
    }
    await expect(reader.locator("body")).toContainText(/笔记|Note/);
  } finally {
    await app.close();
  }
});
