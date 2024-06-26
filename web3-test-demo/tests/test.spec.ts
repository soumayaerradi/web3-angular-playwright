import { test, expect } from "../fixtures";
import * as metamask from "@synthetixio/synpress/commands/metamask";
import { type Page } from "@playwright/test";

let sharedPage: Page;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ page }) => {
  sharedPage = page;
  await sharedPage.goto("http://localhost:3000");
});

test.afterAll(async ({}) => {
  await sharedPage.close();
});

test("acceptMetamaskAccess should accept connection request to metamask", async () => {
  await sharedPage.click("#connectButton");
  const connected = await metamask.acceptAccess();
  expect(connected).toBe(true);
  await expect(sharedPage.locator("#network")).toHaveText("sepolia");
  await expect(sharedPage.locator("#chainId")).toHaveText("11155111");
  await expect(sharedPage.locator("#accounts")).toHaveText(
    "0xc3c6f796335f9d1cceeb4f0ad92a21d6ad48a117"
  );
});

test("connect wallet using default metamask account", async () => {
  await sharedPage.click("#disconnect");
  await metamask.disconnectWalletFromAllDapps();
  await sharedPage.click("#connectButton");
  await metamask.acceptAccess();
  await expect(sharedPage.locator("#accounts")).toHaveText(
    "0xc3c6f796335f9d1cceeb4f0ad92a21d6ad48a117"
  );
});

test("import private key and connect wallet using imported metamask account", async () => {
  await sharedPage.click("#disconnect");
  await metamask.disconnectWalletFromAllDapps();
  await metamask.importAccount(
    "7f7fb59418ef0ca2583d1a7e899078347ab2e19d823fef3fb2d43497bde0fb9f"
  );
  await sharedPage.click("#connectButton");
  await metamask.acceptAccess();
  await expect(sharedPage.locator("#accounts")).toHaveText(
    "0x99207f24db020810b9b63fec17e1cfa1801e4c28"
  );
});

test("addMetamaskNetwork should add custom network", async () => {
  const networkAdded = await metamask.addNetwork({
    networkName: 'SePolia Testnet',
    rpcUrl: 'https://ethereum-sepolia.publicnode.com',
    chainId: '0xaa36a7',
    symbol: 'SEPOLIA',
    blockExplorer: 'https://sepolia.etherscan.io',
    isTestnet: true
  });
  expect(networkAdded).toBe(true);
  await sharedPage.click("#disconnect");
  await metamask.disconnectWalletFromAllDapps();
  await sharedPage.click("#connectButton");
  await metamask.acceptAccess();
  await expect(sharedPage.locator("#network")).toHaveText("sepolia");
  await expect(sharedPage.locator("#chainId")).toHaveText("11155111");
});

test("importMetamaskToken should import token to metamask and read token balance", async () => {
  const LINKContractAddress = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  const tokenData = await metamask.importToken(LINKContractAddress);
  expect(tokenData.tokenContractAddress).toBe(
    LINKContractAddress
  );
  expect(tokenData.tokenSymbol).toBe("LINK");
  expect(tokenData.tokenDecimals).toBe("18");
  expect(tokenData.imported).toBe(true);
  await sharedPage.click("#getBalance");
  await expect(sharedPage.locator("#balance")).not.toHaveText("");
});

test("rejectMetamaskTransaction should reject transaction for token transfer", async () => {
  await sharedPage.fill("#recipientInput", "0xc3c6f796335f9d1cceeb4f0ad92a21d6ad48a117");
  await sharedPage.fill("#amountInput", "2");
  await sharedPage.click("#transferButton");
  const rejected = await metamask.rejectTransaction();
  expect(rejected).toBe(true);
  await expect(sharedPage.locator("#transactionStatus")).toHaveText(
    "Transaction rejected"
  );
});

test("confirmMetamaskTransaction should confirm transaction for token transfer", async () => {
  await sharedPage.fill("#recipientInput", "0xc3c6f796335f9d1cceeb4f0ad92a21d6ad48a117");
  await sharedPage.fill("#amountInput", "2");
  await sharedPage.click("#transferButton");
  const transferred = await metamask.confirmTransferTransaction();
  expect(transferred).toBe(true);
  await expect(sharedPage.locator("#transactionStatus")).toHaveText(
    "Transaction confirmed",
    {timeout: 60000}
  );
});
