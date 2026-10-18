import { test, expect } from '@playwright/test';

// The lab's values are shared by the whole server, so this runs in one project only.
test('the lab asks for the password, saves a change for everyone and can undo it', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'shared server state');
  await page.goto('/lab');
  await expect(page.locator('#labPanel')).toBeHidden();
  expect((await page.request.get('/api/lab')).status()).toBe(401);
  await page.fill('#labPassword', 'mal');
  await page.click('#labLogin button');
  await expect(page.locator('#labLoginError')).toHaveText('Contraseña incorrecta.');
  await page.fill('#labPassword', 'osolab-local');
  await page.click('#labLogin button');
  await expect(page.locator('#labPanel')).toBeVisible();
  await page.request.post('/api/lab', { data: { action: 'reset' } });
  await page.reload();
  await expect(page.locator('#labChart svg')).toBeVisible();
  await page.locator('[id="p-machine.easyAim"]').fill('0.3');
  await page.fill('#labNote', 'Prueba');
  await page.click('#labSave');
  await expect(page.locator('#labStatus')).toContainText('Guardado');
  expect((await (await page.request.get('/api/config')).json()).values).toEqual({ 'machine.easyAim': 0.3 });
  await page.locator('#labNotes button').first().click();
  await expect(page.locator('#labStatus')).toContainText('Guardado');
  expect((await (await page.request.get('/api/config')).json()).values).toEqual({});
});
