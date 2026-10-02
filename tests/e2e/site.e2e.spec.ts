import { expect, test } from "@playwright/test";

test("loads home, calculator, and About routes", async ({ page }) => {
  for (const [path, heading] of [
    ["/", "Wastewater Field Guide"],
    ["/calculators/chemical-dosage/", "Chemical Dosage"],
    ["/about/", "About the Field Guide"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
  }
});

test("updates dosage results, reports invalid inputs, and loads the example", async ({ page }) => {
  await page.goto("/calculators/chemical-dosage/");

  const dose = page.getByLabel("Target dose");
  const pumpSetting = page.locator('[data-out="productMlPerMin"]');
  const error = page.locator("[data-error]");

  await expect(pumpSetting).toHaveText("420.6");
  await dose.fill("12");
  await expect(pumpSetting).toHaveText("841.2");

  await dose.fill("0");
  await expect(error).toBeVisible();
  await expect(error).toContainText("greater than zero");

  await page.getByRole("button", { name: "Put this example in the calculator" }).click();
  await expect(dose).toHaveValue("6");
  await expect(error).toBeHidden();
  await expect(pumpSetting).toHaveText("420.6");
});

test("cycles the theme preference and updates its accessible label", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => localStorage.setItem("starlight-theme", "light"));
  await page.goto("/");

  const themeButton = page.getByRole("button", { name: /Theme: Light/ });
  await expect(themeButton).toBeVisible();
  await themeButton.click();
  await expect(page.getByRole("button", { name: /Theme: Dark/ })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
